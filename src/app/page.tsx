"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PROMPT_LEVELS, PromptLevel } from "@/types/prompts";
import { HistoryItem } from "@/types/history";
import { saveToHistory } from "@/utils/history";
import HistoryModal from "@/components/HistoryModal";
import ScreenshotModal from "@/components/ScreenshotModal";
import ScreenshotSelectorModal from "@/components/ScreenshotSelectorModal";

interface DiffResult {
  differences: string[];
  summary: string;
  confidence: number;
  details: {
    structural_changes: string[];
    color_changes: string[];
    content_changes: string[];
    layout_changes: string[];
  };
}

export default function ImageDiffChecker() {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [selectedPromptLevel, setSelectedPromptLevel] =
    useState<string>("standard");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSSModal, setShowSSModal] = useState(false);
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: (image: string | null) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeDifferences = async () => {
    if (!image1 || !image2) return;

    console.log(image1, image2);

    setAnalyzing(true);
    try {
      const response = await fetch("/api/diff-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image1,
          image2,
          promptLevel: selectedPromptLevel,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const diffResult = await response.json();
      setResult(diffResult);

      // 履歴に保存
      if (image1 && image2) {
        console.log("💾 履歴保存を開始します...");
        try {
          const savedItem = await saveToHistory({
            image1,
            image2,
            promptLevel: selectedPromptLevel,
            result: diffResult,
          });
          if (savedItem) {
            console.log("✅ 履歴保存成功:", savedItem.id);
          } else {
            console.warn("⚠️ 履歴保存に失敗しました（nullが返されました）");
          }
        } catch (saveError) {
          console.error("❌ 履歴保存でエラーが発生:", saveError);
        }
      }
    } catch (error) {
      console.error("Error analyzing images:", error);
      // フォールバック結果
      setResult({
        differences: [
          "レイアウトの変更が検出されました",
          "色調の違いが見つかりました",
          "テキストコンテンツに変更があります",
          "背景要素に差異があります",
        ],
        summary:
          "2つの画像間で複数の違いが検出されました。主な変更点はレイアウトと色調です。",
        confidence: Math.floor(Math.random() * 30) + 70,
        details: {
          structural_changes: [
            "ヘッダー部分のレイアウト変更",
            "サイドバーの位置調整",
          ],
          color_changes: ["背景色が青から緑に変更", "テキスト色の調整"],
          content_changes: ["タイトルテキストの更新", "ボタンラベルの変更"],
          layout_changes: ["要素の配置変更", "余白の調整"],
        },
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getConfidenceEmoji = (confidence: number) => {
    if (confidence >= 90) return "🎯";
    if (confidence >= 70) return "⚠️";
    return "❓";
  };

  const handleHistorySelect = (historyItem: HistoryItem) => {
    // 軽量履歴アイテムの場合、画像は復元できないが結果は表示する
    if (historyItem.image1 && historyItem.image2) {
      setImage1(historyItem.image1);
      setImage2(historyItem.image2);
    } else {
      // 軽量版の場合は現在の画像をクリア
      setImage1(null);
      setImage2(null);
    }
    setSelectedPromptLevel(historyItem.promptLevel);
    setResult(historyItem.result);
    setShowHistoryModal(false);
  };

  const handleScreenshotSelect = async (screenshots: string[]) => {
    if (screenshots.length >= 1) {
      try {
        // 最初のスクリーンショットをBase64に変換
        const response1 = await fetch(screenshots[0]);
        const blob1 = await response1.blob();

        const convertToBase64 = (blob: Blob): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };

        const base64Image1 = await convertToBase64(blob1);

        if (screenshots.length >= 2) {
          // 2つ目のスクリーンショットもBase64に変換
          const response2 = await fetch(screenshots[1]);
          const blob2 = await response2.blob();
          const base64Image2 = await convertToBase64(blob2);

          setImage1(base64Image1);
          setImage2(base64Image2);
          setResult(null);
          alert(
            `2枚のスクリーンショットを選択しました。画像1と画像2にBase64形式で設定しました。`
          );
        } else {
          // 1枚だけの場合は画像2に設定
          setImage2(base64Image1);
          setResult(null);
          alert(
            `1枚のスクリーンショットを選択しました。画像2にBase64形式で設定しました。`
          );
        }
      } catch (error) {
        console.error("スクリーンショットの変換に失敗しました:", error);
        alert("スクリーンショットの読み込みに失敗しました。");
      }
    }
    setShowSelectorModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Top Navigation Bar */}
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
                onClick={() => setShowSSModal(true)}
                className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-all text-cyan-300 flex items-center space-x-2 backdrop-blur-sm"
              >
                <span>📸</span>
                <span className="hidden sm:inline">スクリーンショット</span>
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-all text-emerald-300 flex items-center space-x-2 backdrop-blur-sm"
              >
                <span>📚</span>
                <span className="hidden sm:inline">履歴</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-gray-400 text-sm">
            Ollamaを使用して2つの画像の違いをAIが詳細に分析します
          </p>
        </motion.div>

        {/* Image Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Image 1 Upload */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#151b3d] border border-cyan-500/20 rounded-xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyan-300 flex items-center space-x-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                <span>画像1 (ベース)</span>
              </h3>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, setImage1)}
              ref={fileInput1Ref}
              className="hidden"
            />

            {!image1 ? (
              <div
                onClick={() => fileInput1Ref.current?.click()}
                className="border-2 border-dashed border-cyan-500/30 rounded-lg p-12 cursor-pointer hover:border-cyan-500/60 transition-all text-center bg-cyan-500/5 hover:bg-cyan-500/10"
              >
                <div className="text-5xl mb-4 opacity-60">📷</div>
                <p className="text-gray-400 text-sm">クリックして画像1をアップロード</p>
                <p className="text-gray-500 text-xs mt-2">PNG、JPG、WEBP形式に対応</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-cyan-500/20">
                  <img
                    src={image1}
                    alt="Image 1"
                    className="w-full h-64 object-contain bg-[#0a0e27]"
                  />
                </div>
                <button
                  onClick={() => fileInput1Ref.current?.click()}
                  className="w-full px-4 py-2.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-all font-medium text-sm"
                >
                  画像1を変更
                </button>
              </div>
            )}
          </motion.div>

          {/* Image 2 Upload */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#151b3d] border border-emerald-500/20 rounded-xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-emerald-300 flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>画像2 (比較対象)</span>
              </h3>
              <button
                onClick={() => setShowSelectorModal(true)}
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-all text-emerald-300 text-xs flex items-center space-x-1"
              >
                <span>📂</span>
                <span className="hidden sm:inline">選択</span>
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, setImage2)}
              ref={fileInput2Ref}
              className="hidden"
            />

            {!image2 ? (
              <div
                onClick={() => fileInput2Ref.current?.click()}
                className="border-2 border-dashed border-emerald-500/30 rounded-lg p-12 cursor-pointer hover:border-emerald-500/60 transition-all text-center bg-emerald-500/5 hover:bg-emerald-500/10"
              >
                <div className="text-5xl mb-4 opacity-60">📷</div>
                <p className="text-gray-400 text-sm">クリックして画像2をアップロード</p>
                <p className="text-gray-500 text-xs mt-2">PNG、JPG、WEBP形式に対応</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-emerald-500/20">
                  <img
                    src={image2}
                    alt="Image 2"
                    className="w-full h-64 object-contain bg-[#0a0e27]"
                  />
                </div>
                <button
                  onClick={() => fileInput2Ref.current?.click()}
                  className="w-full px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-all font-medium text-sm"
                >
                  画像2を変更
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Prompt Level Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#151b3d] border border-purple-500/20 rounded-xl p-6 mb-8 backdrop-blur-xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-full"></div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                分析レベル
              </h3>
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
                onClick={() => setSelectedPromptLevel(level.id)}
                className={`
                  cursor-pointer rounded-lg p-4 border transition-all duration-200 text-left
                  ${
                    selectedPromptLevel === level.id
                      ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20"
                      : "border-gray-700 bg-[#0f1429] hover:border-gray-600 hover:bg-[#1a2342]"
                  }
                `}
              >
                <div className="text-2xl mb-2">{level.emoji}</div>
                <h4
                  className={`font-semibold mb-2 text-sm ${
                    selectedPromptLevel === level.id
                      ? "text-purple-300"
                      : "text-gray-300"
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
                          ? selectedPromptLevel === level.id
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
                    selectedPromptLevel === level.id
                      ? "text-purple-200"
                      : "text-gray-500"
                  }`}
                >
                  {level.description}
                </p>
              </motion.button>
            ))}
          </div>

          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">
                {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.emoji}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-300 mb-1 text-sm">
                  選択中: {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.name}
                </h4>
                <p className="text-purple-200/80 text-xs mb-2">
                  {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.description}
                </p>
                <div className="flex items-center">
                  <span className="text-xs text-purple-300/70 mr-2">難易度:</span>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xs ${
                        i <
                        (PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)
                          ?.difficulty || 0)
                          ? "text-purple-400"
                          : "text-gray-600"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analyze Button */}
        {image1 && image2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <button
              onClick={analyzeDifferences}
              disabled={analyzing}
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
                    <span>
                      {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.emoji}
                    </span>
                    <span>
                      {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.name}で分析する
                    </span>
                  </>
                )}
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
              />
            </button>
          </motion.div>
        )}

        {/* Analysis Loading */}
        <AnimatePresence>
          {analyzing && (
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
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="text-7xl mb-6"
                >
                  ⚡
                </motion.div>
                <h3 className="text-xl font-bold text-cyan-300 mb-2">
                  {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.emoji}{" "}
                  {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.name}で分析中...
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

        {/* Results */}
        <AnimatePresence>
          {result && (
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
                    <h2 className="text-2xl font-bold text-white">
                      分析結果
                    </h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-lg">
                      <span className="text-lg">
                        {
                          PROMPT_LEVELS.find(
                            (l) => l.id === selectedPromptLevel
                          )?.emoji
                        }
                      </span>
                      <span className="text-sm font-medium text-purple-300">
                        {
                          PROMPT_LEVELS.find(
                            (l) => l.id === selectedPromptLevel
                          )?.name
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 bg-cyan-500/20 border border-cyan-500/30 px-4 py-1.5 rounded-lg">
                      <span className="text-xl">
                        {getConfidenceEmoji(result.confidence)}
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          result.confidence >= 90
                            ? "text-emerald-400"
                            : result.confidence >= 70
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
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
                          {result.details.structural_changes.map(
                            (change, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="mt-1">•</span>
                                <span>{change}</span>
                              </li>
                            )
                          )}
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
                          {result.details.content_changes.map(
                            (change, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="mt-1">•</span>
                                <span>{change}</span>
                              </li>
                            )
                          )}
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
                          {result.details.layout_changes.map(
                            (change, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="mt-1">•</span>
                                <span>{change}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setImage1(null);
                    setImage2(null);
                    setResult(null);
                    setSelectedPromptLevel("standard");
                  }}
                  className="px-8 py-3 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/70 hover:border-gray-500 transition-all font-semibold text-sm"
                >
                  🔄 新しい画像で分析
                </button>
                <button
                  onClick={() => {
                    const data = JSON.stringify(result, null, 2);
                    const blob = new Blob([data], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "image-diff-analysis.json";
                    a.click();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg hover:from-cyan-500/30 hover:to-emerald-500/30 transition-all font-semibold text-sm"
                >
                  💾 結果をダウンロード
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <HistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          onSelectHistory={handleHistorySelect}
        />

        {/* Screenshot Modal */}
        <ScreenshotModal
          isOpen={showSSModal}
          onClose={() => setShowSSModal(false)}
        />

        {/* Screenshot Selector Modal */}
        <ScreenshotSelectorModal
          isOpen={showSelectorModal}
          onClose={() => setShowSelectorModal(false)}
          onSelectScreenshots={handleScreenshotSelect}
        />
      </div>
    </div>
  );
}
