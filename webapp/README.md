# Next.js + Mastra エージェント検証アプリ

Mastraフレームワークを使用したAIエージェントの検証・開発用Webアプリケーションです。
Next.jsのWebアプリ上で対話的にエージェントを呼び出し、動作確認ができます。

## 主な機能

- ブラウザ上でのリアルタイムチャットUI
- 複数エージェントの切り替え対応
- ストリーミングレスポンス
- 会話履歴の管理

### 利用可能なエージェント

| エージェント名 | 説明 |
|--------------|------|
| CDK Report Agent | AWS CDKのGitHub PRを分析し、日本語でレポートを生成 |

## 前提条件

- Node.js 18以上
- AWS Bedrock APIへのアクセス権限
- （オプション）GitHub API Token

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、Bedrock API Keyを設定します。

```bash
BEDROCK_API_KEY=your-bedrock-api-key
```

オプションでGitHub APIトークンを設定すると、APIレート制限が緩和されます:

```bash
GITHUB_TOKEN=your-github-token
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開くと、チャットUIが表示されます。

## 使い方

1. ブラウザで http://localhost:3000 にアクセス
2. 画面右上のドロップダウンからエージェントを選択
3. テキストボックスにメッセージを入力してエージェントと対話

### CDK Report Agentの使用例

```
過去24時間のaws-cdkのPRレポートを作成してください
```

```
2024年11月のaws-cdkの主要な変更をまとめてください
```

## プロジェクト構造

```
webapp/
├── app/
│   ├── api/chat/route.ts   # チャットAPIエンドポイント
│   ├── assistant.tsx       # メインチャットコンポーネント
│   ├── page.tsx            # ルートページ
│   └── layout.tsx          # レイアウト
├── mastra/
│   ├── index.ts            # Mastraインスタンス設定
│   ├── agents/             # エージェント定義
│   │   └── cdkReportAgent.ts
│   └── tools/              # カスタムツール
│       └── githubTools.ts  # GitHub API連携ツール
├── lib/
│   └── client.ts           # AWS Bedrockクライアント設定
└── components/             # UIコンポーネント
```

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TailwindCSS
- **AIフレームワーク**: Mastra, AI SDK
- **LLM**: Amazon Bedrock (Claude Haiku 4.5)
- **UI**: assistant-ui/react, Radix UI

## 開発

### その他のnpmスクリプト

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Lint
npm run lint

# フォーマット
npm run prettier:fix

# Mastra開発サーバー（エージェント単体テスト用）
npm run mastra:dev
```

## エージェントの追加方法

1. `mastra/agents/`に新しいエージェントファイルを作成
2. `mastra/index.ts`でエージェントを登録
3. `app/assistant.tsx`のドロップダウンにオプションを追加

## ライセンス

MIT
