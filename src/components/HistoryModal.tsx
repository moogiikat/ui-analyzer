"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HistoryItem } from "@/types/history";
import { PROMPT_LEVELS } from "@/types/prompts";
import { getConfidenceEmoji, getConfidenceColorClass } from "@/types/diff";
import {
  getHistory,
  clearHistory,
  deleteHistoryItem,
  formatDate,
  debugLocalStorage,
} from "@/utils/history";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (historyItem: HistoryItem) => void;
}

export default function HistoryModal({
  isOpen,
  onClose,
  onSelectHistory,
}: HistoryModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "confidence">("date");

  useEffect(() => {
    if (isOpen) {
      console.log("📚 履歴モーダルが開かれました。履歴を取得中...");
      const historyData = getHistory();
      setHistory(historyData);
      console.log("📋 履歴モーダルに表示する履歴件数:", historyData.length);
    }
  }, [isOpen]);

  const filteredHistory = history
    .filter(
      (item) =>
        item.result.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.result.differences.some((diff) =>
          diff.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } else {
        return b.result.confidence - a.result.confidence;
      }
    });

  const handleClearHistory = () => {
    if (
      window.confirm("すべての履歴を削除しますか？この操作は取り消せません。")
    ) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("この履歴を削除しますか？")) {
      deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleHistorySelect = (historyItem: HistoryItem) => {
    // 元画像が保存されていない場合は復元できない旨を通知
    if (!historyItem.image1 || !historyItem.image2) {
      alert(
        "この履歴は軽量版で保存されているため、元画像を復元できません。分析結果のみ表示されます。"
      );
      return;
    }
    onSelectHistory(historyItem);
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
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📚</span>
                <div>
                  <h2 className="text-2xl font-bold">分析履歴</h2>
                  <p className="text-blue-100">
                    過去の画像差分分析結果を確認できます
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
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

          {/* Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="履歴を検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "date" | "confidence")
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="date">日付順</option>
                  <option value="confidence">信頼度順</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {filteredHistory.length}件 / {history.length}件
                </span>
                <button
                  onClick={debugLocalStorage}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                >
                  🔧 Debug
                </button>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ すべて削除
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-280px)]">
            {/* History List */}
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <span className="text-6xl mb-4">📭</span>
                  <p className="text-lg">履歴がありません</p>
                  <p className="text-sm">
                    画像分析を実行すると履歴が保存されます
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all
                        ${
                          selectedItem?.id === item.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Thumbnails */}
                        <div className="flex space-x-2">
                          {item.image1Thumbnail && (
                            <img
                              src={item.image1Thumbnail}
                              alt="Image 1"
                              className="w-12 h-12 object-cover rounded border"
                            />
                          )}
                          {item.image2Thumbnail && (
                            <img
                              src={item.image2Thumbnail}
                              alt="Image 2"
                              className="w-12 h-12 object-cover rounded border"
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">
                                {
                                  PROMPT_LEVELS.find(
                                    (l) => l.id === item.promptLevel
                                  )?.emoji
                                }
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                {
                                  PROMPT_LEVELS.find(
                                    (l) => l.id === item.promptLevel
                                  )?.name
                                }
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>

                          <p className="text-sm text-gray-700 truncate mb-1">
                            {item.result.summary}
                          </p>

                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="text-gray-700">{formatDate(item.timestamp)}</span>
                            <div className="flex items-center space-x-1">
                              <span>
                                {getConfidenceEmoji(item.result.confidence)}
                              </span>
                              <span
                                className={getConfidenceColorClass(
                                  item.result.confidence
                                )}
                              >
                                {item.result.confidence}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail View */}
            <div className="w-1/2 overflow-y-auto">
              {selectedItem ? (
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        詳細情報
                      </h3>
                      <button
                        onClick={() => handleHistorySelect(selectedItem)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                          selectedItem.image1 && selectedItem.image2
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}
                      >
                        {selectedItem.image1 && selectedItem.image2
                          ? "📥 この結果を復元"
                          : "👁️ 結果のみ表示"}
                      </button>
                    </div>

                    {/* Images */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          画像1
                        </p>
                        <img
                          src={
                            selectedItem.image1 || selectedItem.image1Thumbnail
                          }
                          alt="Image 1"
                          className="w-full h-32 object-cover rounded border"
                        />
                        {!selectedItem.image1 &&
                          selectedItem.image1Thumbnail && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ サムネイル表示
                            </p>
                          )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          画像2
                        </p>
                        <img
                          src={
                            selectedItem.image2 || selectedItem.image2Thumbnail
                          }
                          alt="Image 2"
                          className="w-full h-32 object-cover rounded border"
                        />
                        {!selectedItem.image2 &&
                          selectedItem.image2Thumbnail && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ サムネイル表示
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-800">
                            分析日時:
                          </span>
                          <p className="text-gray-700">{formatDate(selectedItem.timestamp)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">
                            分析レベル:
                          </span>
                          <p className="text-gray-700">
                            {
                              PROMPT_LEVELS.find(
                                (l) => l.id === selectedItem.promptLevel
                              )?.emoji
                            }{" "}
                            {
                              PROMPT_LEVELS.find(
                                (l) => l.id === selectedItem.promptLevel
                              )?.name
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">
                            信頼度:
                          </span>
                          <p
                            className={getConfidenceColorClass(
                              selectedItem.result.confidence
                            )}
                          >
                            {getConfidenceEmoji(selectedItem.result.confidence)}{" "}
                            {selectedItem.result.confidence}%
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">
                            差分数:
                          </span>
                          <p className="text-gray-700">{selectedItem.result.differences.length}個</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      🎯 総合サマリー
                    </h4>
                    <p className="text-gray-800 text-sm bg-gray-50 rounded-lg p-3">
                      {selectedItem.result.summary}
                    </p>
                  </div>

                  {/* Differences */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      🔍 主な違い
                    </h4>
                    <ul className="space-y-1">
                      {selectedItem.result.differences.map((diff, index) => (
                        <li
                          key={index}
                          className="flex items-start space-x-2 text-sm"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-gray-800">{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">📝 詳細分析</h4>

                    {selectedItem.result.details.structural_changes.length >
                      0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h5 className="font-medium text-blue-800 mb-1 text-sm">
                          🏗️ 構造変更
                        </h5>
                        <ul className="text-xs text-blue-800 space-y-1">
                          {selectedItem.result.details.structural_changes.map(
                            (change, index) => (
                              <li key={index}>• {change}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {selectedItem.result.details.color_changes.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <h5 className="font-medium text-purple-800 mb-1 text-sm">
                          🎨 色彩変更
                        </h5>
                        <ul className="text-xs text-purple-800 space-y-1">
                          {selectedItem.result.details.color_changes.map(
                            (change, index) => (
                              <li key={index}>• {change}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {selectedItem.result.details.content_changes.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <h5 className="font-medium text-green-800 mb-1 text-sm">
                          📝 コンテンツ変更
                        </h5>
                        <ul className="text-xs text-green-800 space-y-1">
                          {selectedItem.result.details.content_changes.map(
                            (change, index) => (
                              <li key={index}>• {change}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {selectedItem.result.details.layout_changes.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-3">
                        <h5 className="font-medium text-orange-800 mb-1 text-sm">
                          📐 レイアウト変更
                        </h5>
                        <ul className="text-xs text-orange-800 space-y-1">
                          {selectedItem.result.details.layout_changes.map(
                            (change, index) => (
                              <li key={index}>• {change}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <span className="text-6xl mb-4">👆</span>
                  <p className="text-lg">履歴を選択してください</p>
                  <p className="text-sm">
                    左側の履歴から詳細を確認したいアイテムを選択してください
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
