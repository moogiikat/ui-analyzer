"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useScreenshots } from "@/hooks/useScreenshots";
import {
  DEFAULT_SCREENSHOT_OPTIONS,
  ScreenshotOptions,
} from "@/types/screenshot";

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScreenshotModal({
  isOpen,
  onClose,
}: ScreenshotModalProps) {
  const { captureScreenshots, loading, result, error } = useScreenshots();
  const [urls, setUrls] = useState<string[]>([""]);
  const [options, setOptions] = useState<ScreenshotOptions>(
    DEFAULT_SCREENSHOT_OPTIONS
  );

  const presetUrls = [
    { name: "メインページ", url: "http://localhost:3000" },
    { name: "Google", url: "https://google.com" },
    { name: "GitHub", url: "https://github.com" },
  ];

  // URLを追加
  const addUrl = () => {
    setUrls([...urls, ""]);
  };

  // URLを削除
  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  // URLを更新
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  // プリセットURLを設定
  const setPresetUrl = (index: number, presetUrl: string) => {
    updateUrl(index, presetUrl);
  };

  // スクリーンショット撮影実行
  const handleCapture = async () => {
    const validUrls = urls.filter((url) => url.trim() !== "");
    if (validUrls.length === 0) {
      alert("少なくとも1つのURLを入力してください");
      return;
    }

    await captureScreenshots(validUrls, options);
  };

  // モーダル閉じる際のリセット
  const handleClose = () => {
    setUrls([""]);
    setOptions(DEFAULT_SCREENSHOT_OPTIONS);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📸</span>
                <div>
                  <h2 className="text-2xl font-bold">スクリーンショット撮影</h2>
                  <p className="text-green-100">
                    WebページのスクリーンショットをAPI経由で撮影します
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-red-200 transition-colors"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* URL入力セクション */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📋 撮影対象URL
              </h3>

              {urls.map((url, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {index + 1}.
                  </span>

                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {/* プリセットURL選択 */}
                  <select
                    value=""
                    onChange={(e) =>
                      e.target.value && setPresetUrl(index, e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">プリセット</option>
                    {presetUrls.map((preset) => (
                      <option key={preset.url} value={preset.url}>
                        {preset.name}
                      </option>
                    ))}
                  </select>

                  {urls.length > 1 && (
                    <button
                      onClick={() => removeUrl(index)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addUrl}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>URLを追加</span>
              </button>
            </div>

            {/* 撮影オプション */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                ⚙️ 撮影オプション
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    画面幅 (px)
                  </label>
                  <input
                    type="number"
                    value={options.width}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        width: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    画面高 (px)
                  </label>
                  <input
                    type="number"
                    value={options.height}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        height: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    待機時間 (ms)
                  </label>
                  <input
                    type="number"
                    value={options.delay}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        delay: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    同時実行数
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={options.maxConcurrency}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        maxConcurrency: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.fullPage}
                    onChange={(e) =>
                      setOptions({ ...options, fullPage: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    フルページスクリーンショット
                  </span>
                </label>
              </div>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">❌</span>
                  <span className="text-red-700 font-medium">
                    エラーが発生しました
                  </span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* 結果表示 */}
            {result && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  📊 撮影結果
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {result.summary.total}
                      </div>
                      <div className="text-gray-600">総数</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {result.summary.successful}
                      </div>
                      <div className="text-gray-600">成功</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {result.summary.failed}
                      </div>
                      <div className="text-gray-600">失敗</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.results.map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        item.success
                          ? "bg-green-50 border-green-500"
                          : "bg-red-50 border-red-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {item.url}
                        </span>
                        <span
                          className={`text-sm ${
                            item.success ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.success ? "✅ 成功" : "❌ 失敗"}
                        </span>
                      </div>
                      {item.error && (
                        <p className="text-red-600 text-xs mt-1">
                          {item.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {urls.filter((url) => url.trim()).length}
                個のURLが設定されています
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>

                <button
                  onClick={handleCapture}
                  disabled={
                    loading || urls.filter((url) => url.trim()).length === 0
                  }
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>撮影中...</span>
                    </div>
                  ) : (
                    "📸 スクリーンショット撮影"
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
