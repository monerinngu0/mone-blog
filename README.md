mone's blog generator

## Tutorials

`src/content/tutorials/<id>.yaml` にシリーズを定義します。ファイル名は小文字英数字とハイフンで指定します。

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

Topicは `src/content/topics/<id>.yaml` で定義します。ファイル名がURLと記事からの参照IDになります（小文字英数字とハイフン）。表示名は自由に変更できます。

```yaml
# src/content/topics/cpp.yaml
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
