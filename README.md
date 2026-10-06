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

`articles` は記事ファイルのIDを読む順番で並べます。本文のコピーや記事側のTutorial指定は不要です。同じ記事を複数シリーズで利用できます。

- `/tutorials/`: 公開シリーズ一覧
- `/tutorials/vector/`: 指定順の章一覧
- 記事ページ: 所属シリーズごとの章一覧・現在の章番号・前後リンク
- PCでは章一覧を左側に表示し、小さい画面では本文上部で折りたためます
- `draft: true` のシリーズは非公開
- 存在しない記事・重複した記事参照はエラー
- 公開シリーズが下書き記事を含む場合はビルドエラー（公開順を意図せず詰めないため）

記事のURLは常に `/articles/<id>/` です。複数シリーズに所属する場合、それぞれの章ナビゲーションを表示します。


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
