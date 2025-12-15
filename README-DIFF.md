# 🔍 画像差分チェッカー with Ollama

このプロジェクトは、Ollamaを使用してAIによる画像差分分析を行うWebアプリケーションです。

## 🚀 セットアップ手順

### 1. Ollamaのインストール

#### macOS
```bash
# Homebrewを使用してインストール
brew install ollama

# または公式サイトからダウンロード
# https://ollama.ai/download
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Windows
公式サイトからインストーラーをダウンロード: https://ollama.ai/download

### 2. Ollamaの起動とモデルのダウンロード

```bash
# Ollamaサービスを起動
ollama serve

# 新しいターミナルウィンドウで以下を実行
# ビジョンモデルをダウンロード（いずれか一つ）
ollama pull llama3.2-vision    # 推奨: 高精度なビジョンモデル
# または
ollama pull llava              # 代替案: 軽量なビジョンモデル
```

### 3. アプリケーションの起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 4. 使用方法

1. ブラウザで `http://localhost:3000/diff` にアクセス
2. 2つの画像をアップロード（比較したい画像）
3. 「差分を分析する」ボタンをクリック
4. AIによる詳細な分析結果を確認

## 🔧 設定

### モデルの変更

`src/app/api/diff-images/route.ts` ファイルの以下の部分でモデルを変更できます：

```typescript
model: 'llama3.2-vision', // ここを変更
```

利用可能なモデル：
- `llama3.2-vision` - 最新の高精度ビジョンモデル
- `llava` - 軽量なビジョンモデル
- `llava:13b` - より高精度なバージョン

### Ollamaサーバーの設定

デフォルトでは `http://localhost:11434` でOllamaサーバーに接続します。
別のホストやポートを使用する場合は、APIルートの接続先URLを変更してください。

## 📋 機能

### 🎯 主な機能
- **2画像の同時アップロード** - ドラッグ&ドロップ対応
- **AI画像分析** - Ollamaによる高精度な差分検出
- **詳細レポート** - 構造、色彩、コンテンツ、レイアウトの変更を分類
- **信頼度表示** - 分析結果の信頼度を数値で表示
- **結果ダウンロード** - 分析結果をJSONファイルで保存

### 🔍 分析カテゴリ
1. **構造変更** - レイアウト、要素の配置
2. **色彩変更** - 背景色、テキスト色、アクセント色
3. **コンテンツ変更** - テキスト、画像、アイコン
4. **レイアウト変更** - マージン、パディング、サイズ

## 🛠️ トラブルシューティング

### Ollama接続エラー
```
Error: Ollama API error: Connection refused
```

**解決方法:**
1. Ollamaサーバーが起動していることを確認
   ```bash
   ollama serve
   ```
2. モデルがダウンロード済みか確認
   ```bash
   ollama list
   ```
3. ポート11434が使用可能か確認

### モデルが見つからない
```
Error: model not found
```

**解決方法:**
```bash
# 必要なモデルをダウンロード
ollama pull llama3.2-vision
```

### メモリ不足エラー
**解決方法:**
- より軽量なモデルを使用
  ```bash
  ollama pull llava:7b
  ```
- または、メモリを増やしてOllamaを起動
  ```bash
  OLLAMA_HOST=0.0.0.0:11434 ollama serve
  ```

## 📦 依存関係

- **Next.js 14** - Reactフレームワーク
- **Motion/React** - アニメーションライブラリ
- **Tailwind CSS** - スタイリング
- **Ollama** - ローカルAIモデル実行環境

## 🤝 貢献

プルリクエストや問題報告を歓迎します！

## 📄 ライセンス

MIT License

---

**注意:** このアプリケーションはローカルでOllamaを実行するため、インターネット接続は不要ですが、
初回のモデルダウンロード時にはインターネット接続が必要です。
