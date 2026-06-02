/**
 * 4U Studio 無料デモ申し込みフォーム → Googleスプレッドシート保存＋グラフ自動生成
 *
 * できること:
 *  - 申込内容を「無料デモ申込」シートに、列を分けてきれいに保存
 *  - 送信のたびに「集計」シートを自動更新し、グラフを自動で作成
 *      ・希望プラン別の件数（円グラフ）
 *      ・月別の申込数（棒グラフ）
 *
 * 使い方:
 *  1. 保存先にしたいGoogleスプレッドシートを開き、URL内のIDをコピー
 *     https://docs.google.com/spreadsheets/d/【ここがID】/edit
 *  2. 下の SPREADSHEET_ID にそのIDを貼り付け
 *  3. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *     - 次のユーザーとして実行: 自分
 *     - アクセスできるユーザー: 全員  ← 必須
 *  4. 発行された「ウェブアプリ URL（.../exec）」を担当（Claude）に伝える
 */

const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_HERE';
const SHEET_NAME = '無料デモ申込';
const SUMMARY_NAME = '集計';

const HEADERS = [
  '受信日時',
  '希望プラン',
  'お名前',
  'メールアドレス',
  '店名・事業名',
  '業種・サービス内容',
  'エリア',
  '参考リンク',
  '掲載したい内容・ご要望',
  '同意',
  '送信元',
  'ページURL'
];

// プランの表示順（集計の並び順）
const PLAN_ORDER = [
  'A プレミアム｜しっかり事業サイト',
  'B スタンダード｜予約につなげるスマホページ',
  'C ライト｜お店紹介スマホページ',
  '相談して決めたい'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const p = (e && e.parameter) || {};
    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      p.plan_type || '',
      p.name || '',
      p.email || '',
      p.business_name || '',
      p.industry || '',
      p.area || '',
      p.reference_url || '',
      p.message || '',
      p.privacy_agree || '',
      p.source || '',
      p.page_url || ''
    ]);
    rebuildSummary_();
    return HtmlService.createHtmlOutput('送信しました');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return HtmlService.createHtmlOutput('4U Studio form endpoint is running.');
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 「集計」シートを作り直し、グラフを自動生成する
 */
function rebuildSummary_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = ss.getSheetByName(SHEET_NAME);
  if (!data) return;

  const last = data.getLastRow();
  const planCounts = {};
  PLAN_ORDER.forEach(function (k) { planCounts[k] = 0; });
  const monthCounts = {};

  if (last >= 2) {
    const rows = data.getRange(2, 1, last - 1, 2).getValues(); // A:受信日時, B:希望プラン
    rows.forEach(function (r) {
      const date = r[0];
      let plan = (r[1] || '未選択').toString();
      if (!(plan in planCounts)) planCounts[plan] = 0;
      planCounts[plan]++;

      if (date instanceof Date && !isNaN(date)) {
        const ym = Utilities.formatDate(date, ss.getSpreadsheetTimeZone() || 'Asia/Tokyo', 'yyyy-MM');
        monthCounts[ym] = (monthCounts[ym] || 0) + 1;
      }
    });
  }

  // 集計シートを用意（毎回まっさらに作り直す）
  let sum = ss.getSheetByName(SUMMARY_NAME);
  if (!sum) sum = ss.insertSheet(SUMMARY_NAME);
  sum.getCharts().forEach(function (c) { sum.removeChart(c); });
  sum.clear();

  // ---- 希望プラン別 件数（A列）----
  sum.getRange('A1').setValue('希望プラン別 件数').setFontWeight('bold').setFontSize(12);
  sum.getRange('A2:B2').setValues([['プラン', '件数']]).setFontWeight('bold');
  const planKeys = Object.keys(planCounts);
  const planTable = planKeys.map(function (k) { return [shortPlan_(k), planCounts[k]]; });
  if (planTable.length) {
    sum.getRange(3, 1, planTable.length, 2).setValues(planTable);
  }
  const planEndRow = 2 + planTable.length;

  // ---- 月別 申込数（E列）----
  sum.getRange('E1').setValue('月別 申込数').setFontWeight('bold').setFontSize(12);
  sum.getRange('E2:F2').setValues([['月', '件数']]).setFontWeight('bold');
  const months = Object.keys(monthCounts).sort();
  const monthTable = months.map(function (m) { return [m, monthCounts[m]]; });
  if (monthTable.length) {
    sum.getRange(3, 5, monthTable.length, 2).setValues(monthTable);
  }
  const monthEndRow = 2 + monthTable.length;

  // 件数合計
  const total = planKeys.reduce(function (a, k) { return a + planCounts[k]; }, 0);
  sum.getRange('A' + (planEndRow + 2)).setValue('申込 合計：' + total + ' 件').setFontWeight('bold');

  // ---- グラフ：希望プラン別（円グラフ）----
  if (planTable.length) {
    const pie = sum.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(sum.getRange(2, 1, planTable.length + 1, 2))
      .setPosition(2, 8, 0, 0)
      .setOption('title', '希望プラン別の割合')
      .setOption('pieHole', 0.4)
      .setOption('width', 460)
      .setOption('height', 280)
      .build();
    sum.insertChart(pie);
  }

  // ---- グラフ：月別 申込数（棒グラフ）----
  if (monthTable.length) {
    const bar = sum.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sum.getRange(2, 5, monthTable.length + 1, 2))
      .setPosition(18, 8, 0, 0)
      .setOption('title', '月別の申込数')
      .setOption('legend', { position: 'none' })
      .setOption('width', 460)
      .setOption('height', 280)
      .build();
    sum.insertChart(bar);
  }

  sum.setColumnWidth(1, 220);
  sum.autoResizeColumns(5, 2);
}

