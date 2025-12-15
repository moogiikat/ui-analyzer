"use client";

import React from "react";

interface NavigationBarProps {
  onScreenshotClick: () => void;
  onHistoryClick: () => void;
}

/**
 * トップナビゲーションバーコンポーネント
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({
  onScreenshotClick,
  onHistoryClick,
}) => {
  return (
    <nav className="border-b border-cyan-500/20 bg-[#0f1429] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center text-xl font-bold shadow-lg shadow-cyan-500/30">
              ⚡
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                画像差分チェッカー
              </h1>
              <p className="text-xs text-gray-400">AIによる視覚比較</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onScreenshotClick}
              className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-all text-cyan-300 flex items-center space-x-2 backdrop-blur-sm"
            >
              <span>📸</span>
              <span className="hidden sm:inline">スクリーンショット</span>
            </button>
            <button
              onClick={onHistoryClick}
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-all text-emerald-300 flex items-center space-x-2 backdrop-blur-sm"
            >
              <span>📚</span>
              <span className="hidden sm:inline">履歴</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

