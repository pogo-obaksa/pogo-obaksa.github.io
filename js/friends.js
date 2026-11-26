/* =========================================================
   오박사의 포켓몬 백과사전 — 실시간 트레이너 코드 친구추가 게시판
   Firebase 무료(Spark) Firestore 'trainers' 컬렉션
   - 읽기: 누구나 / 쓰기: create 만 (update·delete 는 서버 규칙에서 차단)
   - 60초 쿨다운은 이 브라우저의 localStorage 에만 남는다
   ========================================================= */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCn_GSuMkz3_GJH4V0x1IRpCkP04DJoQnY',
  authDomain: 'pogo-obaksa-friends.firebaseapp.com',
  projectId: 'pogo-obaksa-friends',
  storageBucket: 'pogo-obaksa-friends.firebasestorage.app',
  messagingSenderId: '14242413444',
  appId: '1:14242413444:web:b898205a35e162d153fbd1'
};

const COLLECTION = 'trainers';
const COOLDOWN_MS = 60 * 1000;
const TTL = { raid: 60 * 60 * 1000, gift: 24 * 60 * 60 * 1000, battle: 24 * 60 * 60 * 1000 };
const LS_LAST = 'pgoFriends.lastPost.v1';
const MAX_DOCS = 200;

const PURPOSE_LABEL = {
  raid: { text: '🔥 레이드 초대', cls: 'is-raid', filter: '지금 레이드 초대' },
  gift: { text: '🎁 선물 교환', cls: 'is-gift', filter: '매일 선물 교환' },
  battle: { text: '⚔️ 배틀·교환', cls: 'is-battle', filter: '배틀·교환' }
};
const TEAM_LABEL = {
  mystic: { text: '💙 미스틱', cls: 'team-mystic' },
  valor: { text: '❤️ 발로', cls: 'team-valor' },
  instinct: { text: '💛 인스팅트', cls: 'team-instinct' },
  none: { text: '팀 없음', cls: 'team-none' }
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));

const state = {
  purpose: 'raid',
  team: 'none',
  filter: 'all',
  docs: [],
  coolingUntil: 0,
  busy: false
};

/* ───────────── 유틸 ───────────── */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function digitsOnly(v) { return String(v || '').replace(/[^0-9]/g, ''); }

function formatCode(digits) {
  const d = digitsOnly(digits).slice(0, 12);
  return d.replace(/(.{4})(?=.)/g, '$1 ');
}

function remainText(ms) {
  if (ms <= 0) return '만료';
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin < 1) return '1분 안 남음';
  if (totalMin < 60) return totalMin + '분 남음';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? h + '시간 ' + m + '분 남음' : h + '시간 남음';
}

function readLastPost() {
  try {
    const v = Number(window.localStorage.getItem(LS_LAST) || 0);
    return isFinite(v) ? v : 0;
  } catch (e) { return 0; }
}

function writeLastPost(ts) {
  try { window.localStorage.setItem(LS_LAST, String(ts)); } catch (e) { /* 저장 막힌 브라우저 */ }
}

/* ───────────── 폼 ───────────── */
function setStatus(text, kind) {
  const el = $('#fr-status');
  if (!el) return;
  el.textContent = text || '';
  el.className = 'fr-status' + (kind ? ' is-' + kind : '');
}

function updateExpiryText() {
  const el = $('#fr-expiry');
  if (!el) return;
  el.innerHTML = state.purpose === 'raid'
    ? '레이드 초대는 <strong>1시간</strong> 동안 목록에 보여요.'
    : (state.purpose === 'gift'
      ? '선물 교환 글은 <strong>24시간</strong> 동안 목록에 보여요.'
      : '배틀·교환 글은 <strong>24시간</strong> 동안 목록에 보여요.');
}

function initSeg(containerId, dataKey) {
  const box = $('#' + containerId);
  if (!box) return;
  box.addEventListener('click', (e) => {
    const btn = e.target.closest('button[' + dataKey + ']');
    if (!btn) return;
    $$('#' + containerId + ' button').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const val = btn.getAttribute(dataKey);
    if (containerId === 'fr-team') state.team = val;
    else { state.purpose = val; updateExpiryText(); }
  });
}

function refreshCooldown() {
  const btn = $('#fr-submit');
  if (!btn) return;
  const left = state.coolingUntil - Date.now();
  if (left > 0 && !state.busy) {
    btn.disabled = true;
    btn.textContent = '잠시만요 · ' + Math.ceil(left / 1000) + '초';
  } else if (!state.busy) {
    btn.disabled = false;
    btn.textContent = '게시하기';
  }
}

