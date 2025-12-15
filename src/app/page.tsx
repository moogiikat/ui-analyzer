"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { DiffResult } from "@/types/diff";
import { HistoryItem } from "@/types/history";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { fetchImageAsBase64 } from "@/utils/image";
import HistoryModal from "@/components/HistoryModal";
import ScreenshotModal from "@/components/ScreenshotModal";
import ScreenshotSelectorModal from "@/components/ScreenshotSelectorModal";
import { NavigationBar } from "@/components/NavigationBar";
import { ImageUploadCard } from "@/components/ImageUploadCard";
import { PromptLevelSelector } from "@/components/PromptLevelSelector";
import { AnalysisButton } from "@/components/AnalysisButton";
import { AnalysisLoading } from "@/components/AnalysisLoading";
import { AnalysisResults } from "@/components/AnalysisResults";

/**
 * 画像差分チェッカーのメインコンポーネント
 */
export default function ImageDiffChecker() {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [selectedPromptLevel, setSelectedPromptLevel] = useState<string>("standard");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSSModal, setShowSSModal] = useState(false);
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  const { analyzeImages, analyzing } = useImageAnalysis({
    onSuccess: (result) => {
      setResult(result);
    },
  });

  /**
   * 画像アップロード時のハンドラー
   */
  const handleImageChange = (image: string | null, setImage: (image: string | null) => void) => {
    setImage(image);
    setResult(null);
  };

  /**
   * 分析実行
   */
  const handleAnalyze = async () => {
    if (!image1 || !image2) return;
    const result = await analyzeImages(image1, image2, selectedPromptLevel);
    if (result) {
      setResult(result);
    }
  };

  /**
   * リセット処理
   */
  const handleReset = () => {
    setImage1(null);
    setImage2(null);
    setResult(null);
    setSelectedPromptLevel("standard");
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

  /**
   * スクリーンショット選択時のハンドラー
   */
  const handleScreenshotSelect = async (screenshots: string[]) => {
    if (screenshots.length === 0) {
      setShowSelectorModal(false);
      return;
    }

    try {
      const base64Image1 = await fetchImageAsBase64(screenshots[0]);

        if (screenshots.length >= 2) {
        const base64Image2 = await fetchImageAsBase64(screenshots[1]);
          setImage1(base64Image1);
          setImage2(base64Image2);
        alert("2枚のスクリーンショットを選択しました。画像1と画像2にBase64形式で設定しました。");
        } else {
          setImage2(base64Image1);
        alert("1枚のスクリーンショットを選択しました。画像2にBase64形式で設定しました。");
      }
          setResult(null);
      } catch (error) {
        console.error("スクリーンショットの変換に失敗しました:", error);
        alert("スクリーンショットの読み込みに失敗しました。");
    } finally {
      setShowSelectorModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      <NavigationBar
        onScreenshotClick={() => setShowSSModal(true)}
        onHistoryClick={() => setShowHistoryModal(true)}
      />

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
          <ImageUploadCard
            title="画像1 (ベース)"
            image={image1}
            onImageChange={(img) => handleImageChange(img, setImage1)}
            color="cyan"
            animationDirection="left"
          />
          <ImageUploadCard
            title="画像2 (比較対象)"
            image={image2}
            onImageChange={(img) => handleImageChange(img, setImage2)}
            color="emerald"
            showSelectorButton
            onSelectorClick={() => setShowSelectorModal(true)}
            animationDirection="right"
          />
        </div>

        <PromptLevelSelector
          selectedLevel={selectedPromptLevel}
          onLevelChange={setSelectedPromptLevel}
        />

        {image1 && image2 && (
          <AnalysisButton
            onClick={handleAnalyze}
              disabled={analyzing}
            analyzing={analyzing}
            selectedPromptLevel={selectedPromptLevel}
          />
        )}

        <AnalysisLoading isVisible={analyzing} selectedPromptLevel={selectedPromptLevel} />

          {result && (
          <AnalysisResults
            result={result}
            selectedPromptLevel={selectedPromptLevel}
            onReset={handleReset}
          />
        )}

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
