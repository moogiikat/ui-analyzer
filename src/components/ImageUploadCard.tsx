"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import { convertFileToBase64 } from "@/utils/image";
import { SUPPORTED_IMAGE_FORMATS } from "@/constants/ui";

interface ImageUploadCardProps {
  title: string;
  image: string | null;
  onImageChange: (image: string | null) => void;
  color: "cyan" | "emerald";
  showSelectorButton?: boolean;
  onSelectorClick?: () => void;
  animationDirection?: "left" | "right";
}

/**
 * 画像アップロードカードコンポーネント
 */
export const ImageUploadCard: React.FC<ImageUploadCardProps> = ({
  title,
  image,
  onImageChange,
  color,
  showSelectorButton = false,
  onSelectorClick,
  animationDirection = "left",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        onImageChange(base64);
      } catch (error) {
        console.error("画像の読み込みに失敗しました:", error);
        alert("画像の読み込みに失敗しました。");
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const colorClasses = {
    cyan: {
      border: "border-cyan-500/20",
      text: "text-cyan-300",
      dot: "bg-cyan-400",
      dashed: "border-cyan-500/30 hover:border-cyan-500/60",
      bg: "bg-cyan-500/5 hover:bg-cyan-500/10",
      button: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30",
    },
    emerald: {
      border: "border-emerald-500/20",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
      dashed: "border-emerald-500/30 hover:border-emerald-500/60",
      bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
      button: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30",
    },
  };

  const classes = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, x: animationDirection === "left" ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-[#151b3d] border ${classes.border} rounded-xl p-6 backdrop-blur-xl`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${classes.text} flex items-center space-x-2`}>
          <span className={`w-2 h-2 ${classes.dot} rounded-full animate-pulse`}></span>
          <span>{title}</span>
        </h3>
        {showSelectorButton && onSelectorClick && (
          <button
            onClick={onSelectorClick}
            className={`px-3 py-1.5 ${classes.button} rounded-lg text-xs flex items-center space-x-1`}
          >
            <span>📂</span>
            <span className="hidden sm:inline">選択</span>
          </button>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        ref={fileInputRef}
        className="hidden"
      />

      {!image ? (
        <div
          onClick={handleClick}
          className={`border-2 border-dashed ${classes.dashed} rounded-lg p-12 cursor-pointer transition-all text-center ${classes.bg}`}
        >
          <div className="text-5xl mb-4 opacity-60">📷</div>
          <p className="text-gray-400 text-sm">クリックして{title}をアップロード</p>
          <p className="text-gray-500 text-xs mt-2">{SUPPORTED_IMAGE_FORMATS}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`relative rounded-lg overflow-hidden border ${classes.border}`}>
            <img
              src={image}
              alt={title}
              className="w-full h-64 object-contain bg-[#0a0e27]"
            />
          </div>
          <button
            onClick={handleClick}
            className={`w-full px-4 py-2.5 ${classes.button} rounded-lg transition-all font-medium text-sm`}
          >
            {title}を変更
          </button>
        </div>
      )}
    </motion.div>
  );
};

