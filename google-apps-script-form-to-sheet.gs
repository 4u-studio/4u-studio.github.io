/**
 * 4U Studio 無料デモ申し込みフォーム → Googleスプレッドシート保存用
 *
 * 使い方:
 *  1. 保存先にしたいGoogleスプレッドシートを開き、URL内のIDをコピー
 *     https://docs.google.com/spreadsheets/d/【ここがID】/edit
 *  2. 下の SPREADSHEET_ID にそのIDを貼り付け
 *  3. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *     - 次のユーザーとして実行: 自分
 *     - アクセスできるユーザー: 全員  ← 必須
 *  4. 発行された「ウェブアプリ URL（.../exec）」を index.html の FORM_ENDPOINT に設定
 */

const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_HERE';
const SHEET_NAME = '無料デモ申込';

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
