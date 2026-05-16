# SBI証券 ウェブ拡張ツール

SBI証券（`https://site.sbisec.co.jp/*`）に便利機能を追加するChrome拡張。

## ファイル構成

- `manifest.json` — Manifest V3。対象URL、content script の登録
- `content.js` — 全機能の実装。`initFeatures()` から各機能を呼び出す

## 新機能の追加方針

1. `content.js` に独立した関数（例: `initXxxFeature()`）を追加する
2. `initFeatures()` の末尾でその関数を呼び出す
3. 各機能は対象ページのみで動作するよう、URLまたはDOM要素でガードする

## 対象ページの判定

URLによる判定:
```javascript
const url = window.location.href;
if (url.includes('sw_param3=profits')) { ... }
```

DOM要素の存在確認:
```javascript
const el = document.querySelector('#profit-search');
if (!el) return;
```

## React controlled input の値変更パターン

SBIのページはReactを使用しており、入力フィールドへの値設定には native setter + `input` イベントが必要:

```javascript
function setReactInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
```

## 重複挿入の防止

DOM要素に `data-sbi-ext-added="true"` を付けてガード:
```javascript
if (container.dataset.sbiExtAdded) return;
container.dataset.sbiExtAdded = 'true';
```

## 実装済み機能

### 実現損益詳細 — 日付ショートカット

**対象ページ**: URL に `sw_param3=profits` を含むページ（実現損益詳細）

**概要**: 期間検索エリアに「昨年度」「昨年」「今年度」ボタンを追加する。

| ボタン | 開始日 | 終了日 | 備考 |
|--------|--------|--------|------|
| 昨年度 | 前年4月1日 | 今年3月31日 | 4月区切り |
| 昨年   | 前年1月1日 | 前年12月31日 | 暦年 |
| 今年度 | 今年4月1日 | 来年3月31日 | 4月区切り |

**実装関数**: `initProfitsDateShortcuts()` in `content.js`
