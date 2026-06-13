# 合同会社4U 公式サイト / LP制作プロジェクト

群馬県沼田市の小規模事業者向けに、AIを活用したLP/HP制作を行うサービスサイト。
飲食店・美容室・整体・サロンなど「来店系のお店」が主なターゲット。

## デザインスキル

このプロジェクトのUIは **`terracotta`** デザインスキルに準拠します。
AIエージェントがUIコードを生成・修正する際は、必ず以下を参照してください。

- `.claude/skills/terracotta/SKILL.md` — AIエージェント向け指示（トークン・コンポーネント規約・アクセシビリティ・品質ゲート）
- `.claude/skills/terracotta/DESIGN.md` — 人間向けのデザイン意図・背景

### terracotta を選んだ理由

`bergside/awesome-design-skills` の67スキルから、本サイトの実装（`index.html`）と
ブランド方針に最も合致するため採用。比較した主な候補は以下。

| スキル | 評価 | 理由 |
|---|---|---|
| **terracotta** ✅ | 採用 | 暖かいクリーム面＋ディスプレイセリフ見出し＋単一のテラコッタアクセント。土の温度感・人間味・コンテンツ第一の編集的レイアウト。本サイトの `--cream`/`--terra`/`--ochre` 配色と明朝（Shippori Mincho）見出し、ブランドの「誠実・的確・温かい」に直結 |
| cafe | 次点 | 暖色＋クリームで方向性は近いが、Poppins中心でセリフ不在。編集的な品より「カジュアルな居心地」寄り |
| editorial | 候補 | セリフ＋グリッドは合うが、白黒基調で暖かみに欠ける |
| refined / elegant / clean / minimal / professional | 不採用 | ブルー基調・汎用的で、本サイトの暖色アースカラーと不一致 |

### 本サイトの実配色との対応

terracotta の方針を、既存の `index.html` のCSS変数に合わせて運用する。

- クリーム面: `--cream #f6f0e2` / `--paper #fffdf6`（skillの surface/secondary に相当）
- テラコッタ・アクセント: `--terra #c87b52` / `--ochre #d4a24c`（skillの primary #C56A3C 系）
- インク見出し: `--ink #1c2620`（深いブラウン/グリーン寄りのインク）
- 見出しセリフ: Shippori Mincho（skillのDM Serif Displayに相当する明朝ディスプレイ役）
- 本文ゴシック: Zen Kaku Gothic New（可読性優先・line-height 1.8前後）

> skill側のトークン値（#C56A3C 等）は方向性の指針。実装では上記の既存CSS変数を
> 正とし、新規パーツも同じ温度感・余白リズム・アクセント1色の原則を守る。

## 関連ドキュメント

- `lp/lp-design-spec.md` — 事業コンセプト・ターゲット・LP構成の設計書
- `lp/brand-guidelines.md` — カラー／トンマナのドラフト
