import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const screenshotsDir = join(process.cwd(), 'playwright', 'screenshots');
    
    // ディレクトリが存在するかチェック
    try {
      await stat(screenshotsDir);
    } catch (error) {
      return NextResponse.json({ 
        success: true, 
        screenshots: [],
        message: 'Screenshots directory not found'
      });
    }

    // ファイル一覧を取得
    const files = await readdir(screenshotsDir);
    
    // 画像ファイルのみフィルタリング
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const screenshots = [];
    
    for (const file of files) {
      const filePath = join(screenshotsDir, file);
      const stats = await stat(filePath);
      
      if (stats.isFile() && imageExtensions.some(ext => file.toLowerCase().endsWith(ext))) {
        screenshots.push({
          filename: file,
          path: `/api/screenshots/serve/${file}`,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString()
        });
      }
    }
    
    // 作成日時でソート（新しい順）
    screenshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      screenshots,
      total: screenshots.length
    });
    
  } catch (error) {
    console.error('Error listing screenshots:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list screenshots',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
