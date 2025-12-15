import { AnalysisHistory, HistoryItem } from "@/types/history";

const HISTORY_STORAGE_KEY = "image-diff-analysis-history";
const MAX_HISTORY_ITEMS = 20; // 容量制限のため減らす
const MAX_THUMBNAIL_WIDTH = 100; // サムネイルサイズを小さく
const THUMBNAIL_QUALITY = 0.6; // 画質を下げて容量削減

// ローカルストレージの可用性をテスト
const testLocalStorage = (): boolean => {
  try {
    const testKey = "__localStorage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error("❌ ローカルストレージが利用できません:", error);
    return false;
  }
};

// サムネイル生成関数（容量最適化版）
const generateThumbnail = (
  imageDataUrl: string,
  maxWidth: number = MAX_THUMBNAIL_WIDTH
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        try {
          const aspectRatio = img.height / img.width;
          const width = Math.min(maxWidth, img.width);
          const height = width * aspectRatio;

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const thumbnail = canvas.toDataURL("image/jpeg", THUMBNAIL_QUALITY);
            console.log(
              `📏 サムネイル生成: ${width}x${height}, サイズ: ${thumbnail.length} chars`
            );
            resolve(thumbnail);
          } else {
            reject(new Error("Canvas context is null"));
          }
        } catch (error) {
          console.error("サムネイル描画エラー:", error);
          reject(error);
        }
      };

      img.onerror = (error) => {
        console.error("画像読み込みエラー:", error);
        reject(new Error("画像の読み込みに失敗しました"));
      };

      img.src = imageDataUrl;
    } catch (error) {
      console.error("サムネイル生成初期化エラー:", error);
      reject(error);
    }
  });
};

// 容量制限チェック
const checkStorageQuota = (dataSize: number): boolean => {
  try {
    // 5MB制限の目安でチェック（ブラウザによって異なる）
    const maxSize = 5 * 1024 * 1024; // 5MB in chars

    let currentSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        currentSize += localStorage[key].length;
      }
    }

    console.log(
      `📊 ストレージ使用量: ${currentSize} chars, 新規データ: ${dataSize} chars`
    );
    return currentSize + dataSize < maxSize;
  } catch (error) {
    console.error("容量チェックエラー:", error);
    return false;
  }
};

// 履歴を保存（軽量版）
export const saveToHistory = async (
  historyItem: Omit<AnalysisHistory, "id" | "timestamp">
) => {
  try {
    console.log("🔄 履歴保存開始...", { promptLevel: historyItem.promptLevel });

    // ローカルストレージの可用性をチェック
    if (!testLocalStorage()) {
      throw new Error("ローカルストレージが利用できません");
    }

    const existingHistory = getHistory();
    console.log("📋 既存履歴件数:", existingHistory.length);

    // サムネイルを生成
    console.log("🖼️ サムネイル生成中...");
    const [image1Thumbnail, image2Thumbnail] = await Promise.all([
      generateThumbnail(historyItem.image1),
      generateThumbnail(historyItem.image2),
    ]);
    console.log("✅ サムネイル生成完了");

    // 軽量版履歴アイテム（元画像は保存しない）
    const newItem: HistoryItem = {
      image1: "", // 元画像は保存しない
      image2: "", // 元画像は保存しない
      promptLevel: historyItem.promptLevel,
      result: historyItem.result,
      id: Date.now().toString(),
      timestamp: new Date(),
      image1Thumbnail,
      image2Thumbnail,
    };

    const updatedHistory = [newItem, ...existingHistory].slice(
      0,
      MAX_HISTORY_ITEMS
    );
    const serializedData = JSON.stringify(updatedHistory);

    // 容量チェック
    if (!checkStorageQuota(serializedData.length)) {
      console.warn("⚠️ 容量制限により古い履歴を削除します");
      // 古い履歴を削除して再試行
      const reducedHistory = [newItem, ...existingHistory].slice(
        0,
        Math.floor(MAX_HISTORY_ITEMS / 2)
      );
      const reducedData = JSON.stringify(reducedHistory);

      if (!checkStorageQuota(reducedData.length)) {
        throw new Error("容量制限により保存できません");
      }

      localStorage.setItem(HISTORY_STORAGE_KEY, reducedData);
      console.log(
        "💾 履歴保存完了（縮小版）。履歴件数:",
        reducedHistory.length
      );
      return newItem;
    }

    localStorage.setItem(HISTORY_STORAGE_KEY, serializedData);
    console.log("💾 履歴保存完了。新しい履歴件数:", updatedHistory.length);

    return newItem;
  } catch (error) {
    console.error("❌ 履歴の保存に失敗しました:", error);

    // 最小限のフォールバック（サムネイルも保存しない）
    try {
      console.log("🔄 最小限データで履歴保存を試行...");
      const existingHistory = getHistory();

      const minimalItem: HistoryItem = {
        image1: "",
        image2: "",
        promptLevel: historyItem.promptLevel,
        result: {
          differences: historyItem.result.differences.slice(0, 3), // 差分を3個まで
          summary: historyItem.result.summary.substring(0, 200), // サマリーを200文字まで
          confidence: historyItem.result.confidence,
          details: {
            structural_changes: [],
            color_changes: [],
            content_changes: [],
            layout_changes: [],
          },
        },
        id: Date.now().toString(),
        timestamp: new Date(),
        image1Thumbnail: "",
        image2Thumbnail: "",
      };

      const updatedHistory = [minimalItem, ...existingHistory].slice(0, 5); // 5件まで
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      console.log("✅ 最小限フォールバック保存完了");

      return minimalItem;
    } catch (fallbackError) {
      console.error("❌ フォールバック保存も失敗:", fallbackError);
      return null;
    }
  }
};

// 履歴を取得
export const getHistory = (): HistoryItem[] => {
  try {
    console.log("📖 履歴取得中...");
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!storedHistory) {
      console.log("📭 履歴が見つかりません");
      return [];
    }

    const history = JSON.parse(storedHistory);
    const processedHistory = history.map(
      (item: Omit<HistoryItem, "timestamp"> & { timestamp: string }) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })
    );

    console.log("📚 履歴取得完了:", processedHistory.length, "件");
    return processedHistory;
  } catch (error) {
    console.error("❌ 履歴の取得に失敗しました:", error);
    return [];
  }
};

// 履歴をクリア
export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error("履歴のクリアに失敗しました:", error);
  }
};

// 特定の履歴アイテムを削除
export const deleteHistoryItem = (id: string) => {
  try {
    const existingHistory = getHistory();
    const updatedHistory = existingHistory.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("履歴アイテムの削除に失敗しました:", error);
  }
};

// 日付フォーマット
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// デバッグ用：ローカルストレージの状態を確認
export const debugLocalStorage = () => {
  console.log("🔧 ローカルストレージデバッグ情報:");
  console.log("- ストレージキー:", HISTORY_STORAGE_KEY);

  try {
    const rawData = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (rawData) {
      console.log("- 生データ長:", rawData.length);
      const parsed = JSON.parse(rawData);
      console.log("- パース済みデータ:", parsed);
      console.log(
        "- アイテム数:",
        Array.isArray(parsed) ? parsed.length : "not array"
      );
    } else {
      console.log("- データなし");
    }

    // ローカルストレージの使用量確認
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    console.log("- ローカルストレージ総使用量:", totalSize, "chars");
  } catch (error) {
    console.error("- デバッグ中にエラー:", error);
  }
};