// 長いプラン名を集計用に短く表示
function shortPlan_(name) {
  if (name.indexOf('A ') === 0 || name.indexOf('A｜') === 0) return 'A しっかり事業サイト';
  if (name.indexOf('B ') === 0 || name.indexOf('B｜') === 0) return 'B 予約スマホページ';
  if (name.indexOf('C ') === 0 || name.indexOf('C｜') === 0) return 'C お店紹介ページ';
  if (name.indexOf('相談') === 0) return '相談して決めたい';
  return name;
}

/**
 * 「無料デモ申込」シートを見やすく整える（手動で1回だけ実行すればOK）
 *  - 名前もメールも空の行（手動テストの空行など）を掃除
 *  - ヘッダーに色／1行おきの色分け／列幅／日時の整形
 *  - 不要な初期シート「シート1」を削除
 *  - 集計シートとグラフも最新化
 */
function formatNow() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  // 1) 名前もメールも空の行を掃除
  for (var r = sheet.getLastRow(); r >= 2; r--) {
    var name = sheet.getRange(r, 3).getValue();
    var email = sheet.getRange(r, 4).getValue();
    if (!name && !email) sheet.deleteRow(r);
  }

  // 2) 見た目を整える
  const cols = HEADERS.length;
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 34);
  sheet.getRange(1, 1, 1, cols)
    .setFontWeight('bold').setFontColor('#ffffff')
    .setBackground('#27503a').setVerticalAlignment('middle');

  const widths = [150, 200, 110, 210, 150, 150, 110, 210, 280, 80, 120, 220];
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });

  const maxRows = sheet.getMaxRows();
  sheet.getRange(2, 1, maxRows - 1, 1).setNumberFormat('yyyy/MM/dd HH:mm'); // 受信日時
  sheet.getRange(2, 9, maxRows - 1, 1).setWrap(true);                       // 掲載したい内容

  // 3) 1行おきに色（バンディング）
  sheet.getBandings().forEach(function (b) { b.remove(); });
  const bandRows = Math.max(sheet.getLastRow() - 1, 200);
  sheet.getRange(2, 1, bandRows, cols)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREEN, false, false);

  // 4) 不要な初期シート「シート1」を削除
  var def = ss.getSheetByName('シート1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);

  // 5) 集計とグラフを最新化
  rebuildSummary_();
}

