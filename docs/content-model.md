# Content Model

mone-blogのコンテンツ構造、識別子、参照関係、公開状態の仕様です。

スキーマは `src/content.config.ts`、参照検証は主に `src/lib/content.ts`、記事フォルダの検証は `src/loaders/articles.ts` にあります。

## Content Types

| Type | 保存場所 | 識別子 |
| --- | --- | --- |
| Article | `content/articles/**/index.mdx` | 記事フォルダ名 |
| Tutorial | `content/tutorials/<id>.yaml` | ファイル名 |
| Topic | `content/topics/<id>.yaml` | ファイル名 |
| Page | `content/pages/<id>/index.mdx` | 直下のフォルダ名 |

## Article

Articleは独立した記事です。

```text
content/articles/
├── introduction/
│   ├── index.mdx
│   └── img/
└── _cpp/
    └── vector-capacity/
        ├── index.mdx
        └── img/
```

`index.mdx` のあるフォルダをArticleとして認識します。記事IDはその直上のフォルダ名です。

例えば `content/articles/_cpp/vector-capacity/index.mdx` の記事IDは `vector-capacity`、URLは `/articles/vector-capacity/` です。

### ID Rules

Article IDの形式:

```regex
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

- 下書きを含め、Article IDは全体で一意でなければなりません。
- 整理用フォルダの階層はID・URLに影響しません。
- 記事フォルダ以外の整理用フォルダは `_` で始める必要があります。
- 整理用フォルダに `index.mdx` は置けません。
- Articleの中に別のArticleフォルダを置くこともできます。
- 記事フォルダ名を保って移動すれば、URLと参照IDは変わりません。

### Metadata

| Field | Type | Required | Default |
| --- | --- | --- | --- |
| `title` | string | Yes | — |
| `description` | string | Yes | — |
| `publishedAt` | date | Yes | — |
| `updatedAt` | date | No | — |
| `topics` | Topic ID[] | No | `[]` |
| `prerequisites` | Prerequisite[] | No | `[]` |
| `related` | string[] | No | — |
| `draft` | boolean | No | `false` |

`related` は現行スキーマ上は単なる文字列配列で、Article参照としての検証は定義されていません。

### Publication

`draft: true` のArticleは本番ビルドで公開対象から除外されます。開発サーバーでは下書きも閲覧できます。公開記事はURL Registryで `active` として登録する必要があります。

## Tutorial

TutorialはArticleを順序付きでまとめるシリーズで、`content/tutorials/<id>.yaml` に定義します。

| Field | Type | Required | Default |
| --- | --- | --- | --- |
| `title` | string | Yes | — |
| `description` | string | Yes | — |
| `articles` | Article ID[] | Yes（1件以上） | — |
| `prerequisites` | Prerequisite[] | No | `[]` |
| `featured` | boolean | No | `false` |
| `draft` | boolean | No | `false` |

### Chapter Rules

- 章の順序は `articles` 配列で決まります。
- 同じTutorial内で記事を重複指定できません。
- 一つのArticleが本編として所属できるTutorialは最大一つです（下書きTutorialも含む）。
- 公開Tutorialに下書きArticleを含めることはできません。
- 別のTutorialの記事は前提記事として参照できます。
- TutorialはArticle本文をコピーせず、IDと順序だけを管理します。

公開済みTutorialの `featured: true` は最大一つです。該当がない場合は実装側で表示候補を選びます。

## Topic

Topicは `content/topics/<id>.yaml` に定義します。

| Field | Type | Required |
| --- | --- | --- |
| `name` | string | Yes |
| `description` | string | Yes |

- Topic IDはファイル名から決まり、表示名とは独立しています。
- 一つのArticleは複数Topicに属せます。
- Topic側にArticle一覧は保持せず、記事の `topics` から集約します。
- 未定義Topicへの参照はビルドエラーです。
- 下書きは公開一覧・件数に含みません。
- 公開記事が0件のTopicも表示されます。

## Prerequisites

ArticleとTutorialは、文字列または `{ text: ... }` の前提知識、`{ article: ... }` の前提記事を指定できます。

- 参照先Articleは存在する必要があります。
- Article自身を自分の前提記事にできません。
- 公開Article / Tutorialは下書きArticleを前提記事として参照できません。
- 同じ前提記事を複数箇所から参照できます。
- 前提記事はTutorialの章順・章数・所属先に影響しません。

## Page

Pageは `content/pages/<id>/index.mdx` にある固定ページです。metadataは `title` と `description` で、Article一覧やTutorialの章には含まれません。現在の代表例はAboutです。

## Relationships and Invariants

- ArticleとTopicは多対多です。
- TutorialはArticleを章として参照しますが、Articleの本編所属先は最大一つです。
- 前提記事の参照は複数コンテンツで再利用できます。
- Article IDは一意で、整理用フォルダの移動に依存しません。
- 公開コンテンツから下書きへの不正な参照を禁止します。
- 存在しない参照はビルド時に検出します。
- 公開URLの履歴を維持します。詳細は [URL Management](url-management.md) を参照してください。
