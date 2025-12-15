# Screenshot API ドキュメント

## 概要

URLリストを受け取り、各URLのスクリーンショットを並列で取得するAPIです。取得したスクリーンショットは `playwright/screenshots/` ディレクトリに保存されます。

## エンドポイント

- **URL**: `/api/screenshots`
- **Method**: `POST`
- **Content-Type**: `application/json`

## リクエスト形式

```typescript
{
  urls: string[];                    // 必須: スクリーンショットを取得するURLの配列
  options?: {                        // オプション: 設定オプション
    width?: number;                  // ビューポート幅 (デフォルト: 1280)
    height?: number;                 // ビューポート高さ (デフォルト: 720)
    fullPage?: boolean;              // フルページキャプチャ (デフォルト: true)
    delay?: number;                  // ページ読み込み後の待機時間(ms) (デフォルト: 1000)
    maxConcurrency?: number;         // 最大並列数 (デフォルト: 3)
  }
}
```

## レスポンス形式

```typescript
{
  success: boolean;                  // 全体の成功/失敗
  results: [                         // 各URLの処理結果
    {
      url: string;                   // 対象URL
      success: boolean;              // 個別の成功/失敗
      filePath?: string;             // 保存されたファイルパス（成功時のみ）
      timestamp?: string;            // 処理日時（成功時のみ）
      error?: string;                // エラーメッセージ（失敗時のみ）
    }
  ];
  summary: {                         // 処理結果サマリー
    total: number;                   // 総URL数
    successful: number;              // 成功数
    failed: number;                  // 失敗数
  };
  message?: string;                  // 全体メッセージ
}
```

## 使用例

### 1. curl を使用

```bash
# 基本的な使用例
curl -X POST http://localhost:3000/api/screenshots \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://github.com"
    ]
  }'

# オプション付きの使用例
curl -X POST http://localhost:3000/api/screenshots \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://stackoverflow.com",
      "https://docs.github.com"
    ],
    "options": {
      "width": 1920,
      "height": 1080,
      "delay": 2000,
      "maxConcurrency": 2
    }
  }'
```

### 2. JavaScript/TypeScript を使用

```javascript
// fetch APIを使用
async function captureScreenshots(urls, options = {}) {
  try {
    const response = await fetch('/api/screenshots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls,
        options
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${result.summary.successful}/${result.summary.total} screenshots captured successfully`);
      
      // 成功したスクリーンショットを確認
      result.results
        .filter(r => r.success)
        .forEach(r => console.log(`📸 ${r.url} -> ${r.filePath}`));
    } else {
      console.error('❌ Screenshot capture failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ API call failed:', error);
    throw error;
  }
}

// 使用例
captureScreenshots([
  'https://example.com',
  'https://github.com',
  'https://stackoverflow.com'
], {
  width: 1280,
  height: 720,
  delay: 1500
});
```

### 3. React を使用

```tsx
import { useState } from 'react';

interface ScreenshotHookReturn {
  captureScreenshots: (urls: string[], options?: any) => Promise<void>;
  loading: boolean;
  result: any;
  error: string | null;
}

export function useScreenshots(): ScreenshotHookReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const captureScreenshots = async (urls: string[], options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/screenshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls, options })
      });

      const data = await response.json();
      setResult(data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Screenshot capture failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { captureScreenshots, loading, result, error };
}

// コンポーネントでの使用
function ScreenshotCapture() {
  const { captureScreenshots, loading, result, error } = useScreenshots();
  const [urls, setUrls] = useState('');

  const handleCapture = () => {
    const urlList = urls.split('\n').filter(url => url.trim());
    captureScreenshots(urlList, {
      width: 1920,
      height: 1080,
      fullPage: true
    });
  };

  return (
    <div>
      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="URLを1行ずつ入力してください"
        rows={5}
        cols={50}
      />
      <br />
      <button onClick={handleCapture} disabled={loading}>
        {loading ? 'キャプチャ中...' : 'スクリーンショット取得'}
      </button>
      
      {error && <div style={{color: 'red'}}>エラー: {error}</div>}
      
      {result && (
        <div>
          <h3>結果</h3>
          <p>成功: {result.summary.successful}/{result.summary.total}</p>
          <ul>
            {result.results.map((r: any, i: number) => (
              <li key={i}>
                {r.success ? '✅' : '❌'} {r.url}
                {r.filePath && <span> → {r.filePath}</span>}
                {r.error && <span style={{color: 'red'}}> ({r.error})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## 制限事項

- **最大URL数**: 1回のリクエストで最大50URLまで
- **並列数**: デフォルト3（設定可能）
- **タイムアウト**: 各URLで30秒のタイムアウト
- **対応プロトコル**: http、https のみ
- **認証**: 現在は認証が必要なサイトには対応していません

## ファイル保存形式

スクリーンショットは以下の形式で保存されます：

- **ディレクトリ**: `playwright/screenshots/`
- **ファイル名**: `{domain}_{path}_{timestamp}.png`
- **例**: `example_com_2024-09-17T10-30-00-000Z.png`

## エラーハンドリング

以下の場合にエラーが発生します：

- 無効なURL形式
- ネットワークエラー
- タイムアウト
- ページ読み込み失敗

個別URLのエラーは他のURLの処理に影響しません。

## 開発・デバッグ用

API仕様確認用のGETエンドポイントも提供されています：

```bash
curl http://localhost:3000/api/screenshots
```

このエンドポイントにより、API使用方法の概要とサンプルを確認できます。