async function submit(ev) {
  ev.preventDefault();
  if (state.busy) return;

  const code = digitsOnly($('#fr-code').value);
  const nickname = String($('#fr-nick').value || '').trim();
  const memo = String($('#fr-memo').value || '').trim();

  if (code.length !== 12) {
    setStatus('트레이너 코드는 숫자 12자리예요. 게임 프로필에서 다시 확인해 주세요.', 'error');
    $('#fr-code').focus();
    return;
  }
  if (nickname.length < 1 || nickname.length > 20) {
    setStatus('닉네임은 1~20자로 적어 주세요.', 'error');
    $('#fr-nick').focus();
    return;
  }
  if (memo.length > 40) {
    setStatus('메모는 40자까지 쓸 수 있어요.', 'error');
    $('#fr-memo').focus();
    return;
  }
  if (state.coolingUntil > Date.now()) {
    setStatus('도배 방지를 위해 ' + Math.ceil((state.coolingUntil - Date.now()) / 1000) + '초 뒤에 다시 올릴 수 있어요.', 'warn');
    return;
  }

  state.busy = true;
  const btn = $('#fr-submit');
  btn.disabled = true;
  btn.textContent = '올리는 중…';
  setStatus('');

  const now = Date.now();
  try {
    await addDoc(collection(db, COLLECTION), {
      code,
      nickname,
      purpose: state.purpose,
      team: state.team,
      memo,
      createdAt: now,
      expiresAt: now + (TTL[state.purpose] || TTL.gift)
    });
    const until = Date.now() + COOLDOWN_MS;
    state.coolingUntil = until;
    writeLastPost(until);
    setStatus('올라갔어요. 목록에 바로 보이고, ' + (TTL[state.purpose] === TTL.raid ? '1시간' : '24시간') + ' 뒤에 자동으로 내려가요.', 'ok');
    $('#fr-memo').value = '';
    $('#fr-code').value = '';
    state.busy = false;
    refreshCooldown();
    if (window.gtag) window.gtag('event', 'friends_post', { purpose: state.purpose });
    const board = $('#fr-board-title');
    if (board && board.scrollIntoView) board.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    state.busy = false;
    btn.disabled = false;
    btn.textContent = '게시하기';
    const msg = String((err && err.code) || '');
    if (msg.indexOf('permission-denied') >= 0) {
      setStatus('서버가 이 내용을 받아들이지 않았어요. 코드 12자리·닉네임 길이·메모 40자를 확인해 주세요.', 'error');
    } else if (msg.indexOf('unavailable') >= 0 || msg.indexOf('network') >= 0) {
      setStatus('네트워크가 불안정해 등록하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'error');
    } else {
      setStatus('등록에 실패했어요. 잠시 뒤 다시 시도해 주세요.', 'error');
    }
    console.error('[friends] addDoc failed', err);
  }
}

/* ───────────── 목록 ───────────── */
function visibleDocs() {
  const now = Date.now();
  return state.docs
    .filter((d) => Number(d.expiresAt) > now)
    .filter((d) => state.filter === 'all' || d.purpose === state.filter)
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
}

function cardHTML(d) {
  const purpose = PURPOSE_LABEL[d.purpose] || PURPOSE_LABEL.gift;
  const team = TEAM_LABEL[d.team] || TEAM_LABEL.none;
  const left = Number(d.expiresAt) - Date.now();
  const codeText = formatCode(d.code);
  return '<article class="fr-card' + (d.purpose === 'raid' ? ' is-raid' : '') + '" data-id="' + esc(d.id) + '">' +
    '<div class="fr-card-top">' +
      '<span class="fr-badge ' + purpose.cls + '">' + purpose.text + '</span>' +
      '<span class="fr-badge ' + team.cls + '">' + team.text + '</span>' +
      '<span class="fr-remain' + (left < 10 * 60000 ? ' is-urgent' : '') + '">' + remainText(left) + '</span>' +
    '</div>' +
    '<div class="fr-name">' + esc(d.nickname) + '</div>' +
    '<div class="fr-code-row">' +
      '<span class="fr-code" data-code="' + esc(d.code) + '">' + esc(codeText) + '</span>' +
      '<button class="fr-copy" type="button" data-copy="' + esc(d.code) + '">복사</button>' +
    '</div>' +
    (d.memo ? '<p class="fr-memo">' + esc(d.memo) + '</p>' : '') +
    '<button class="fr-qr-btn" type="button" data-qr="' + esc(d.code) + '">QR 보기</button>' +
    '<canvas class="fr-qr" width="200" height="200" aria-label="트레이너 코드 QR"></canvas>' +
  '</article>';
}

function render() {
  const list = $('#fr-list');
  if (!list) return;
  const rows = visibleDocs();
  $('#fr-count').textContent = String(rows.length);

  if (!rows.length) {
    list.innerHTML = '<p class="fr-empty">' +
      (state.filter === 'all'
        ? '아직 올라온 코드가 없어요. 첫 번째로 남겨 보세요.'
        : '이 목적의 코드는 아직 없어요. 다른 필터를 눌러 보거나 직접 올려 보세요.') +
      '</p>';
    return;
  }
  list.innerHTML = rows.map(cardHTML).join('');
}

function tick() {
  refreshCooldown();
  const list = $('#fr-list');
  if (!list) return;
  const rows = visibleDocs();
  const cards = Array.prototype.slice.call(list.querySelectorAll('.fr-card'));
  const sameCards = cards.length === rows.length && rows.every((d, i) => cards[i].getAttribute('data-id') === String(d.id));
  /* 카드 구성이 그대로면 남은 시간만 바꾼다 (QR·복사 상태를 유지) */
  if (sameCards) {
    rows.forEach((d, i) => {
      const el = cards[i].querySelector('.fr-remain');
      if (!el) return;
      const left = Number(d.expiresAt) - Date.now();
      el.textContent = remainText(left);
      el.classList.toggle('is-urgent', left < 10 * 60000);
    });
    return;
  }
  render();
}

/* ───────────── 복사·QR ───────────── */
function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

async function copyCode(btn) {
  const code = btn.getAttribute('data-copy') || '';
  let ok = false;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(code); ok = true; } catch (e) { ok = false; }
  }
  if (!ok) ok = legacyCopy(code);
  if (ok) {
    btn.textContent = '복사됨';
    btn.classList.add('is-done');
    setTimeout(() => { btn.textContent = '복사'; btn.classList.remove('is-done'); }, 1600);
    if (window.gtag) window.gtag('event', 'friends_copy', { purpose: state.purpose });
  } else {
    btn.textContent = '길게 눌러 복사';
  }
}

