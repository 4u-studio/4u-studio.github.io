/**
 * 4U_無料サンプル申し込み管理シートを「実用的」に整えるための関数。
 *
 * ▼ 使い方（むずかしくありません）
 *   1. Apps Scriptの画面をひらく
 *   2. このファイルの中身を「ぜんぶコピー」して、新しいファイルに貼り付ける
 *   3. 上の関数えらびで「enhance4UManagementSheetsFinal」を選ぶ
 *   4. 「実行」ボタンを押す（初回だけ「承認」を求められます → 自分のアカウントで許可）
 *
 * ▼ この関数がやること（安全な内容だけ）
 *   - 申し込みタブに紛れこんだ「コードの貼り付けセル」を消す
 *   - 各タブの見出し行を見やすくする（色つき・固定・フィルター）
 *   - 顧客管理／案件管理／売上管理／ダッシュボードの列見出しを用意する
 *   - 対応状況などの「えらぶだけの入力」を使えるようにする
 *
 * ▼ 安全のための約束
 *   - すでに入っているデータ（申し込み内容など）は消しません
 *   - 見出しは「その行が空っぽのときだけ」書き込みます（上書き防止）
 *   - 何度実行しても結果は同じになるよう作っています
 */

// あなたのスプレッドシートID（URLの /d/ と /edit のあいだ）
var FOUR_U_SPREADSHEET_ID = '1mReyPioPelhnAhCkvPv5jcupjKhavLv_AHpiRN9-piM';

// 申し込みタブの名前候補（環境によって名前が違っても拾えるように）
var APPLY_SHEET_CANDIDATES = ['申し込み', '無料デモ申込', '申込'];

// 見出しの色
var HEADER_BG = '#27503a';
var HEADER_FG = '#ffffff';

/** ★ここを実行してください★ */
function enhance4UManagementSheetsFinal() {
  var ss = SpreadsheetApp.openById(FOUR_U_SPREADSHEET_ID);

  var apply = findSheetByNames_(ss, APPLY_SHEET_CANDIDATES);
  if (apply) {
    cleanupPastedCode_(apply);              // 紛れこんだコードを掃除
    setupApplySheet_(apply);                // 見出し＋管理列＋フィルター
  }

  setupSheetWithHeaders_(ss, '顧客管理', [
    '顧客ID', 'お名前', '店名・事業名', '業種・サービス', 'エリア',
    'メールアドレス', '電話番号', '初回問い合わせ日', 'ステータス', 'メモ'
  ]);

  setupSheetWithHeaders_(ss, '案件管理', [
    '案件ID', '顧客・店名', 'プラン', '金額', 'ステータス',
    '着手日', '納品予定日', '納品日', '担当', 'メモ'
  ]);

  setupSheetWithHeaders_(ss, '売上管理', [
    '計上日', '案件ID', '顧客・店名', 'プラン', '金額（税込）',
    '入金状況', '入金日', 'メモ'
  ]);

  // えらぶだけの入力（プルダウン）を設定
  addDropdown_(ss, '案件管理', 5, ['未着手', '進行中', '確認中', '完了', '保留']); // ステータス
  addDropdown_(ss, '顧客管理', 9, ['見込み', '商談中', '取引中', '完了', '見送り']); // ステータス
  addDropdown_(ss, '売上管理', 6, ['未入金', '請求済', '入金済']);                 // 入金状況

  buildDashboard_(ss, apply ? apply.getName() : '申し込み');

  removeDefaultSheet_(ss); // 空の「シート1」があれば削除
}

/* ============ ここから下は補助の関数です（さわらなくてOK） ============ */

function findSheetByNames_(ss, names) {
  for (var i = 0; i < names.length; i++) {
    var sh = ss.getSheetByName(names[i]);
    if (sh) return sh;
  }
  return null;
}

