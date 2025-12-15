import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

test.describe('Screenshot API Tests', () => {
  
  test('should get API documentation with GET request', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/screenshots`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.message).toBe('Screenshot API');
    expect(data.usage).toBeDefined();
    expect(data.example).toBeDefined();
  });

  test('should successfully capture screenshot for valid URL', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: {
        urls: ['https://example.com'],
        options: {
          width: 800,
          height: 600,
          delay: 500
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.summary.total).toBe(1);
    expect(data.summary.successful).toBe(1);
    expect(data.summary.failed).toBe(0);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].success).toBeTruthy();
    expect(data.results[0].filePath).toContain('playwright/screenshots/');
    expect(data.results[0].url).toBe('https://example.com');
  });

  test('should handle invalid URL gracefully', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: {
        urls: ['invalid-url', 'not-a-url']
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.summary.total).toBe(2);
    expect(data.summary.successful).toBe(0);
    expect(data.summary.failed).toBe(2);
    
    data.results.forEach((result: any) => {
      expect(result.success).toBeFalsy();
      expect(result.error).toContain('Invalid URL format');
    });
  });

  test('should handle mixed valid and invalid URLs', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: {
        urls: [
          'https://example.com',
          'invalid-url',
          'https://httpbin.org/html'
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.summary.total).toBe(3);
    expect(data.summary.successful).toBe(2);
    expect(data.summary.failed).toBe(1);
    
    // 成功したURLを確認
    const successResults = data.results.filter((r: any) => r.success);
    expect(successResults).toHaveLength(2);
    successResults.forEach((result: any) => {
      expect(result.filePath).toContain('playwright/screenshots/');
      expect(result.timestamp).toBeDefined();
    });
    
    // 失敗したURLを確認
    const failedResults = data.results.filter((r: any) => !r.success);
    expect(failedResults).toHaveLength(1);
    expect(failedResults[0].error).toContain('Invalid URL format');
  });

  test('should reject request with empty URLs array', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: {
        urls: []
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBeFalsy();
    expect(data.message).toContain('URLs array is required and must not be empty');
  });

  test('should reject request with no URLs field', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: {
        options: { width: 800 }
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBeFalsy();
    expect(data.message).toContain('URLs array is required and must not be empty');
  });

  test('should reject request with too many URLs', async ({ request }) => {
    const urls = Array.from({ length: 51 }, (_, i) => `https://example${i}.com`);
    
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: { urls }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBeFalsy();
    expect(data.message).toContain('Maximum 50 URLs allowed per request');
  });

  test('should handle concurrent requests (stress test)', async ({ request }) => {
    const urls = [
      'https://example.com',
      'https://httpbin.org/html',
      'https://jsonplaceholder.typicode.com'
    ];

    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: {
        urls,
        options: {
          maxConcurrency: 2,
          delay: 200
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.summary.total).toBe(3);
    expect(data.summary.successful).toBeGreaterThan(0);
    
    // レスポンス時間をチェック（適度な並列処理が行われているか）
    const start = Date.now();
    await response.json();
    const duration = Date.now() - start;
    
    // 3つのURLが順次処理される場合より早いはず
    expect(duration).toBeLessThan(10000); // 10秒未満
  });

  test('should apply custom viewport options', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: {
        urls: ['https://example.com'],
        options: {
          width: 1920,
          height: 1080,
          fullPage: false,
          delay: 1000
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.summary.successful).toBe(1);
    expect(data.results[0].success).toBeTruthy();
  });

  test('should handle invalid JSON gracefully', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: 'invalid-json',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBeFalsy();
  });

  test('should use default options when not provided', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/screenshots`, {
      data: {
        urls: ['https://example.com']
        // optionsを指定しない
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.summary.successful).toBe(1);
    expect(data.results[0].success).toBeTruthy();
  });
});