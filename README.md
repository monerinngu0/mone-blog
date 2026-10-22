# モネのブログ / mone-blog

C++や情報科学を中心に、技術の仕組みや理論を深く理解するための個人技術ブログです。

Astro + MDXによる静的サイトとして開発しています。

## 技術構成

| 用途 | 技術 |
| --- | --- |
| サイト生成 | Astro |
| 記事本文 | MDX |
| 数式 | KaTeX |
| インタラクティブグラフ | JSXGraph |
| コンテンツ定義・検証 | Astro Content Collections / Zod |
| コード整形 | Prettier |
| テスト | Node.js Test Runner |
| CI | GitHub Actions |

## Setup

Node.jsのバージョンは `.nvmrc` を参照してください。

```bash
git clone https://github.com/monerinngu0/mone-blog.git
cd mone-blog
npm ci
npm run dev
```

開発サーバーのURLはターミナルに表示されます。

## Commands

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 静的サイトをビルド（`dist/`） |
| `npm run preview` | ビルド結果をプレビュー |
| `npm test` | 記事構造とURL管理のテスト |
| `npm run format` | コード整形 |
| `npm run format:check` | 整形チェック |
| `npm run check` | 整形チェック・テスト・ビルド |
| `npm run registry:check-history -- <ref>` | 指定Git参照との差分でURL履歴を検証 |

## Project Structure

```text
content/
├── articles/         # 記事本文と記事固有のアセット
├── tutorials/        # シリーズの定義
├── topics/           # 分類の定義
├── pages/            # Aboutなどの固定ページ
├── linked.json       # 外部リンク
└── url-registry.json # 公開記事URLの履歴

src/
├── components/       # UIコンポーネント
├── layouts/          # ページレイアウト
├── loaders/          # コンテンツの読み込み
├── lib/              # 参照解決・検証
├── pages/            # ルーティング
└── content.config.ts # コンテンツスキーマ

scripts/               # テスト・検証スクリプト
public/                # 静的アセット
docs/                  # 設計・管理仕様
```

## Content

- **Article**: 固有のIDとURLを持つ記事
- **Tutorial**: Articleを順序付きでまとめるシリーズ
- **Topic**: Articleを分類するカテゴリ
- **Page**: Aboutなど、Articleとは独立した固定ページ

Article IDは記事フォルダ名から決まり、整理用フォルダの階層には依存しません。公開記事のIDは `content/url-registry.json` で履歴管理します。

詳細は [Content Model](docs/content-model.md) と [URL Management](docs/url-management.md) を参照してください。記事本文の執筆方法についてはブログ内の記事として解説する予定です。

## Development

システムの構造は [Architecture](docs/architecture.md) を参照してください。

`main` へのpushとPull RequestでGitHub ActionsのCIを実行します。CIは整形チェック、テスト、URL Registryの履歴整合性検証、Astroビルドを実施します。

変更後はローカルで次を実行してください。

```bash
npm run check
```

## Documentation

- [Architecture](docs/architecture.md) — サイト構成と処理の流れ
- [Content Model](docs/content-model.md) — コンテンツの種類・ID・参照・公開仕様
- [URL Management](docs/url-management.md) — 公開URLの永続性と履歴管理

## Status

公開準備中です。基本機能とコンテンツ管理機構を実装しています。公開先としてCloudflare Pagesを想定しています。
