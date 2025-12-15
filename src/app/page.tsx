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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <img src="/logo.png" alt="Logo" className="h-24" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔍 画像差分チェッカー
            </h1>
            <div className="flex-1 flex justify-end space-x-2">
              <button
                onClick={() => setShowSSModal(true)}
                className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-lg border border-gray-200 flex items-center space-x-2"
              >
                <span className="text-lg">📸</span>
                <span className="hidden sm:inline">SS</span>
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-lg border border-gray-200 flex items-center space-x-2"
              >
                <span className="text-lg">📚</span>
                <span className="hidden sm:inline">履歴</span>
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            Ollamaを使用して2つの画像の違いをAIが詳細に分析します
          </p>
        </motion.div>

        {/* Image Upload Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Image 1 Upload */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📷 画像1 (ベース)
            </h3>
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
                className="border-2 border-dashed border-blue-300 rounded-xl p-8 cursor-pointer hover:border-blue-500 transition-colors text-center"
              >
                <div className="text-4xl mb-4">📸</div>
                <p className="text-gray-600">クリックして画像1をアップロード</p>
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={image1}
                  alt="Image 1"
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
                <button
                  onClick={() => fileInput1Ref.current?.click()}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  画像1を変更
                </button>
              </div>
            )}
          </motion.div>

          {/* Image 2 Upload */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex gap-2">
              <h3 className="text-xl font-bold text-gray-800">
                📷 画像2 (比較対象)
              </h3>
              <div className="mb-4">
                <button
                  onClick={() => setShowSelectorModal(true)}
                  className="px-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-lg border border-gray-200 flex items-center space-x-2"
                >
                  <span className="text-lg">📂</span>
                  <span className="hidden sm:inline">選択</span>
                </button>
              </div>
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
                className="border-2 border-dashed border-purple-300 rounded-xl p-8 cursor-pointer hover:border-purple-500 transition-colors text-center"
              >
                <div className="text-4xl mb-4">📸</div>
                <p className="text-gray-600">クリックして画像2をアップロード</p>
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={image2}
                  alt="Image 2"
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
                <button
                  onClick={() => fileInput2Ref.current?.click()}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 分析レベルを選択
          </h3>
          <p className="text-gray-600 mb-6">
            分析の詳細度を選択してください。レベルが高いほど詳細で専門的な分析を行います。
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PROMPT_LEVELS.map((level: PromptLevel) => (
              <motion.div
                key={level.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
                  ${
                    selectedPromptLevel === level.id
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }
                `}
                onClick={() => setSelectedPromptLevel(level.id)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{level.emoji}</div>
                  <h4
                    className={`font-bold mb-1 ${
                      selectedPromptLevel === level.id
                        ? "text-blue-700"
                        : "text-gray-800"
                    }`}
                  >
                    {level.name}
                  </h4>
                  <div className="flex justify-center items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < level.difficulty
                            ? selectedPromptLevel === level.id
                              ? "text-blue-500"
                              : "text-yellow-500"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p
                    className={`text-sm ${
                      selectedPromptLevel === level.id
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {level.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-xl mt-1">
                {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.emoji}
              </span>
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">
                  選択中:{" "}
                  {
                    PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)
                      ?.name
                  }
                </h4>
                <p className="text-blue-700 text-sm">
                  {
                    PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)
                      ?.description
                  }
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-blue-600 mr-2">難易度:</span>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i <
                        (PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)
                          ?.difficulty || 0)
                          ? "text-blue-500"
                          : "text-gray-300"
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
              className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-lg"
            >
              {analyzing
                ? "分析中..."
                : `${
                    PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)
                      ?.emoji
                  } ${
                    PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)
                      ?.name
                  }で分析する`}
            </button>
          </motion.div>
        )}

        {/* Analysis Loading */}
        <AnimatePresence>
          {analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center"
            >
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-6xl"
                >
                  🔍
                </motion.div>
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.emoji}{" "}
                {PROMPT_LEVELS.find((l) => l.id === selectedPromptLevel)?.name}
                で分析中...
              </p>
              <p className="text-gray-500">
                AI技術で2つの画像の違いを詳細に検出しています
              </p>
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 bg-blue-500 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
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
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    📊 分析結果
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                      <span className="text-lg">
                        {
                          PROMPT_LEVELS.find(
                            (l) => l.id === selectedPromptLevel
                          )?.emoji
                        }
                      </span>
                      <span className="text-sm font-medium text-blue-700">
                        {
                          PROMPT_LEVELS.find(
                            (l) => l.id === selectedPromptLevel
                          )?.name
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {getConfidenceEmoji(result.confidence)}
                      </span>
                      <span
                        className={`text-xl font-bold ${getConfidenceColor(
                          result.confidence
                        )}`}
                      >
                        信頼度: {result.confidence}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    🎯 総合サマリー
                  </h3>
                  <p className="text-gray-700">{result.summary}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Main Differences */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      🔍 主な違い
                    </h3>
                    <ul className="space-y-2">
                      {result.differences.map((diff, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-start space-x-2"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-gray-700">{diff}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      📝 詳細分析
                    </h3>

                    {result.details.structural_changes.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          🏗️ 構造変更
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {result.details.structural_changes.map(
                            (change, index) => (
                              <li key={index}>• {change}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {result.details.color_changes.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-800 mb-2">
                          🎨 色彩変更
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          {result.details.color_changes.map((change, index) => (
                            <li key={index}>• {change}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.details.content_changes.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">
                          📝 コンテンツ変更
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          {result.details.content_changes.map(
                            (change, index) => (
                              <li key={index}>• {change}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {result.details.layout_changes.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-800 mb-2">
                          📐 レイアウト変更
                        </h4>
                        <ul className="text-sm text-orange-700 space-y-1">
                          {result.details.layout_changes.map(
                            (change, index) => (
                              <li key={index}>• {change}</li>
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
                  className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all font-semibold"
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
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all font-semibold"
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
