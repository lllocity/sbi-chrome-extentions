// SBI証券 ウェブ拡張ツール

function setReactInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  input.focus();
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.blur();
}

// ---- 実現損益詳細 — 日付ショートカット ----

function getDateRanges() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  const pad = n => String(n).padStart(2, '0');
  const today = `${year}/${pad(month)}/${pad(now.getDate())}`;

  const lastYearStart = `${year - 1}/01/01`;
  const lastYearEnd = `${year - 1}/12/31`;

  const fiscalBase = month >= 4 ? year : year - 1;
  const lastFiscalYearStart = `${fiscalBase - 1}/04/01`;
  const lastFiscalYearEnd = `${fiscalBase}/03/31`;
  const thisFiscalYearStart = `${fiscalBase}/04/01`;
  const thisFiscalYearEnd = today;

  return {
    lastYearStart, lastYearEnd,
    lastFiscalYearStart, lastFiscalYearEnd,
    thisFiscalYearStart, thisFiscalYearEnd,
  };
}

function setDateRange(startDate, endDate) {
  const dateInputs = document.querySelectorAll(
    '.react-datepicker__input-container input[type="text"]'
  );
  if (dateInputs.length < 2) return;
  setReactInputValue(dateInputs[0], startDate);
  setReactInputValue(dateInputs[1], endDate);
}

const NATIVE_SHORTCUT_IDS = ['today', 'this_week', 'this_month', 'this_year'];

function uncheckAllShortcuts(buttonRow) {
  NATIVE_SHORTCUT_IDS.forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.checked = false;
  });
  buttonRow.querySelectorAll('[data-sbi-custom]').forEach(cb => { cb.checked = false; });
}

function createShortcutButton(label, onClick) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mr-x-1';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.dataset.sbiCustom = 'true';

  const labelEl = document.createElement('label');
  labelEl.className = 'input-button-primary rounded-sm css-1wifdzn';
  labelEl.style.cursor = 'pointer';

  const p = document.createElement('p');
  p.className = 'text py-x-1 px-0 font-xs rounded-sm';
  p.textContent = label;

  labelEl.appendChild(checkbox);
  labelEl.appendChild(p);

  labelEl.addEventListener('click', e => {
    e.preventDefault();
    const buttonRow = labelEl.closest('.flex.mb-x-1');
    uncheckAllShortcuts(buttonRow);
    checkbox.checked = true;
    onClick();
  });

  wrapper.appendChild(labelEl);
  return wrapper;
}

function initDateShortcuts() {
  const thisYearCheckbox = document.querySelector('#this_year');
  if (!thisYearCheckbox) return;

  const buttonRow = thisYearCheckbox.closest('.flex.mb-x-1');
  if (!buttonRow || buttonRow.dataset.sbiExtAdded) return;
  buttonRow.dataset.sbiExtAdded = 'true';

  const ranges = getDateRanges();
  const thisYearWrapper = thisYearCheckbox.closest('.mr-x-1');

  // 昨年, 昨年度 を今年の前に挿入
  buttonRow.insertBefore(
    createShortcutButton('昨年', () => setDateRange(ranges.lastYearStart, ranges.lastYearEnd)),
    thisYearWrapper
  );
  buttonRow.insertBefore(
    createShortcutButton('昨年度', () => setDateRange(ranges.lastFiscalYearStart, ranges.lastFiscalYearEnd)),
    thisYearWrapper
  );

  // 今年度 を今年の後に挿入
  thisYearWrapper.insertAdjacentElement(
    'afterend',
    createShortcutButton('今年度', () => setDateRange(ranges.thisFiscalYearStart, ranges.thisFiscalYearEnd))
  );

  // ネイティブボタンクリック時にカスタムボタンのチェックを解除
  NATIVE_SHORTCUT_IDS.forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.closest('label')?.addEventListener('click', () => {
      buttonRow.querySelectorAll('[data-sbi-custom]').forEach(c => { c.checked = false; });
    });
  });
}

// ---- エントリーポイント ----

function initFeatures() {
  initDateShortcuts();
}

// Reactがマウントした後にDOMが構築されるため、MutationObserverで待機する
const observer = new MutationObserver(() => {
  initFeatures();
});

observer.observe(document.body, { childList: true, subtree: true });

// 初回実行（既にDOMが揃っている場合のフォールバック）
initFeatures();
