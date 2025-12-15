// Screenshot API types
export interface ScreenshotOptions {
  width?: number;
  height?: number;
  fullPage?: boolean;
  delay?: number; // ms to wait after page load
  maxConcurrency?: number;
}

export interface ScreenshotRequest {
  urls: string[];
  options?: ScreenshotOptions;
}

export interface ScreenshotResult {
  url: string;
  success: boolean;
  filePath?: string;
  timestamp?: string;
  error?: string;
}

export interface ScreenshotResponse {
  success: boolean;
  results: ScreenshotResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  message?: string;
}

// Screenshot file info
export interface ScreenshotFile {
  filename: string;
  path: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export interface ScreenshotListResponse {
  success: boolean;
  screenshots: ScreenshotFile[];
  total: number;
  error?: string;
  message?: string;
}

// Hook return type
export interface ScreenshotHookReturn {
  captureScreenshots: (
    urls: string[],
    options?: ScreenshotOptions
  ) => Promise<void>;
  loading: boolean;
  result: ScreenshotResponse | null;
  error: string | null;
}

// Default options
export const DEFAULT_SCREENSHOT_OPTIONS: Required<ScreenshotOptions> = {
  width: 1280,
  height: 720,
  fullPage: true,
  delay: 1000,
  maxConcurrency: 3,
};
