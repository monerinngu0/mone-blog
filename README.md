mone's blog generator

## Articleの本文

記事は `content/articles/` 配下に記事ごとのフォルダを作り、その中の `index.mdx` に書きます。通常のMarkdownに加えて、数式・画像・インタラクティブグラフ・動画を利用できます。

### フォルダ構成と記事ID

- `content/articles/**/index.mdx` だけが記事本体です。`index.mdx` がないフォルダは整理用で、記事一覧や参照の対象になりません。他の名前の `.md` / `.mdx` も記事として読み込みません。
- 記事IDは `index.mdx` の直上のフォルダ名です。小文字英数字とハイフンを使います（例: `vector-capacity`）。frontmatterの `slug` では変更しません。
- 整理用フォルダは何階層でも作れます。記事フォルダの中に別の記事フォルダを置くこともできます。
- 記事フォルダ名は、下書きを含め `content/articles/` 全体で一意にします。異なる階層に同名の記事がある場合はビルドエラーです。
- 整理用フォルダ名は重複して構いません。記事フォルダと同じ名前でも、`index.mdx` がなければ記事IDの重複にはなりません。
- 階層を移動してもフォルダ名を変えなければURL・Tutorial・前提記事の参照は変わりません。参照には常に記事IDだけを使います。

例: `content/articles/cpp/vector/vector-capacity/index.mdx` のIDは `vector-capacity`、URLは `/articles/vector-capacity/` です。

記事フォルダの中身は次のとおりです。

| パス | 用途 |
| --- | --- |
| `index.mdx` | 記事本体・frontmatter。記事フォルダの判定に使用 |
| `img/` | その記事で使う画像。画像ファイルを直下に置き、基本的にサブフォルダは作らない |

既存のJSXGraph用 `graph.js` も、それを使う記事フォルダに同梱しています。共通コンポーネントは `@components/` でimportするので、整理用フォルダの階層に影響されません。TopicsとTutorialsの定義もルートの `content/topics/`・`content/tutorials/` に置きます。Astroの設定ファイルは `src/content.config.ts` です。

### LaTeX数式

インライン数式は `$O(n)$`、別行の数式は `$$` で囲みます。KaTeXでビルド時にHTMLへ変換されるため、表示時のJavaScriptは不要です。

```mdx
計算量は $O(n)$ です。

$$
\sum_{i=0}^{k} 2^i = 2^{k+1} - 1
$$
```

### 画像

キャプションが必要な画像は `ArticleImage` を使います。画像は各記事の `img/` 直下に置き、`./img/ファイル名` からimportすると、Astroがサイズに合わせて最適化します。`alt` は必須です。

```mdx
import ArticleImage from '@components/article/ArticleImage.astro';
import diagram from './img/example.png';

<ArticleImage
  src={diagram}
  alt="図の内容を説明する代替テキスト"
  caption="本文を補足するキャプション"
/>
```

キャプションが不要なら通常のMarkdown記法 `![代替テキスト](./img/example.png)` も使えます。

### JSXGraph

グラフの処理は記事フォルダ内のJavaScriptモジュールに分けます。MDXには表示枠だけを書くため、長い処理が本文に混ざりません。同じページに複数置く場合は、それぞれ異なる `id` を指定します。

```js
// 記事フォルダ内の quadratic.js
export default function setup(board) {
  const a = board.create('slider', [[-4, -4], [1, -4], [-2, 1, 2]], {
    name: 'a',
  });
  board.create('functiongraph', [(x) => a.Value() * x * x]);
}
```

```mdx
import JSXGraph from '@components/article/JSXGraph.astro';
import quadraticGraph from './quadratic.js?url';

<JSXGraph
  id="quadratic-graph"
  module={quadraticGraph}
  boundingBox={[-5, 5, 5, -5]}
  caption="スライダーで係数 a を変更できます。"
/>
```

初期化モジュールは `board` と第2引数の `JXG` を受け取れます。`height`、`axis`、`keepAspectRatio` も必要に応じて指定できます。

