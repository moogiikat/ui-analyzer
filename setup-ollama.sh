#!/bin/bash

echo "🔍 Ollama 画像差分チェッカー セットアップスクリプト"
echo "=================================================="

# Ollamaがインストールされているかチェック
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollamaがインストールされていません"
    echo "📦 インストール方法:"
    echo "macOS: brew install ollama"
    echo "Linux: curl -fsSL https://ollama.ai/install.sh | sh"
    echo "Windows: https://ollama.ai/download からダウンロード"
    exit 1
fi

echo "✅ Ollamaがインストールされています"

# Ollamaサービスが起動しているかチェック
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "⚠️  Ollamaサービスが起動していません"
    echo "🚀 以下のコマンドで起動してください:"
    echo "ollama serve"
    echo ""
    echo "起動後、再度このスクリプトを実行してください"
    exit 1
fi

echo "✅ Ollamaサービスが起動しています"

# 利用可能なモデルをチェック
echo "📋 インストール済みモデル:"
ollama list

# ビジョンモデルがインストールされているかチェック
if ! ollama list | grep -E "(llama3.2-vision|llava)" >/dev/null 2>&1; then
    echo ""
    echo "⚠️  ビジョンモデルがインストールされていません"
    echo "📥 推奨モデルをインストールしますか？ (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🔄 llama3.2-vision をダウンロード中..."
        ollama pull llama3.2-vision
        
        if [ $? -eq 0 ]; then
            echo "✅ モデルのダウンロードが完了しました"
        else
            echo "❌ モデルのダウンロードに失敗しました"
            echo "🔄 代替案として llava をダウンロード中..."
            ollama pull llava
        fi
    fi
else
    echo "✅ ビジョンモデルがインストールされています"
fi

# テスト用の簡単なAPIコール
echo ""
echo "🧪 Ollama APIテスト中..."

test_response=$(curl -s -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2-vision",
    "prompt": "Hello, can you see images?",
    "stream": false
  }' 2>/dev/null)

if [ $? -eq 0 ] && echo "$test_response" | grep -q "response"; then
    echo "✅ Ollama APIが正常に動作しています"
else
    echo "⚠️  llama3.2-vision が利用できません。llava を試しています..."
    
    test_response=$(curl -s -X POST http://localhost:11434/api/generate \
      -H "Content-Type: application/json" \
      -d '{
        "model": "llava",
        "prompt": "Hello, can you see images?",
        "stream": false
      }' 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$test_response" | grep -q "response"; then
        echo "✅ llava モデルが正常に動作しています"
        echo "📝 route.ts で model: 'llava' に変更してください"
    else
        echo "❌ ビジョンモデルが正常に動作していません"
        echo "💡 トラブルシューティング:"
        echo "1. ollama pull llama3.2-vision"
        echo "2. ollama pull llava"
        echo "3. ollama serve を再起動"
    fi
fi

echo ""
echo "🎉 セットアップチェック完了！"
echo "🌐 http://localhost:3000/diff にアクセスして画像差分チェッカーを使用できます"