function toggleQR(btn) {
  const card = btn.closest('.fr-card');
  if (!card) return;
  const canvas = card.querySelector('.fr-qr');
  if (!canvas) return;
  const open = canvas.classList.toggle('is-open');
  btn.textContent = open ? 'QR 닫기' : 'QR 보기';
  if (!open || canvas.getAttribute('data-drawn') === '1') return;
  const code = btn.getAttribute('data-qr') || '';
  try {
    if (window.PGOQR) {
      window.PGOQR.draw(canvas, code, { size: 176, scale: 5, quiet: 4 });
      canvas.setAttribute('data-drawn', '1');
    }
  } catch (e) {
    console.error('[friends] qr failed', e);
    btn.textContent = 'QR를 만들지 못했어요';
  }
}

/* ───────────── 시작 ───────────── */
initSeg('fr-team', 'data-team');
initSeg('fr-purpose', 'data-purpose');

const codeInput = $('#fr-code');
if (codeInput) {
  codeInput.addEventListener('input', () => {
    codeInput.value = formatCode(codeInput.value);
  });
}

$('#fr-form').addEventListener('submit', submit);

$('#fr-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  $$('#fr-filters .chip').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  state.filter = btn.getAttribute('data-filter');
  render();
});

$('#fr-list').addEventListener('click', (e) => {
  const copy = e.target.closest('[data-copy]');
  if (copy) { copyCode(copy); return; }
  const qr = e.target.closest('[data-qr]');
  if (qr) { toggleQR(qr); return; }
  const codeEl = e.target.closest('.fr-code');
  if (codeEl) {
    const c = codeEl.getAttribute('data-code') || '';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).catch(() => {});
  }
});

state.coolingUntil = Math.max(readLastPost(), 0);
refreshCooldown();
updateExpiryText();

let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error('[friends] firebase init failed', e);
}

if (db) {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(MAX_DOCS));
  onSnapshot(q, (snap) => {
    state.docs = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    $('#fr-state').textContent = '실시간 연결 · ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    render();
  }, (err) => {
    console.error('[friends] snapshot failed', err);
    $('#fr-state').textContent = '목록을 불러오지 못했어요';
    const list = $('#fr-list');
    if (list && !state.docs.length) {
      list.innerHTML = '<p class="fr-empty">게시판을 불러오지 못했어요. 새로고침하거나 잠시 뒤 다시 열어 주세요.</p>';
    }
  });
} else {
  $('#fr-state').textContent = '연결 실패';
  $('#fr-list').innerHTML = '<p class="fr-empty">게시판 연결에 실패했어요. 새로고침해 주세요.</p>';
}

setInterval(tick, 15000);
setInterval(function () { if (Date.now() < state.coolingUntil) refreshCooldown(); }, 1000);
render();
window.__frReady = true;
window.__frBuild = 'fc3';
window.__friends = { state, render, visibleDocs, formatCode, remainText };
