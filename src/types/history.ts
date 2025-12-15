export interface AnalysisHistory {
  id: string;
  timestamp: Date;
  image1: string;
  image2: string;
  promptLevel: string;
  result: {
    differences: string[];
    summary: string;
    confidence: number;
    details: {
      structural_changes: string[];
      color_changes: string[];
      content_changes: string[];
      layout_changes: string[];
    };
  };
}

export interface HistoryItem extends AnalysisHistory {
  image1Thumbnail?: string;
  image2Thumbnail?: string;
}