/** 申し込みタブに紛れこんだ「コード文字列のセル」を空にする（データ行は消さない） */
function cleanupPastedCode_(sheet) {
  var last = sheet.getLastRow();
  var cols = Math.max(sheet.getLastColumn(), 1);
  if (last < 1) return;
  var range = sheet.getRange(1, 1, last, cols);
  var values = range.getValues();
  var markers = ['function ', 'add4UOperationGuideSheets', 'SpreadsheetApp', 'getRange(', 'insertSheet'];
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      var v = values[r][c];
      if (typeof v === 'string') {
        for (var m = 0; m < markers.length; m++) {
          if (v.indexOf(markers[m]) !== -1) {
            sheet.getRange(r + 1, c + 1).clearContent();
            break;
          }
        }
      }
    }
  }
}

/** 申し込みタブ：見出しを見やすく＋管理列を追加＋フィルター */
function setupApplySheet_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);

  // 管理列（対応状況・担当・社内メモ）が無ければ末尾に追加
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var manageCols = ['対応状況', '担当', '社内メモ'];
  manageCols.forEach(function (name) {
    if (headerRow.indexOf(name) === -1) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue(name);
    }
  });

  // 見出しの見た目
  styleHeader_(sheet, lastCol);
  sheet.setFrozenRows(1);

  // 対応状況のプルダウン
  var statusColIndex = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf('対応状況') + 1;
  if (statusColIndex > 0) {
    setDropdownOnColumn_(sheet, statusColIndex, ['未対応', '対応中', '完了', '見送り']);
  }

  applyFilter_(sheet, lastCol);
}

/** 管理タブ：空のときだけ見出しを書き、いつでも見た目を整える */
function setupSheetWithHeaders_(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var isEmpty = firstRow.join('') === '';
  if (isEmpty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  styleHeader_(sheet, Math.max(sheet.getLastColumn(), headers.length));
  sheet.setFrozenRows(1);
  applyFilter_(sheet, Math.max(sheet.getLastColumn(), headers.length));
  sheet.autoResizeColumns(1, headers.length);
}

function styleHeader_(sheet, cols) {
  sheet.setRowHeight(1, 32);
  sheet.getRange(1, 1, 1, cols)
    .setFontWeight('bold')
    .setFontColor(HEADER_FG)
    .setBackground(HEADER_BG)
    .setVerticalAlignment('middle');
}

function applyFilter_(sheet, cols) {
  var existing = sheet.getFilter();
  if (existing) existing.remove();
  var last = Math.max(sheet.getLastRow(), 1);
  sheet.getRange(1, 1, last, cols).createFilter();
}

function addDropdown_(ss, sheetName, colIndex, options) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  setDropdownOnColumn_(sheet, colIndex, options);
}

function setDropdownOnColumn_(sheet, colIndex, options) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(options, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, colIndex, 1000, 1).setDataValidation(rule);
}

/** ダッシュボード：主要な数字を自動計算で表示 */
function buildDashboard_(ss, applyName) {
  var sheet = ss.getSheetByName('ダッシュボード');
  if (!sheet) sheet = ss.insertSheet('ダッシュボード');

  var a = "'" + applyName + "'";
  var rows = [
    ['項目', '数値'],
    ['申し込み 合計', '=COUNTA(' + a + '!A2:A)'],
    ['└ Aプラン', '=COUNTIF(' + a + '!B2:B,"A*")'],
    ['└ Bプラン', '=COUNTIF(' + a + '!B2:B,"B*")'],
    ['└ Cプラン', '=COUNTIF(' + a + '!B2:B,"C*")'],
    ['└ 相談して決めたい', '=COUNTIF(' + a + '!B2:B,"相談*")'],
    ['案件 進行中', "=COUNTIF('案件管理'!E2:E,\"進行中\")"],
    ['案件 完了', "=COUNTIF('案件管理'!E2:E,\"完了\")"],
    ['売上 合計（税込）', "=SUM('売上管理'!E2:E)"],
    ['入金済 合計', "=SUMIF('売上管理'!F2:F,\"入金済\",'売上管理'!E2:E)"]
  ];

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  styleHeader_(sheet, 2);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 140);
  sheet.getRange(9, 2, 2, 1).setNumberFormat('¥#,##0'); // 売上・入金済を円表示
}

function removeDefaultSheet_(ss) {
  var def = ss.getSheetByName('シート1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(def);
  }
}
