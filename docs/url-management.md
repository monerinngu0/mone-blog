# URL Management

公開済みArticleのURLを維持するための仕様です。

## Policy

ArticleのURLは `/articles/<id>/` です。整理用フォルダの移動やTutorialの所属変更はURLに影響しません。一度公開したIDは履歴に残し、再利用を防ぎます。

## URL Registry

台帳は `content/url-registry.json` です。

```json
{
  "version": 1,
  "articles": {
    "current-article": { "status": "active" },
    "old-article": { "status": "redirect", "to": "current-article" },
    "removed-article": { "status": "gone" }
  }
}
```

## Status

| Status | 意味 |
| --- | --- |
| `active` | 公開中のArticle |
| `redirect` | 別の公開Articleへの転送を予定するID |
| `gone` | 公開を終了し再利用しないID |

### active

同じIDの公開Articleが必要です。記事が存在しない、または下書きのみの場合は不正です。

### redirect

元IDは再利用できません。`to` で直接 `active` のArticleを指定します。Redirectチェーンは許可されません。

### gone

対応するArticleは存在できず、IDを再利用できません。

## Drafts

新規下書きはRegistryへの登録不要です。ただし `redirect` / `gone` に予約されたIDは利用できません。公開する際に `active` の登録が必要です。

## Validation

ビルド時にRegistryのバージョン・構造、ID形式、状態、余分なフィールド、公開Articleとの整合性、予約済みIDの再利用、Redirect先が直接 `active` であることを検証します。

GitHub Actionsでは過去のRegistryとの履歴比較も行い、以下を拒否します。

- 過去のRegistry項目の削除
- `redirect` / `gone` から `active` への復活

`active` な記事を廃止する場合は、項目を削除せず `redirect` または `gone` に変更します。

## Lifecycle

```text
新規下書き
   │
   ▼
公開 → active
         ├── 公開継続 → active
         ├── 転送対象 → redirect
         └── 公開終了 → gone
```

`redirect` / `gone` として確保したIDは公開Articleに戻せません。

## Implementation Status

現状実装済みなのはRegistryの構造・参照検証と、CIによる履歴比較です。

**RegistryからHTTPリダイレクトを自動生成する機能は未実装です。** `gone` に対するHTTP 410応答も保証しません。実際の配信挙動はホスティング側の設定を含めて別途実装する必要があります。

## Related Files

- `content/url-registry.json`
- `src/lib/url-registry.ts`
- `scripts/check-url-registry-history.mjs`
- `scripts/test-url-registry-history.mjs`
- `.github/workflows/ci.yml`
