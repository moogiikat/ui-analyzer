import { NextRequest, NextResponse } from 'next/server';
import { ScreenshotRequest, ScreenshotResponse, ScreenshotResult, DEFAULT_SCREENSHOT_OPTIONS } from '@/types/screenshot';
import { ScreenshotService } from '@/lib/screenshot-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // リクエストの基本バリデーション
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          results: [],
          summary: { total: 0, successful: 0, failed: 0 },
          message: 'Invalid request body'
        } as ScreenshotResponse,
        { status: 400 }
      );
    }

    const { urls, options = {} }: ScreenshotRequest = body;

    // URLsの検証
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          summary: { total: 0, successful: 0, failed: 0 },
          message: 'URLs array is required and must not be empty'
        } as ScreenshotResponse,
        { status: 400 }
      );
    }

    // URL数の制限（あまりにも多い場合は制限）
    if (urls.length > 50) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          summary: { total: 0, successful: 0, failed: 0 },
          message: 'Maximum 50 URLs allowed per request'
        } as ScreenshotResponse,
        { status: 400 }
      );
    }

    // オプションのマージ
    const finalOptions = {
      ...DEFAULT_SCREENSHOT_OPTIONS,
      ...options
    };

    console.log(`📸 Starting screenshot capture for ${urls.length} URLs with options:`, finalOptions);

    // ScreenshotServiceでスクリーンショット実行
    const screenshotService = new ScreenshotService();
    const results = await screenshotService.captureScreenshots(urls, finalOptions);

    // レスポンスの作成
    const successful = results.filter((r: ScreenshotResult) => r.success).length;
    const failed = results.length - successful;

    const response: ScreenshotResponse = {
      success: successful > 0,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      },
      message: `Captured ${successful}/${results.length} screenshots successfully`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Screenshot API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        results: [],
        summary: { total: 0, successful: 0, failed: 0 },
        message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      } as ScreenshotResponse,
      { status: 500 }
    );
  }
}

// GET method for API documentation
export async function GET() {
  return NextResponse.json({
    message: 'Screenshot API',
    usage: {
      method: 'POST',
      endpoint: '/api/screenshots',
      body: {
        urls: ['https://example.com', 'https://github.com'],
        options: {
          width: 1280,
          height: 720,
          fullPage: true,
          delay: 1000,
          maxConcurrency: 3
        }
      }
    },
    example: `curl -X POST http://localhost:3000/api/screenshots \\
  -H "Content-Type: application/json" \\
  -d '{"urls": ["https://example.com"], "options": {"fullPage": true}}'`
  });
}