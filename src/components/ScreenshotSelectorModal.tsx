"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useExistingScreenshots } from "@/hooks/useScreenshots";
import { ScreenshotFile } from "@/types/screenshot";

interface ScreenshotSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScreenshots: (screenshots: string[]) => void;
}

export default function ScreenshotSelectorModal({
  isOpen,
  onClose,
  onSelectScreenshots,
}: ScreenshotSelectorModalProps) {
  const { fetchScreenshots, loading, screenshots, error } = useExistingScreenshots();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // モーダルが開いた時にスクリーンショットを取得
  useEffect(() => {
    if (isOpen) {
      fetchScreenshots();
    }
  }, [isOpen]);

  // ファイル選択の切り替え
  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath) 
        ? prev.filter(f => f !== filePath)
        : [...prev, filePath]
    );
  };

  // 全選択/全解除
  const toggleSelectAll = () => {
    if (!screenshots?.screenshots) return;
    
    const filteredFiles = getFilteredScreenshots();
    const allSelected = filteredFiles.every(file => selectedFiles.includes(file.path));
    
    if (allSelected) {
      // 全解除
      setSelectedFiles(prev => prev.filter(path => !filteredFiles.some(file => file.path === path)));
    } else {
      // 全選択
      const newSelections = filteredFiles.map(file => file.path);
      setSelectedFiles(prev => [...new Set([...prev, ...newSelections])]);
    }
  };

  // フィルタリングされたスクリーンショット
  const getFilteredScreenshots = (): ScreenshotFile[] => {
    if (!screenshots?.screenshots) return [];
    
    return screenshots.screenshots.filter(file =>
      file.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 選択完了
  const handleSelect = () => {
    if (selectedFiles.length === 0) {
      alert("少なくとも1つのファイルを選択してください");
      return;
    }
    onSelectScreenshots(selectedFiles);
    handleClose();
  };

  // モーダル閉じる
  const handleClose = () => {
    setSelectedFiles([]);
    setSearchTerm("");
    onClose();
  };

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 日付をフォーマット
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (!isOpen) return null;

  const filteredScreenshots = getFilteredScreenshots();

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
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📂</span>
                <div>
                  <h2 className="text-2xl font-bold">スクリーンショット選択</h2>
                  <p className="text-purple-100">
                    playwright/screenshotsフォルダから画像を選択してください
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-red-200 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 flex-1">
                {/* 検索 */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="ファイル名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* 全選択ボタン */}
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                >
                  {filteredScreenshots.every(file => selectedFiles.includes(file.path)) && filteredScreenshots.length > 0
                    ? "全解除" 
                    : "全選択"
                  }
                </button>
              </div>

              {/* 選択数とリフレッシュ */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selectedFiles.length}個選択中 / {filteredScreenshots.length}個表示
                </span>
                <button
                  onClick={fetchScreenshots}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  🔄 更新
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
            {loading && (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">読み込み中...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">❌</span>
                  <span className="text-red-700 font-medium">エラーが発生しました</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && filteredScreenshots.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <span className="text-6xl mb-4">📷</span>
                <p className="text-lg">スクリーンショットが見つかりません</p>
                <p className="text-sm">playwright/screenshotsフォルダにファイルがないか、検索条件に一致するファイルがありません</p>
              </div>
            )}

            {/* ファイル一覧 */}
            {!loading && !error && filteredScreenshots.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredScreenshots.map((file) => (
                  <motion.div
                    key={file.filename}
                    whileHover={{ scale: 1.02 }}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${selectedFiles.includes(file.path) 
                        ? 'border-purple-500 bg-purple-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                    onClick={() => toggleFileSelection(file.path)}
                  >
                    {/* プレビュー画像 */}
                    <div className="relative mb-3">
                      <img
                        src={file.path}
                        alt={file.filename}
                        className="w-full h-32 object-cover rounded border"
                        loading="lazy"
                      />
                      {selectedFiles.includes(file.path) && (
                        <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* ファイル情報 */}
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-800 text-sm truncate" title={file.filename}>
                        {file.filename}
                      </h3>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>サイズ: {formatFileSize(file.size)}</div>
                        <div>作成: {formatDate(file.createdAt)}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedFiles.length > 0 && (
                  <span className="text-purple-600 font-medium">
                    {selectedFiles.length}個のファイルが選択されています
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
                
                <button
                  onClick={handleSelect}
                  disabled={selectedFiles.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  選択した画像を使用 ({selectedFiles.length})
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
