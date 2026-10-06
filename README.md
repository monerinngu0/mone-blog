mone's blog generator


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
