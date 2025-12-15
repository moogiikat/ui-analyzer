"use client";

import React from "react";
import { motion } from "motion/react";
import { PROMPT_LEVELS } from "@/types/prompts";

interface AnalysisButtonProps {
  onClick: () => void;
  disabled: boolean;
  analyzing: boolean;
  selectedPromptLevel: string;
}

/**
 * 分析実行ボタンコンポーネント
 */
export const AnalysisButton: React.FC<AnalysisButtonProps> = ({
  onClick,
  disabled,
  analyzing,
  selectedPromptLevel,
}) => {
  const selectedPrompt = PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className="group relative px-12 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500 text-white rounded-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold overflow-hidden"
      >
        <span className="relative z-10 flex items-center space-x-2">
          {analyzing ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⚡
              </motion.span>
              <span>分析中...</span>
            </>
          ) : (
            <>
              <span>{selectedPrompt?.emoji}</span>
              <span>{selectedPrompt?.name}で分析する</span>
            </>
          )}
        </span>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        />
      </button>
    </motion.div>
  );
};