### 動画

YouTubeはプライバシー強化モードで埋め込みます。URL全体ではなく11文字の動画IDを指定します。

```mdx
import YouTube from '@components/article/YouTube.astro';

<YouTube
  id="dQw4w9WgXcQ"
  title="動画の内容を表すタイトル"
  caption="動画の補足"
/>
```

自分で配信する動画は `public/videos/` に置き、`Video` を使います。字幕がある場合はWebVTTファイルも指定できます。

```mdx
import Video from '@components/article/Video.astro';

<Video
  src="/videos/example.mp4"
  type="video/mp4"
  title="操作例"
  poster="/videos/example-poster.webp"
  captions="/videos/example-ja.vtt"
  caption="実際の操作手順"
/>
```

## Tutorials

`content/tutorials/<id>.yaml` にシリーズを定義します。ファイル名は小文字英数字とハイフンで指定します。

```yaml
title: std::vectorを理解する
description: vectorの基本とメモリ確保を学ぶシリーズ。
articles:
  - vector-introduction
  - vector-capacity
```

`articles` は記事ファイルのIDを読む順番で並べます。本文のコピーや記事側のTutorial指定は不要です。本編として所属できるTutorialは記事ごとに1つだけです（下書きのTutorialも含む）。他のTutorialから利用する場合は前提記事として参照します。

- `/tutorials/`: 公開シリーズ一覧
- `/tutorials/vector/`: 指定順の章一覧
- 記事ページ: 所属シリーズごとの章一覧・現在の章番号・前後リンク
- PCでは章一覧を左側に表示し、小さい画面では本文上部で折りたためます
- `draft: true` のシリーズは非公開
- 存在しない記事・重複した記事参照はエラー
- 公開シリーズが下書き記事を含む場合はビルドエラー（公開順を意図せず詰めないため）

記事のURLは常に `/articles/<id>/` です。章ナビゲーションは本編として所属するTutorialだけを表示します。前提記事の参照は章順・章数・所属先に影響しません。Articles一覧は公開日の新しい順です。

## 前提知識・前提記事

ArticleのfrontmatterとTutorialのYAMLの両方で設定できます。

```yaml
prerequisites:
  - text: C++の配列を使ったことがある
  - article: vector-introduction
```

`text` は文章、`article` は記事IDです。記事リンクの表示名は参照先のタイトルから自動取得します。同じ前提記事を複数のArticle・Tutorialから参照できます。前提知識はArticleの冒頭またはTutorialの説明の下に表示します。

前提記事が存在しない場合、公開コンテンツから下書き記事を参照する場合、記事が自分自身を前提にする場合はビルドエラーになります。各項目は `text` または `article` の片方だけを指定します。従来の文字列形式（`- 配列の基本を知っている`）も文章として読み込めます。


## Topics

Topicは `content/topics/<id>.yaml` で定義します。ファイル名がURLと記事からの参照IDになります（小文字英数字とハイフン）。表示名は自由に変更できます。

```yaml
# content/topics/cpp.yaml
name: C++
description: C++の言語仕様や機能を、仕組みから理解する記事。
```

記事のfrontmatterでは表示名ではなくIDを指定します。

```yaml
topics:
  - cpp
  - stl
```

- `/topics/`: Topicの説明と公開記事数
- `/topics/cpp/`: 該当する公開記事を新しい順に表示
- ホーム・記事一覧・記事詳細のTopic名から各Topicへ移動
- 未定義のTopic参照は下書きも含めビルドエラー
- `draft: true` の記事は一覧・記事数・記事ページから除外
- 記事が0件のTopicも表示（空の状態を案内）

Topic側に記事リストを書く必要はありません。記事の `topics` から自動集約します。

```sh
npm install
npm run build
npm run dev
```

記事フォルダの読み込み・重複検出・移動後の参照は `npm test` で検証できます（元の記事を変更せず、一時ディレクトリでビルドします）。
