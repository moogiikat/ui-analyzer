"use client";

import React from "react";
import { motion } from "motion/react";
import { PROMPT_LEVELS, PromptLevel } from "@/types/prompts";

interface PromptLevelSelectorProps {
  selectedLevel: string;
  onLevelChange: (levelId: string) => void;
}

/**
 * プロンプトレベル選択コンポーネント
 */
export const PromptLevelSelector: React.FC<PromptLevelSelectorProps> = ({
  selectedLevel,
  onLevelChange,
}) => {
  const selectedPrompt = PROMPT_LEVELS.find((l) => l.id === selectedLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151b3d] border border-purple-500/20 rounded-xl p-6 mb-8 backdrop-blur-xl"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-full"></div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">分析レベル</h3>
          <p className="text-gray-400 text-sm">
            分析の詳細度を選択してください。レベルが高いほど詳細で専門的な分析を行います。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {PROMPT_LEVELS.map((level: PromptLevel) => (
          <motion.button
            key={level.id}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onLevelChange(level.id)}
            className={`
              cursor-pointer rounded-lg p-4 border transition-all duration-200 text-left
              ${
                selectedLevel === level.id
                  ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20"
                  : "border-gray-700 bg-[#0f1429] hover:border-gray-600 hover:bg-[#1a2342]"
              }
            `}
          >
            <div className="text-2xl mb-2">{level.emoji}</div>
            <h4
              className={`font-semibold mb-2 text-sm ${
                selectedLevel === level.id ? "text-purple-300" : "text-gray-300"
              }`}
            >
              {level.name}
            </h4>
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    i < level.difficulty
                      ? selectedLevel === level.id
                        ? "text-purple-400"
                        : "text-yellow-400"
                      : "text-gray-600"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <p
              className={`text-xs leading-tight ${
                selectedLevel === level.id ? "text-purple-200" : "text-gray-500"
              }`}
            >
              {level.description}
            </p>
          </motion.button>
        ))}
      </div>

      {selectedPrompt && (
        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{selectedPrompt.emoji}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-300 mb-1 text-sm">
                選択中: {selectedPrompt.name}
              </h4>
              <p className="text-purple-200/80 text-xs mb-2">{selectedPrompt.description}</p>
              <div className="flex items-center">
                <span className="text-xs text-purple-300/70 mr-2">難易度:</span>
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < selectedPrompt.difficulty ? "text-purple-400" : "text-gray-600"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

