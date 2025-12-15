import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ScreenshotOptions, ScreenshotResult } from '@/types/screenshot';
import path from 'path';
import fs from 'fs/promises';

export class ScreenshotService {
  private browser: Browser | null = null;

  /**
   * 複数URLのスクリーンショットを並列で取得
   */
  async captureScreenshots(
    urls: string[],
    options: Required<ScreenshotOptions>
  ): Promise<ScreenshotResult[]> {
    console.log(`🚀 Starting screenshot capture for ${urls.length} URLs`);
    
    try {
      // ブラウザ起動
      await this.initBrowser();
      
      // スクリーンショット保存ディレクトリの確保
      await this.ensureScreenshotDirectory();

      // 並列処理でスクリーンショット取得（最大並列数制限）
      const results: ScreenshotResult[] = [];
      
      for (let i = 0; i < urls.length; i += options.maxConcurrency) {
        const batch = urls.slice(i, i + options.maxConcurrency);
        console.log(`📦 Processing batch ${Math.floor(i / options.maxConcurrency) + 1} (${batch.length} URLs)`);
        
        const batchPromises = batch.map(url => 
          this.captureScreenshot(url, options)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Promise.allSettledの結果を処理
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              url: batch[j],
              success: false,
              error: `Batch processing failed: ${result.reason}`
            });
          }
        }
      }

      return results;
      
    } finally {
      // ブラウザクリーンアップ
      await this.cleanup();
    }
  }

  /**
   * 単一URLのスクリーンショット取得
   */
  private async captureScreenshot(
    url: string,
    options: Required<ScreenshotOptions>
  ): Promise<ScreenshotResult> {
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    
    try {
      console.log(`📸 Capturing screenshot for: ${url}`);
      
      // URL形式の基本チェック
      if (!this.isValidUrl(url)) {
        return {
          url,
          success: false,
          error: 'Invalid URL format'
        };
      }

      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      // ブラウザコンテキストとページの作成
      context = await this.browser.newContext({
        viewport: {
          width: options.width,
          height: options.height
        },
        // 基本的なセキュリティ設定
        ignoreHTTPSErrors: true,
      });

      page = await context.newPage();

      // タイムアウト設定
      page.setDefaultTimeout(30000); // 30秒

      // ページ読み込み
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // 追加の待機時間
      if (options.delay > 0) {
        await page.waitForTimeout(options.delay);
      }

      // ファイル名生成
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const urlPart = this.sanitizeFileName(url);
      const fileName = `${urlPart}_${timestamp}.png`;
      const filePath = path.join(process.cwd(), 'playwright', 'screenshots', fileName);

      // スクリーンショット撮影
      await page.screenshot({
        path: filePath,
        fullPage: options.fullPage,
        type: 'png'
      });

      console.log(`✅ Screenshot saved: ${fileName}`);

      return {
        url,
        success: true,
        filePath: `playwright/screenshots/${fileName}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to capture screenshot for ${url}:`, error);
      
      return {
        url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
    } finally {
      // リソースクリーンアップ
      if (page) {
        await page.close().catch(console.error);
      }
      if (context) {
        await context.close().catch(console.error);
      }
    }
  }

  /**
   * ブラウザ初期化
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) {
      return;
    }

    console.log('🌐 Launching browser...');
    this.browser = await chromium.launch({
      headless: true, // 本番環境ではheadless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions'
      ]
    });
    console.log('✅ Browser launched successfully');
  }

  /**
   * スクリーンショット保存ディレクトリの確保
   */
  private async ensureScreenshotDirectory(): Promise<void> {
    const screenshotDir = path.join(process.cwd(), 'playwright', 'screenshots');
    
    try {
      await fs.access(screenshotDir);
    } catch {
      console.log('📁 Creating screenshots directory...');
      await fs.mkdir(screenshotDir, { recursive: true });
      console.log('✅ Screenshots directory created');
    }
  }

  /**
   * URL形式の基本チェック
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * ファイル名に使用できない文字を除去/置換
   */
  private sanitizeFileName(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const path = parsedUrl.pathname;
      
      // ドメイン + パス の一部を使用
      let fileName = domain;
      if (path && path !== '/') {
        fileName += path.replace(/\//g, '_');
      }
      
      // ファイル名に使用できない文字を置換
      return fileName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 50) // 長すぎる場合は切り詰め
        .replace(/_+/g, '_') // 連続するアンダースコアを1つに
        .replace(/^_|_$/g, ''); // 先頭・末尾のアンダースコアを除去
        
    } catch {
      // URL解析に失敗した場合はタイムスタンプを使用
      return 'screenshot';
    }
  }

  /**
   * リソースクリーンアップ
   */
  private async cleanup(): Promise<void> {
    if (this.browser) {
      console.log('🧹 Closing browser...');
      await this.browser.close();
      this.browser = null;
      console.log('✅ Browser closed');
    }
  }
}