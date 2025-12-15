import { useState } from "react";
import {
  ScreenshotHookReturn,
  ScreenshotOptions,
  ScreenshotResponse,
  ScreenshotListResponse,
} from "@/types/screenshot";

export function useScreenshots(): ScreenshotHookReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreenshotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureScreenshots = async (
    urls: string[],
    options: ScreenshotOptions = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/screenshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls, options }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Screenshot capture failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return { captureScreenshots, loading, result, error };
}

export function useExistingScreenshots() {
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScreenshots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/screenshots/list');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch screenshots');
      }
      
      setScreenshots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { fetchScreenshots, loading, screenshots, error };
}
