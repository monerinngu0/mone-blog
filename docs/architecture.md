# Architecture

mone-blogのシステム構成と主要モジュールの責務です。

## Overview

mone-blogはAstroによる静的サイトです。記事・シリーズ・分類をファイルで管理し、ビルド時に読み込み・検証・HTML生成を行います。データベースや実行時CMSは使用しません。

## Content Pipeline

```text
content/
   │
   ▼
Astro Content Collections
   ├── Article Folder Loader
   ├── Topic Loader
   ├── Tutorial Loader
   └── Page Loader
   │
   ▼
スキーマ検証
   │
   ▼
参照解決・整合性検証
   ├── 公開状態 / Article ID
   ├── Tutorialの章構成
   ├── Topic / 前提記事の参照
   └── URL Registry
   │
   ▼
Astro Pages / Layouts / Components
   │
   ▼
静的HTML生成 → dist/
```

## Main Modules

| モジュール | 役割 |
| --- | --- |
| `astro.config.mjs` | Astro・MDX・数式処理 |
| `src/content.config.ts` | Content Collectionsのスキーマ |
| `src/loaders/articles.ts` | 記事探索、ID生成、重複検出 |
| `src/lib/content.ts` | コンテンツ間の参照解決、公開状態 |
| `src/lib/url-registry.ts` | 記事URL台帳の検証 |
| `src/pages/` | 静的ルーティング |
| `src/layouts/` | 共通レイアウト |
| `src/components/` | 表示部品 |

## Routes

| URL | 内容 |
| --- | --- |
| `/` | ホーム |
| `/articles/` | 記事一覧 |
| `/articles/<id>/` | 記事詳細 |
| `/tutorials/` | Tutorial一覧 |
| `/tutorials/<id>/` | Tutorial詳細 |
| `/topics/` | Topic一覧 |
| `/topics/<id>/` | Topic別一覧 |
| `/about/` | About |

記事URLはファイルの整理用階層に依存しません。

### Home / Articles

Homeには公開日が新しい記事を最大5件表示します。Articles一覧には公開記事を公開日の降順で表示します。記事詳細にはTopic・前提知識・所属Tutorialと章ナビゲーションなどを表示します。

ホームの注目Tutorialは、公開済みの `featured: true` を優先します。公開済みTutorialの `featured: true` は最大1件です。

### Tutorials / Topics

Tutorialは記事を複製せず、Article IDの順序付きリストとして管理します。各章のURLは独立したArticle URLです。

Topicの記事一覧はArticle側の `topics` から自動集約し、Topic側に記事一覧を保存しません。

### About / Linked

Aboutは `content/pages/about/index.mdx` にある固定ページです。Linkedは `content/linked.json` で定義するナビゲーションメニューで、独立したページを持ちません。

## Rendering

- **Markdown / MDX**: 記事と固定ページの本文
- **数式**: remark-math / rehype-katex / KaTeX
- **画像**: Markdown画像と専用画像コンポーネント、画像拡大表示
- **コードブロック**: コードコピー機能
- **インタラクティブ要素**: JSXGraph、YouTube、動画コンポーネント

具体的な記事の執筆方法は本ドキュメントでは扱いません。

## Validation

ビルド時に、記事IDの重複・形式、存在しない参照、Tutorialの章重複と本編所属重複、公開コンテンツから下書きへの不正な参照、URL Registryとの不整合を検証します。可能な限り不正な状態をビルドエラーとして検出します。

## Build and CI

`npm run build` で静的サイトを生成します。GitHub Actionsは整形チェック、テスト、URL Registry履歴検証、ビルドを実行します。

公開環境へのデプロイ設定は、運用方法を確定した段階で追記します。
