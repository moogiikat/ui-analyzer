"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { PROMPT_LEVELS } from "@/types/prompts";

interface AnalysisLoadingProps {
  isVisible: boolean;
  selectedPromptLevel: string;
}

/**
 * 分析中のローディング表示コンポーネント
 */
export const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({
  isVisible,
  selectedPromptLevel,
}) => {
  const selectedPrompt = PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#151b3d] border border-cyan-500/30 rounded-xl p-12 mb-8 text-center backdrop-blur-xl"
        >
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              className="text-7xl mb-6"
            >
              ⚡
            </motion.div>
            <h3 className="text-xl font-bold text-cyan-300 mb-2">
              {selectedPrompt?.emoji} {selectedPrompt?.name}で分析中...
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              AI技術で2つの画像の違いを詳細に検出しています
            </p>
            <div className="flex space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

