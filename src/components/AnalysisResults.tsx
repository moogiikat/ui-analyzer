"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { DiffResult } from "@/types/diff";
import { PROMPT_LEVELS } from "@/types/prompts";
import { getConfidenceEmoji, getConfidenceColorClass } from "@/types/diff";
import { downloadJSON } from "@/utils/download";

interface AnalysisResultsProps {
  result: DiffResult;
  selectedPromptLevel: string;
  onReset: () => void;
}

/**
 * 分析結果表示コンポーネント
 */
export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  selectedPromptLevel,
  onReset,
}) => {
  const selectedPrompt = PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel);

  const handleDownload = () => {
    downloadJSON(result, "image-diff-analysis.json");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Summary Card */}
        <div className="bg-[#151b3d] border border-cyan-500/20 rounded-xl p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-cyan-500/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center text-xl">
                📊
              </div>
              <h2 className="text-2xl font-bold text-white">分析結果</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-lg">
                <span className="text-lg">{selectedPrompt?.emoji}</span>
                <span className="text-sm font-medium text-purple-300">{selectedPrompt?.name}</span>
              </div>
              <div className="flex items-center space-x-2 bg-cyan-500/20 border border-cyan-500/30 px-4 py-1.5 rounded-lg">
                <span className="text-xl">{getConfidenceEmoji(result.confidence)}</span>
                <span className={`text-lg font-bold ${getConfidenceColorClass(result.confidence)}`}>
                  {result.confidence}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="font-semibold text-cyan-300 mb-2 text-sm uppercase tracking-wide">
                  総合サマリー
                </h3>
                <p className="text-gray-300 leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Main Differences */}
            <div className="bg-[#0f1429] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <span className="w-1 h-6 bg-cyan-400 rounded-full"></span>
                <span>主な違い</span>
              </h3>
              <ul className="space-y-3">
                {result.differences.map((diff, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start space-x-3"
                  >
                    <span className="text-cyan-400 mt-1.5 text-sm">▸</span>
                    <span className="text-gray-300 text-sm leading-relaxed">{diff}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Detailed Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <span className="w-1 h-6 bg-purple-400 rounded-full"></span>
                <span>詳細分析</span>
              </h3>

              {result.details.structural_changes.length > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-cyan-300 mb-2 text-sm flex items-center space-x-2">
                    <span>🏗️</span>
                    <span>構造変更</span>
                  </h4>
                  <ul className="text-xs text-cyan-200/80 space-y-1.5">
                    {result.details.structural_changes.map((change, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.details.color_changes.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-300 mb-2 text-sm flex items-center space-x-2">
                    <span>🎨</span>
                    <span>色彩変更</span>
                  </h4>
                  <ul className="text-xs text-purple-200/80 space-y-1.5">
                    {result.details.color_changes.map((change, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.details.content_changes.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-300 mb-2 text-sm flex items-center space-x-2">
                    <span>📝</span>
                    <span>コンテンツ変更</span>
                  </h4>
                  <ul className="text-xs text-emerald-200/80 space-y-1.5">
                    {result.details.content_changes.map((change, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.details.layout_changes.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-300 mb-2 text-sm flex items-center space-x-2">
                    <span>📐</span>
                    <span>レイアウト変更</span>
                  </h4>
                  <ul className="text-xs text-orange-200/80 space-y-1.5">
                    {result.details.layout_changes.map((change, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onReset}
            className="px-8 py-3 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/70 hover:border-gray-500 transition-all font-semibold text-sm"
          >
            🔄 新しい画像で分析
          </button>
          <button
            onClick={handleDownload}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg hover:from-cyan-500/30 hover:to-emerald-500/30 transition-all font-semibold text-sm"
          >
            💾 結果をダウンロード
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

