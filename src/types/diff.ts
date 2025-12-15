/**
 * 画像差分分析結果の型定義
 */
export interface DiffResult {
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

/**
 * 信頼度の閾値
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 90,
  MEDIUM: 70,
} as const;

/**
 * 信頼度に応じた絵文字を取得
 */
export const getConfidenceEmoji = (confidence: number): string => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "🎯";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "⚠️";
  return "❓";
};

/**
 * 信頼度に応じた色クラスを取得
 */
export const getConfidenceColorClass = (confidence: number): string => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "text-emerald-400";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "text-yellow-400";
  return "text-red-400";
};

