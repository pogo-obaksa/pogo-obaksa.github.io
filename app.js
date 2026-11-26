/* =========================================================
   오박사의 포켓몬 백과사전 — app.js (포켓몬고 허브)
   의존: data/types.js (window.PGO), data/events.js (HUB_EVENTS), data/raids.js (HUB_BOSSES, HUB_COUNTERS)
   ========================================================= */
(function () {
  'use strict';

  var PGO = window.PGO;
  var EVENTS = window.HUB_EVENTS || [];
  var BOSSES = window.HUB_BOSSES || [];
  var COUNTERS = window.HUB_COUNTERS || {};
  var MAX_TIPS = window.HUB_MAX_TIPS || {};
  var DEX = window.HUB_POKEDEX || [];
  var DEX_MOVES = window.HUB_DEX_MOVES || [];
  var GUIDES = window.HUB_GUIDES || [];
  var RAID_TOP = window.HUB_RAID_TOP || {};
  var PVP_TIER = window.HUB_PVP_TIER || {};
  var CPM_TABLE = window.HUB_CPM || {};
  var SPRITE_MAP = window.HUB_SPRITE_MAP || {};

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var num = function (n) { return Number(n || 0).toLocaleString('ko-KR'); };
  var DAY = 86400000;

  /* ─────────────── 이미지 호스트 · 폴백 ───────────────
     국내 PC 네트워크에서 raw.githubusercontent.com 이 막히는 경우가 있어
     기본은 jsDelivr CDN(같은 PokeAPI/sprites 저장소)으로 받고,
     1차 실패 시 raw.githubusercontent.com 으로 한 번만 돌아간 뒤,
     그마저 실패하면 각 자리의 기존 폴백(이모지 · 👾 · 숨김)이 이어서 동작한다. */
  var CDN_HOST = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/';
  var RAW_HOST = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/';

  /* 인라인 onerror 에서 부르는 전역 폴백 — true 를 돌려주면 '아직 시도할 게 남아 있다'는 뜻 */
  function spriteFallback(img) {
    var cur = img.getAttribute('src') || '';
    var step = parseInt(img.getAttribute('data-fallback-tried') || '0', 10) || 0;
    var alt = img.getAttribute('data-alt-src') || '';
    if (step === 0 && cur.indexOf(CDN_HOST) === 0) {
      img.setAttribute('data-fallback-tried', '1');
      img.src = RAW_HOST + cur.slice(CDN_HOST.length);
      return true;
    }
    if (step <= 1 && alt && cur !== alt) {
      img.setAttribute('data-fallback-tried', '2');
      img.src = alt;
      return true;
    }
    if (step === 2 && cur.indexOf(CDN_HOST) === 0) {
      img.setAttribute('data-fallback-tried', '3');
      img.src = RAW_HOST + cur.slice(CDN_HOST.length);
      return true;
    }
    img.setAttribute('data-fallback-tried', '4');
    return false;
  }
  window.__spriteFallback = spriteFallback;

  /* ─────────────── 포켓몬 아이콘 (이름 → 도감번호) ───────────────
     배틀리그 티어·레이드 카운터 데이터에는 한글 이름만 있어서, data/sprites.js 의
     이름→도감번호 표를 먼저 찾고, 없으면 메가·그림자 접두어와 괄호 폼을 떼고 다시 찾는다. */
  var DEX_BY_NAME = null;

  function dexIdOfName(name) {
    if (!name) return 0;
    if (SPRITE_MAP[name]) return SPRITE_MAP[name];
    if (!DEX.length) return 0;
    if (!DEX_BY_NAME) {
      DEX_BY_NAME = {};
      DEX.forEach(function (p) { if (!DEX_BY_NAME[p.n]) DEX_BY_NAME[p.n] = p.id; });
    }
    var cands = [
      name,
      name.replace('그림자 ', ''),
      name.replace(/^메가/, ''),
      name.replace(/\s*[\(（][^\)）]*[\)）]\s*$/, ''),
      name.replace('그림자 ', '').replace(/^메가/, '').replace(/\s*[\(（][^\)）]*[\)）]\s*$/, '')
    ];
    for (var i = 0; i < cands.length; i++) if (DEX_BY_NAME[cands[i]]) return DEX_BY_NAME[cands[i]];
    return 0;
  }

  /* 도감 카드·보스 카드와 같은 CDN 스프라이트를 작은 아이콘으로 */
  function monSpriteHTML(name, cls, size) {
    var dex = typeof name === 'number' ? name : dexIdOfName(name);
    var px = size || 40;
    var klass = 'mon-sprite' + (cls ? ' ' + cls : '') + (dex ? '' : ' is-empty');
    if (!dex) return '<span class="' + klass + '" aria-hidden="true"></span>';
    return '<img class="' + klass + '" src="' + SPRITE(dex) + '" alt="" loading="lazy" decoding="async" ' +
      'width="' + px + '" height="' + px + '" ' +
      'onerror="__spriteFallback(this)||(this.style.visibility=\'hidden\')">';
  }

  /* ─────────────── 내 체크리스트 (브라우저에만 저장) ───────────────
     서버가 없는 정적 사이트라 이로치 보유·이벤트 완료 체크는 localStorage 에만 남긴다.
     시크릿 모드처럼 저장이 막힌 브라우저에서도 화면이 멈추지 않게 전부 감싸 둔다. */
  var LS_KEY_SHINY = 'pgoHub.myShiny.v1';
  var LS_KEY_EVENT = 'pgoHub.eventDone.v1';

  function lsGet(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function lsSet(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  var myShiny = {};
  (function () {
    var arr = lsGet(LS_KEY_SHINY, []);
    if (Object.prototype.toString.call(arr) === '[object Array]') {
      arr.forEach(function (id) { if (Number(id) > 0) myShiny[Number(id)] = 1; });
    }
  })();

  function shinyOwned(id) { return !!myShiny[id]; }

  function shinyCount() {
    var n = 0;
    for (var k in myShiny) if (myShiny.hasOwnProperty(k)) n++;
    return n;
  }

  function shinySave() {
    var ids = Object.keys(myShiny).map(Number).filter(function (n) { return n > 0; })
      .sort(function (a, b) { return a - b; });
    lsSet(LS_KEY_SHINY, ids);
    var el = $('#dex-own-count');
    if (el) el.textContent = ids.length;
  }

  function shinySet(id, on) {
    id = Number(id);
    if (!id) return;
    if (on) myShiny[id] = 1; else delete myShiny[id];
    shinySave();
  }

  var eventDone = {};
  (function () {
    var obj = lsGet(LS_KEY_EVENT, {});
    if (obj && typeof obj === 'object' && Object.prototype.toString.call(obj) !== '[object Array]') eventDone = obj;
  })();

  function eventDoneSave() { lsSet(LS_KEY_EVENT, eventDone); }
  function eventIsDone(id) { return !!eventDone[id]; }

  /* ─────────────── GA4 이벤트 ───────────────
     gtag.js가 없거나(오프라인·광고차단) 로드에 실패해도 절대 에러가 나지 않게 감싼다. */
  function track(name, params) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    } catch (e) { /* 통계는 실패해도 화면은 그대로 둔다 */ }
  }

  /* ─────────────── 시간 유틸 (전부 KST 고정) ─────────────── */
  var KST_OFFSET = 9 * 60 * 60 * 1000;

  function parse(iso) { return iso ? new Date(iso).getTime() : null; }

  /* KST 자정 기준 날짜 키 */
  function kstDateKey(ms) {
    var d = new Date(ms + KST_OFFSET);
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  }

  function kstHM(ms) {
    var d = new Date(ms + KST_OFFSET);
    return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
  }

  function kstMD(ms) {
    var d = new Date(ms + KST_OFFSET);
    return (d.getUTCMonth() + 1) + '/' + d.getUTCDate();
  }

  function kstClock(ms) {
    var d = new Date(ms + KST_OFFSET);
    return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
  }

  /* 남은 시간 → "3일 04:12:09" / "04:12:09" */
  function formatRemain(ms) {
    if (ms === null || ms === undefined || isNaN(ms)) return '--:--:--';
    if (ms <= 0) return '00:00:00';
    var total = Math.floor(ms / 1000);
    var d = Math.floor(total / 86400);
    var h = Math.floor((total % 86400) / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var clock = pad(h) + ':' + pad(m) + ':' + pad(s);
    return d > 0 ? d + '일 ' + clock : clock;
  }

  /* D-day 라벨 */
  function dday(startMs) {
    if (!startMs) return '';
    var today = kstDateKey(Date.now());
    var target = kstDateKey(startMs);
    var diff = Math.round(
      (Date.UTC(Math.floor(target / 10000), Math.floor(target % 10000 / 100) - 1, target % 100) -
       Date.UTC(Math.floor(today / 10000), Math.floor(today % 10000 / 100) - 1, today % 100)) / DAY
    );
    if (diff === 0) return 'D-DAY';
    return diff > 0 ? 'D-' + diff : 'D+' + Math.abs(diff);
  }

  /* 이벤트 상태 */
  function eventState(ev, now) {
    var s = parse(ev.start), e = parse(ev.end);
    if (e !== null && now >= e) return 'past';
    if (s !== null && now < s) return 'upcoming';
    return 'ongoing';
  }

  /* ─────────────── 상단 시계 ─────────────── */
  function tickClock() {
    var el = $('#kst-clock');
    if (el) el.textContent = kstClock(Date.now()) + ' KST';
  }

  /* ─────────────── 탭 ─────────────── */
  var TABS = ['events', 'raids', 'pokedex', 'tier', 'powerup', 'guide'];

  function switchTab(name, opts) {
    if (TABS.indexOf(name) < 0) name = 'events';
    TABS.forEach(function (t) {
      var btn = document.getElementById('tabbtn-' + t);
      var panel = document.getElementById('tab-' + t);
      var on = t === name;
      if (btn) {
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
      }
      if (panel) panel.hidden = !on;
    });
    if (name === 'guide') {
      if (opts && opts.guide) openGuide(opts.guide, { nav: 'none' });
      else showGuideIndex({ nav: 'none' });
    }
    if (!opts || !opts.silent) {
      var hash = '#' + name;
      if (name === 'guide' && guideState.slug) hash = '#guide/' + guideState.slug;
      if (history.replaceState) history.replaceState(null, '', hash);
      track('tab_switch', { tab_name: name });
    }
    if (name === 'events') renderEvents();
    if (name === 'pokedex') renderDex();
    if (name === 'powerup') updatePowerUp();
  }

  function initTabs() {
    var bar = $('.tabbar');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab');
      if (btn) switchTab(btn.getAttribute('data-tab'));
    });
    bar.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var idx = TABS.indexOf(document.querySelector('.tab.is-active').getAttribute('data-tab'));
      var next = TABS[(idx + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
      switchTab(next);
      document.getElementById('tabbtn-' + next).focus();
    });
  }

  /* ─────────────── 홈(상단 브랜드) 클릭 ───────────────
     어느 탭·글·상세창에 있든 첫 화면(일정 탭) 맨 위로 돌아간다. */
  function goHome() {
    var activeBtn = document.querySelector('.tab.is-active');
    var fromTab = activeBtn ? activeBtn.getAttribute('data-tab') : '';
    if (guideState.slug) fromTab = 'guide/' + guideState.slug;
    var dex = $('#dex-backdrop'), modal = $('#modal-backdrop');
    if (dex && !dex.hidden) closeDex();
    if (modal && !modal.hidden) closeModal();
    if (guideState.slug) showGuideIndex({ nav: 'none' });
    switchTab('events');
    track('home_click', { from_tab: fromTab || 'events' });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { window.scrollTo(0, 0); }
  }

  function initBrand() {
    var brand = $('#brand-home');
    if (!brand) return;
    brand.addEventListener('click', function (e) {
      /* 자바스크립트가 살아 있으면 해시를 직접 정리하고, 아니면 href="#events" 기본 동작에 맡긴다 */
      e.preventDefault();
      goHome();
    });
  }

  /* ─────────────── 일정 탭 ─────────────── */
  var eventFilter = 'all';
  var renderedEventIds = {};

  /* 포켓몬이 주인공인 일정은 공식 일러스트를 아이콘으로 쓰고, 실패하면 기존 이모지로 돌아간다.
     주인공 포켓몬이 없는 시즌·메인 이벤트·GO패스는 공식 배너 썸네일(ev.thumb)을 쓴다. */
  function eventIconHTML(ev) {
    var fallback = '<span class="event-emoji-fallback"' + ((ev.pokemonId || ev.thumb) ? ' style="display:none"' : '') + '>' +
      ev.emoji + '</span>';
    if (ev.thumb) return '<div class="event-emoji has-thumb" aria-hidden="true">' +
      '<img src="' + ev.thumb + '" alt="" loading="lazy" width="48" height="48" ' +
        'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">' +
      fallback + '</div>';
    if (!ev.pokemonId) return '<div class="event-emoji" aria-hidden="true">' + fallback + '</div>';
    return '<div class="event-emoji has-mon" aria-hidden="true">' +
      '<img src="' + dexArt(ev.pokemonId) + '" alt="" loading="lazy" ' +
        'onerror="__spriteFallback(this)||(this.style.display=\'none\',this.nextElementSibling.style.display=\'block\')">' +
      fallback + '</div>';
  }

  function cardHTML(ev, now) {
    var st = eventState(ev, now);
    var s = parse(ev.start), e = parse(ev.end);
    var timeText;
    if (st === 'upcoming') timeText = kstMD(s) + ' ' + kstHM(s) + ' 시작' + (e ? ' · ' + kstMD(e) + ' ' + kstHM(e) + ' 종료' : '');
    else if (st === 'ongoing') timeText = (s ? kstMD(s) + ' ' + kstHM(s) + ' ~ ' : '') + kstMD(e) + ' ' + kstHM(e) + ' 종료';
    else timeText = kstMD(e) + ' ' + kstHM(e) + ' 종료';

    var badgeClass = st === 'ongoing' ? ' is-live' : (ev.hot ? ' is-hot' : '');
    var cardClass = 'event-card' + (st === 'ongoing' ? ' is-live' : '') + (ev.hot ? ' is-hot' : '');
    var timerAttr = st === 'upcoming' ? 'data-count-start="' + ev.start + '"' : 'data-count-end="' + ev.end + '"';
    var ddayText = st === 'upcoming' && s ? dday(s) : (st === 'ongoing' ? '진행 중' : '종료');

    return '' +
      '<article class="' + cardClass + '" data-event-id="' + ev.id + '">' +
        eventIconHTML(ev) +
        '<div class="event-body">' +
          '<div class="event-top">' +
            '<span class="event-badge' + badgeClass + '">' + (ev.badge || '일정') + '</span>' +
            '<span class="event-badge' + (st === 'ongoing' ? ' is-live' : '') + '">' + ddayText + '</span>' +
          '</div>' +
          '<h4 class="event-title">' + ev.title + '</h4>' +
          '<p class="event-desc">' + ev.desc + '</p>' +
          '<div class="event-foot">' +
            '<span class="event-time">' + timeText + '</span>' +
            '<span class="event-timer' + (st === 'ongoing' ? ' is-live' : '') + '" ' + timerAttr + '>' +
              (st === 'past' ? '종료' : '--:--:--') +
            '</span>' +
          '</div>' +
          (st !== 'past'
            ? '<button class="event-done' + (eventIsDone(ev.id) ? ' is-done' : '') + '" type="button" data-event-done="' + ev.id +
              '" aria-pressed="' + (eventIsDone(ev.id) ? 'true' : 'false') + '">' +
              '<span class="ed-box" aria-hidden="true">' + (eventIsDone(ev.id) ? '✓' : '') + '</span> 완료 체크</button>'
            : '') +
          (ev.tip ? '<p class="event-tip">💡 ' + ev.tip + '</p>' : '') +
        '</div>' +
      '</article>';
  }

  function renderEvents() {
    var now = Date.now();
    var lists = { ongoing: [], upcoming: [], past: [] };

    EVENTS.forEach(function (ev) {
      var st = eventState(ev, now);
      if (eventFilter !== 'all' && ev.category !== eventFilter && !(eventFilter === 'raid' && ev.category === 'raid')) return;
      lists[st].push(ev);
    });

    lists.ongoing.sort(function (a, b) { return parse(a.end) - parse(b.end); });
    lists.upcoming.sort(function (a, b) { return parse(a.start) - parse(b.start); });
    lists.past.sort(function (a, b) { return parse(b.end) - parse(a.end); });

    $('#ongoing-list').innerHTML = lists.ongoing.length
      ? lists.ongoing.map(function (ev) { return cardHTML(ev, now); }).join('')
      : '<p class="fineprint">이 조건에 진행 중인 일정이 없어요.</p>';
    $('#upcoming-list').innerHTML = lists.upcoming.length
      ? lists.upcoming.map(function (ev) { return cardHTML(ev, now); }).join('')
      : '<p class="fineprint">이 조건에 예정된 일정이 없어요.</p>';

    $('#ongoing-count').textContent = lists.ongoing.length;
    $('#upcoming-count').textContent = lists.upcoming.length;

    var pastWrap = $('#past-wrap');
    if (lists.past.length) {
      pastWrap.hidden = false;
      $('#past-count').textContent = '(' + lists.past.length + ')';
      $('#past-list').innerHTML = lists.past.map(function (ev) { return cardHTML(ev, now); }).join('');
    } else {
      pastWrap.hidden = true;
    }

    var meta = window.HUB_META || {};
    $('#events-fineprint').textContent = '일정 최종 확인: ' + (meta.verifiedAt || '-') + ' · 출처: ' + (meta.verifiedFrom || '') +
      '. ' + (meta.disclaimer || '');

    updateHero(now);
    updateTimers(now);
    updateEventProgress(now);
  }

  /* ─────────────── 이벤트 완료 체크 (브라우저 저장) ─────────────── */
  function updateEventProgress(now) {
    var el = $('#event-progress');
    if (!el) return;
    now = now || Date.now();
    var ongoing = EVENTS.filter(function (ev) { return eventState(ev, now) === 'ongoing'; });
    if (!ongoing.length) { el.hidden = true; el.innerHTML = ''; return; }
    var done = ongoing.filter(function (ev) { return eventIsDone(ev.id); }).length;
    el.hidden = false;
    el.innerHTML = '<span class="ep-icon" aria-hidden="true">✅</span>' +
      '<span class="ep-text">진행 중 <b>' + ongoing.length + '</b>개 중 <b>' + done + '</b>개 완료</span>' +
      '<span class="ep-hint">이 브라우저에만 저장</span>' +
      (done ? '<button class="ep-reset" id="event-done-reset" type="button">기록 지우기</button>' : '');
  }

  function initEventChecks() {
    var root = $('#tab-events');
    if (!root) return;
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-event-done]');
      if (btn) {
        var id = btn.getAttribute('data-event-done');
        var on = !eventIsDone(id);
        if (on) eventDone[id] = Date.now(); else delete eventDone[id];
        eventDoneSave();
        btn.classList.toggle('is-done', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        var box = btn.querySelector('.ed-box');
        if (box) box.textContent = on ? '✓' : '';
        updateEventProgress();
        track('event_done', { event_id: id, done: on });
        return;
      }
      if (e.target.closest('#event-done-reset')) {
        var now = Date.now();
        var cleared = 0;
        EVENTS.forEach(function (ev) {
          if (eventState(ev, now) === 'ongoing' && eventDone[ev.id]) { delete eventDone[ev.id]; cleared++; }
        });
        eventDoneSave();
        renderEvents();
        toast(cleared ? '이번 주 완료 기록을 지웠어요' : '지울 기록이 없어요');
      }
    });
  }

  function updateHero(now) {
    var best = null;
    EVENTS.forEach(function (ev) {
      var s = parse(ev.start), e = parse(ev.end);
      var boundary, mode;
      if (s !== null && now < s) { boundary = s; mode = 'start'; }
      else if (e !== null && now < e) { boundary = e; mode = 'end'; }
      else return;
      var gap = boundary - now;
      // 20분 이내 임박 이벤트 우선, 그 외엔 가까운 순
      var score = gap - (ev.priority || 0) * 60000 * (gap < 3 * 3600000 ? 3 : 0);
      if (!best || score < best.score) best = { ev: ev, boundary: boundary, mode: mode, score: score };
    });

    if (!best) return;
    var ev = best.ev;
    var label = $('#hero-label'), title = $('#hero-title'), sub = $('#hero-sub'), bar = $('#hero-progress');
    var urgent = best.boundary - now < 3600000;

    label.textContent = best.mode === 'end' ? '⏳ 종료까지' : '🚀 시작까지';
    label.className = 'hero-label' + (best.mode === 'end' ? ' is-ongoing' : '') + (urgent ? ' is-soon' : '');
    title.textContent = ev.title;
    sub.textContent = (ev.badge ? ev.badge + ' · ' : '') +
      (parse(ev.start) ? kstMD(parse(ev.start)) + ' ' + kstHM(parse(ev.start)) + ' ~ ' : '~ ') +
      kstMD(parse(ev.end)) + ' ' + kstHM(parse(ev.end)) + ' (KST)';

    var timer = $('#hero-timer');
    timer.textContent = formatRemain(best.boundary - now);
    timer.classList.toggle('is-urgent', urgent);

    if (best.mode === 'end' && parse(ev.start)) {
      var total = parse(ev.end) - parse(ev.start);
      var done = now - parse(ev.start);
      bar.style.width = Math.max(0, Math.min(100, (done / total) * 100)).toFixed(1) + '%';
    } else {
      bar.style.width = '0%';
    }

    renderHeroNext(now, ev.id);
  }

  /* ─────────────── 다음 일정 ───────────────
     이미 진행 중인 이벤트는 여기 넣지 않는다 — 아래 '진행 중' 섹션에만 둔다. */
  var heroNextSig = '';
  function nextUpcoming(now, excludeId, limit) {
    var items = [];
    EVENTS.forEach(function (ev) {
      if (excludeId && ev.id === excludeId) return;
      var s = parse(ev.start);
      if (s === null || s <= now) return;
      items.push({ when: s, ev: ev, mode: 'start' });
    });
    items.sort(function (a, b) { return a.when - b.when || (b.ev.priority || 0) - (a.ev.priority || 0); });
    return items.slice(0, limit || 3);
  }

  function renderHeroNext(now, excludeId) {
    var el = $('#hero-next');
    if (!el) return;
    var items = nextUpcoming(now, excludeId, 3);
    var sig = items.map(function (it) { return it.ev.id + it.when; }).join('|');
    if (sig === heroNextSig) return;
    heroNextSig = sig;
    el.innerHTML = items.map(function (it) {
      return '<li><span class="hn-when">' + kstMD(it.when) + ' ' + kstHM(it.when) +
        '</span><span class="hn-title">' + it.ev.title + '</span></li>';
    }).join('');
  }

  function updateTimers(now) {
    now = now || Date.now();
    $$('[data-count-end]').forEach(function (el) {
      var end = parse(el.getAttribute('data-count-end'));
      var left = end - now;
      el.textContent = left > 0 ? formatRemain(left) : '종료';
    });
    $$('[data-count-start]').forEach(function (el) {
      var start = parse(el.getAttribute('data-count-start'));
      var left = start - now;
      el.textContent = left > 0 ? formatRemain(left) : '시작';
    });
    var heroTimer = $('#hero-timer');
    var heroEnd = $('#hero-timer');
    if (heroTimer) {
      // 히어로는 매초 갱신 (가장 임박한 경계 기준)
      var best = null;
      EVENTS.forEach(function (ev) {
        var s = parse(ev.start), e = parse(ev.end);
        var b = null;
        if (s !== null && now < s) b = s; else if (e !== null && now < e) b = e;
        if (b === null) return;
        var gap = b - now;
        var score = gap - (ev.priority || 0) * 60000 * (gap < 3 * 3600000 ? 3 : 0);
        if (!best || score < best.score) best = { boundary: b, score: score };
      });
      if (best) {
        heroEnd.textContent = formatRemain(best.boundary - now);
        heroEnd.classList.toggle('is-urgent', best.boundary - now < 3600000);
      }
    }
  }

  function initFilterChips() {
    var row = $('.chip-row');
    if (!row) return;
    row.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', row).forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      eventFilter = chip.getAttribute('data-filter');
      renderEvents();
    });
  }

  /* ─────────────── 카운터 탭 ─────────────── */
  var activeBossId = null;
  var SPRITE = function (dex) {
    return CDN_HOST + 'sprites/pokemon/' + dex + '.png';
  };

  function tierWeight(tier) { return tier === 'S' ? 1 : tier === 'A' ? 0.93 : 0.86; }

  function allCounters() {
    var seen = {}, out = [];
    Object.keys(COUNTERS).forEach(function (k) {
      COUNTERS[k].forEach(function (c) {
        if (seen[c.en]) return;
        seen[c.en] = 1;
        out.push(c);
      });
    });
    return out;
  }

  var COUNTER_POOL = allCounters();

  function computeCounters(boss, limit) {
    limit = limit || 6;
    var defs = boss.types;
    var scored = COUNTER_POOL.map(function (c) {
      var effC = PGO.multi(c.charged.type, defs);
      var effF = PGO.multi(c.fast.type, defs);
      var eff = Math.max(effC, effF);
      var score = (effC * 1.0 + effF * 0.3) * tierWeight(c.tier);
      return { c: c, eff: eff, effC: effC, score: score };
    });

    var byScore = function (a, b) { return b.score - a.score; };
    var picks = [];
    var used = {};

    /* 1) 약점 타입별로 최대 2마리씩 고르게 뽑기 (상위 타입부터) */
    var weakList = PGO.weaknesses(defs).map(function (w) {
      var best = 0;
      scored.forEach(function (x) { if (x.c.charged.type === w.type && x.score > best) best = x.score; });
      return { type: w.type, best: best };
    }).sort(function (a, b) { return b.best - a.best; });

    weakList.forEach(function (w) {
      if (picks.length >= limit) return;
      var list = scored.filter(function (x) { return x.c.charged.type === w.type && x.effC >= 1.5; }).sort(byScore);
      var n = 0;
      for (var i = 0; i < list.length && n < 2; i++) {
        if (used[list[i].c.en]) continue;
        used[list[i].c.en] = 1;
        picks.push(list[i]);
        n++;
      }
    });

    /* 2) 남는 자리는 배율 높은 순으로 채우기 */
    scored.filter(function (x) { return !used[x.c.en] && x.eff >= 1.5; }).sort(byScore).forEach(function (x) {
      if (picks.length >= limit || used[x.c.en]) return;
      used[x.c.en] = 1;
      picks.push(x);
    });

    /* 3) 약점 딜러가 모자라면 중립 최상위로 채우기 */
    if (picks.length < limit) {
      scored.filter(function (x) { return !used[x.c.en] && x.eff >= 0.99 && x.eff < 1.5; })
        .sort(function (a, b) { return (b.c.tier === 'S') - (a.c.tier === 'S') || b.score - a.score; })
        .forEach(function (x) {
          if (picks.length >= limit || used[x.c.en]) return;
          used[x.c.en] = 1;
          picks.push(x);
        });
    }

    return picks.slice(0, limit).sort(byScore);
  }

  /* ─────────────── 레이드 카운터 TOP 6 (data/raid-counters.js) ─────────────── */
  var TAG_CLASS = { '메가': 'is-mega', '그림자': 'is-shadow', '일반': 'is-normal' };

  function effText(v) {
    var s = Number(v || 0);
    return '×' + (Math.abs(s - Math.round(s)) < 0.001 ? String(Math.round(s)) : s.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  }

  function renderBossCounters(boss) {
    var el = $('#boss-counters');
    if (!el) return;
    var rows = RAID_TOP[boss.id];
    if (rows && rows.length) {
      el.innerHTML = rows.map(function (c, i) {
        var effClass = c.eff > 1.001 ? '' : ' is-normal';
        var elite = (c.fe || c.ce) ? ' <span class="ctag is-elite">ⓔ 엘리트</span>' : '';
        return '<div class="counter-card">' +
          '<span class="counter-rank">' + (i + 1) + '</span>' +
          monSpriteHTML(c.n, 'counter-sprite', 40) +
          '<div class="counter-info">' +
            '<p class="counter-name">' + c.n +
              ' <span class="ctag ' + (TAG_CLASS[c.tag] || '') + '">' + c.tag + '</span>' + elite + '</p>' +
            '<p class="counter-moves" title="' + c.f + ' / ' + c.c + ' (' + c.fEn + ' · ' + c.cEn + ')">' +
              '<span class="mv-tag">졸업</span> <em>' + c.f + '</em> / <em>' + c.c + '</em>' +
              ' <span class="counter-mvs-en">(' + c.fEn + ' · ' + c.cEn + ')</span></p>' +
          '</div>' +
          '<span class="counter-eff' + effClass + '">' + effText(c.eff) +
            '<span class="counter-dps">' + c.dps + ' DPS</span></span>' +
        '</div>';
      }).join('');
      return;
    }
    /* 데이터가 없는 새 보스는 기존 타입 기반 추천으로 대체 */
    var picks = computeCounters(boss, 6);
    el.innerHTML = picks.map(function (p, i) {
      var c = p.c;
      var effClass = p.eff > 1.001 ? '' : ' is-normal';
      return '<div class="counter-card">' +
        '<span class="counter-rank">' + (i + 1) + '</span>' +
        monSpriteHTML(c.kr, 'counter-sprite', 40) +
        '<div class="counter-info">' +
          '<p class="counter-name">' + c.kr + ' <span style="font-weight:600;color:var(--muted);font-size:11px">' + c.tier + '</span></p>' +
          '<p class="counter-moves"><em>' + c.fast.kr + '</em> / <em>' + c.charged.kr + '</em>' +
            ' <span style="opacity:.65">(' + c.fast.en + ' · ' + c.charged.en + ')</span></p>' +
        '</div>' +
        '<span class="counter-eff' + effClass + '">×' + p.eff.toFixed(2) + '</span>' +
      '</div>';
    }).join('');
  }

  function typeChipHTML(id) {
    return '<span class="type-chip" style="background:' + PGO.typeColor(id) + ';color:' + PGO.typeText(id) + '">' +
      PGO.typeKo(id) + '</span>';
  }

  function renderBossGrid() {
    var wrap = $('#boss-grid');
    if (!wrap) return;
    wrap.innerHTML = BOSSES.map(function (b) {
      return '<button class="boss-chip' + (b.status === 'ref' ? ' is-ref' : '') + '" type="button" data-boss="' + b.id + '">' +
        '<img src="' + SPRITE(b.dex) + '" alt="" loading="lazy" onerror="__spriteFallback(this)||(this.style.display=\'none\',this.nextElementSibling.style.display=\'grid\')">' +
        '<span class="bc-fallback" style="display:none">' + (b.types[0] === 'psychic' ? '🔮' : b.types[0] === 'ice' ? '❄️' : '⚔️') + '</span>' +
        '<span class="bc-text"><span class="bc-name">' + b.kr + '</span><span class="bc-tier">' + b.tier + '</span>' +
          (RAID_TOP[b.id] && RAID_TOP[b.id][0] ? '<span class="bc-top1">1위 ' + RAID_TOP[b.id][0].n + '</span>' : '') +
        '</span>' +
      '</button>';
    }).join('');
  }

  function selectBoss(id, opts) {
    var boss = BOSSES.filter(function (b) { return b.id === id; })[0];
    if (!boss) return;
    activeBossId = id;
    if (!opts || !opts.silent) track('boss_select', { boss_id: id, boss_name: boss.kr });

    $$('.boss-chip').forEach(function (chip) {
      chip.classList.toggle('is-active', chip.getAttribute('data-boss') === id);
    });

    $('#boss-name').textContent = boss.kr;
    $('#boss-meta').textContent = boss.en + ' · ' + boss.tier + ' · ' + boss.avail;
    $('#boss-thumb').innerHTML = '<img src="' + SPRITE(boss.dex) + '" alt="' + boss.kr + '" onerror="__spriteFallback(this)||(this.parentNode.textContent=\'👾\')">';
    $('#boss-types').innerHTML = boss.types.map(typeChipHTML).join('');
    $('#boss-note').textContent = boss.note || '';

    var weak = PGO.weaknesses(boss.types);
    $('#boss-weak').innerHTML = weak.length
      ? weak.map(function (w) {
          return '<span class="weak-chip' + (w.mult > 2.5 ? ' is-double' : '') + '">' +
            '<span class="type-chip" style="background:' + w.color + ';color:' + PGO.typeText(w.type) + '">' + w.ko + '</span>' +
            '<b>×' + w.mult.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '</b></span>';
        }).join('')
      : '<span class="fineprint">약점이 없습니다.</span>';

    var weakIds = weak.map(function (w) { return w.type; });
    var weathers = PGO.WEATHER.map(function (w) {
      var hit = w.types.filter(function (t) { return weakIds.indexOf(t) >= 0; });
      return hit.length ? { w: w, hit: hit } : null;
    }).filter(Boolean);
    $('#boss-weather').innerHTML = weathers.length
      ? weathers.map(function (x) {
          return '<span class="weather-chip">' + x.w.icon + ' ' + x.w.ko + ' <span style="opacity:.75">' +
            PGO.typeKoList(x.hit).join('·') + ' 딜 +20%</span></span>';
        }).join('')
      : '<span class="fineprint">약점 타입을 부스트하는 날씨가 없습니다.</span>';

    renderBossCounters(boss);
    renderRaidCount(boss);

    var tipEl = $('#max-tip');
    if (boss.max) {
      tipEl.hidden = false;
      var tips = boss.types.map(function (t) { return MAX_TIPS[t]; }).filter(Boolean);
      tipEl.innerHTML = '⚡ <strong>다이맥스(맥스배틀) 안내</strong> — ' +
        (tips.length ? tips.join(' ') : '맥스무브는 다이맥스 포켓몬의 타입을 따라가요. 같은 타입 다이맥스를 3마리 준비하세요.') +
        '<br>아래 카운터는 일반 레이드 기준이니, 맥스배틀에서는 참고만 하세요.';
    } else {
      tipEl.hidden = true;
      tipEl.innerHTML = '';
    }
  }

  function initBossGrid() {
    var wrap = $('#boss-grid');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var chip = e.target.closest('.boss-chip');
      if (!chip) return;
      selectBoss(chip.getAttribute('data-boss'));
    });
    renderBossGrid();

    // 첫 화면: 현재 진행 중인 보스 우선
    var first = BOSSES.filter(function (b) { return b.status === 'now'; })[0] || BOSSES[0];
    if (first) selectBoss(first.id, { silent: true });
  }

  /* ─────────────── 타입 상성 계산기 ─────────────── */
  function initTypeCalc() {
    var s1 = $('#def-type-1'), s2 = $('#def-type-2');
    if (!s1 || !s2) return;
    s1.innerHTML = PGO.TYPES.map(function (t) { return '<option value="' + t.id + '">' + t.ko + ' (' + t.en + ')</option>'; }).join('');
    s2.innerHTML = '<option value="">없음 (단일 타입)</option>' +
      PGO.TYPES.map(function (t) { return '<option value="' + t.id + '">' + t.ko + ' (' + t.en + ')</option>'; }).join('');
    s1.value = 'dragon';
    s2.value = 'flying';
    s1.addEventListener('change', renderTypeCalc);
    s2.addEventListener('change', renderTypeCalc);
    renderTypeCalc();
  }

  function renderTypeCalc() {
    var s1 = $('#def-type-1'), s2 = $('#def-type-2');
    var defs = [s1.value];
    if (s2.value && s2.value !== s1.value) defs.push(s2.value);

    var table = PGO.defenseTable(defs);
    var rows = table.map(function (r) {
      var cls = r.mult > 2.5 ? 'is-double' : r.mult > 1.001 ? 'is-super' : r.mult < 0.99 ? 'is-resist' : 'is-normal';
      return '<div class="result-row ' + cls + '">' +
        '<span class="type-chip" style="background:' + r.color + ';color:' + PGO.typeText(r.type) + '">' + r.ko + '</span>' +
        '<span class="rname">' + r.en + '</span>' +
        '<span class="rlabel">' + PGO.multLabel(r.mult) + '</span>' +
        '<span class="rmult">×' + r.mult.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '</span>' +
      '</div>';
    }).join('');

    var weak = table.filter(function (r) { return r.mult > 1.001; });
    var resist = table.filter(function (r) { return r.mult < 0.99; });
    var summary = '방어 타입 <strong>' + PGO.typeKoList(defs).join(' · ') + '</strong> — 약점 ' + weak.length + '개' +
      (weak.length ? ' (최고 ' + weak[0].ko + ' ×' + weak[0].mult.toFixed(2) + ')' : '') +
      ', 반감 ' + resist.length + '개.';

    $('#type-result').innerHTML = '<p class="result-summary">' + summary + '</p>' + rows;
  }

  /* ─────────────── 육성 계산기 ─────────────── */
  var BANDS = [
    { until: 3, dust: 200, candy: 1 },
    { until: 5, dust: 400, candy: 1 },
    { until: 7, dust: 600, candy: 1 },
    { until: 9, dust: 800, candy: 1 },
    { until: 11, dust: 1000, candy: 1 },
    { until: 13, dust: 1300, candy: 2 },
    { until: 15, dust: 1600, candy: 2 },
    { until: 17, dust: 1900, candy: 2 },
    { until: 19, dust: 2200, candy: 2 },
    { until: 21, dust: 2500, candy: 2 },
    { until: 23, dust: 3000, candy: 3 },
    { until: 25, dust: 3500, candy: 3 },
    { until: 26, dust: 4000, candy: 3 },
    { until: 27, dust: 4000, candy: 4 },
    { until: 29, dust: 4500, candy: 4 },
    { until: 31, dust: 5000, candy: 4 },
    { until: 33, dust: 6000, candy: 6 },
    { until: 35, dust: 7000, candy: 8 },
    { until: 37, dust: 8000, candy: 10 },
    { until: 39, dust: 9000, candy: 12 },
    { until: 40, dust: 10000, candy: 15 }
  ];

  /* 40 → 50 : 반 레벨 단위 모래 / XL사탕 */
  var XL_DUST = [10000, 10000, 11000, 11000, 11000, 11000, 12000, 12000, 12000, 12000,
                 13000, 13000, 13000, 13000, 14000, 14000, 14000, 14000, 15000, 15000];
  var XL_CANDY = [10, 10, 10, 10, 12, 12, 12, 12, 15, 15,
                  15, 15, 17, 17, 17, 17, 20, 20, 20, 20];

  var KIND_MULT = {
    normal: { dust: 1, candy: 1 },
    shadow: { dust: 1.2, candy: 1.2 },
    purified: { dust: 0.9, candy: 0.9 },
    lucky: { dust: 0.5, candy: 1 }
  };

  function costAt(level) {
    if (level >= 40) {
      var idx = Math.round((level - 40) * 2);
      if (idx >= XL_DUST.length) idx = XL_DUST.length - 1;
      return { dust: XL_DUST[idx], candy: 0, xl: XL_CANDY[idx] };
    }
    for (var i = 0; i < BANDS.length; i++) {
      if (level < BANDS[i].until) return { dust: BANDS[i].dust, candy: BANDS[i].candy, xl: 0 };
    }
    return { dust: 10000, candy: 15, xl: 0 };
  }

  /* from → to 비용 (강화 1회 = 0.5레벨) */
  function powerUpCost(from, to) {
    if (!(to > from)) return { raw: { dust: 0, candy: 0, xl: 0 }, dust: 0, candy: 0, xl: 0, steps: 0, rows: [] };
    var steps = Math.round((to - from) * 2);
    var raw = { dust: 0, candy: 0, xl: 0 };
    var rows = [];
    for (var i = 0; i < steps; i++) {
      var lv = from + i * 0.5;
      var c = costAt(lv);
      raw.dust += c.dust; raw.candy += c.candy; raw.xl += c.xl;
      var last = rows[rows.length - 1];
      if (last && last.dust === c.dust && last.candy === c.candy && last.xl === c.xl) {
        last.to = lv + 0.5;
        last.steps += 1;
      } else {
        rows.push({ from: lv, to: lv + 0.5, dust: c.dust, candy: c.candy, xl: c.xl, steps: 1 });
      }
    }
    return { raw: raw, steps: steps, rows: rows };
  }

  var kind = 'normal';

  function levelLabel(v) {
    var n = Number(v);
    return 'Lv.' + (Number.isInteger(n) ? n : n.toFixed(1));
  }

  function initPowerUp() {
    var fromSel = $('#from-level'), toSel = $('#to-level');
    if (!fromSel || !toSel) return;
    var opts = [];
    for (var l = 1; l <= 50; l += 0.5) {
      opts.push('<option value="' + l + '">' + levelLabel(l) + '</option>');
    }
    fromSel.innerHTML = opts.join('');
    toSel.innerHTML = opts.join('');
    fromSel.value = '20';
    toSel.value = '40';
    fromSel.addEventListener('change', updatePowerUp);
    toSel.addEventListener('change', updatePowerUp);

    var segs = $$('.seg');
    segs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        segs.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        kind = btn.getAttribute('data-kind');
        updatePowerUp();
      });
    });

    var presets = $('#preset-row');
    if (presets) {
      presets.addEventListener('click', function (e) {
        var b = e.target.closest('.preset');
        if (!b) return;
        fromSel.value = b.getAttribute('data-from');
        toSel.value = b.getAttribute('data-to');
        updatePowerUp();
      });
    }
    updatePowerUp();
  }

  function updatePowerUp() {
    var fromEl = $('#from-level'), toEl = $('#to-level');
    if (!fromEl || !toEl) return;
    var from = Number(fromEl.value), to = Number(toEl.value);
    var res = powerUpCost(Math.min(from, to), Math.max(from, to));
    var m = KIND_MULT[kind] || KIND_MULT.normal;
    var raw = res.raw;

    var dust = Math.round(raw.dust * m.dust);
    var candy = Math.round(raw.candy * m.candy);
    var xl = Math.round(raw.xl * m.candy);

    $('#cost-dust').textContent = num(dust);
    $('#cost-candy').textContent = num(candy);
    $('#cost-xl').textContent = num(xl);
    $('#cost-xl').classList.toggle('is-zero', xl === 0);

    var kindLabel = { normal: '일반', shadow: '그림자', purified: '정화', lucky: '럭키' }[kind];
    var line;
    if (from === to) {
      line = '현재 레벨과 목표 레벨이 같아요. 목표를 더 높게 잡아 주세요.';
    } else if (from > to) {
      line = '목표 레벨이 현재보다 낮아 계산할 수 없어요.';
    } else {
      line = '<b>' + levelLabel(from) + ' → ' + levelLabel(to) + '</b> · ' + kindLabel + ' · 강화 ' + res.steps + '회' +
        (raw.xl > 0 ? ' · 40레벨 이후 구간에 XL사탕이 포함됩니다' : '');
    }
    $('#powerup-summary').innerHTML = line;

    var rows = res.rows.map(function (r) {
      /* 같은 비용이 반복된 구간은 steps 만큼 곱해서 구간 합계를 보여준다 */
      return '<tr><td>' + levelLabel(r.from) + ' → ' + levelLabel(r.to) + '</td>' +
        '<td>' + num(Math.round(r.dust * r.steps * m.dust)) + '</td>' +
        '<td>' + num(Math.round(r.candy * r.steps * m.candy)) + '</td>' +
        '<td>' + num(Math.round(r.xl * r.steps * m.candy)) + '</td></tr>';
    }).join('');
    $('#powerup-breakdown').innerHTML =
      '<table><thead><tr><th>구간</th><th>모래</th><th>사탕</th><th>XL</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* ─────────────── 배틀리그 IV 순위 계산기 ───────────────
     CP 상한(1500·2500) 안에서 도달하는 최고 레벨의 스탯 프로덕트로 4,096조합 순위를 매긴다. */
  var CPM_LEVELS = Object.keys(CPM_TABLE).map(Number).sort(function (a, b) { return a - b; });
  var IV_CACHE = {};

  function cpAt(p, a, d, s, cpm) {
    return Math.max(10, Math.floor((p.a + a) * Math.sqrt(p.d + d) * Math.sqrt(p.s + s) * cpm * cpm / 10));
  }

  function bestLevel(p, a, d, s, cap) {
    if (!CPM_LEVELS.length) return 1;
    var last = CPM_LEVELS[CPM_LEVELS.length - 1];
    if (cpAt(p, a, d, s, CPM_TABLE[last]) <= cap) return last;
    var lo = 0, hi = CPM_LEVELS.length - 1, best = CPM_LEVELS[0];
    while (lo <= hi) {
      var mid = (lo + hi) >> 1, lv = CPM_LEVELS[mid];
      if (cpAt(p, a, d, s, CPM_TABLE[lv]) <= cap) { best = lv; lo = mid + 1; }
      else { hi = mid - 1; }
    }
    return best;
  }

  function ivTable(p, cap) {
    var key = p.id + ':' + cap;
    if (IV_CACHE[key]) return IV_CACHE[key];
    var rows = [];
    for (var a = 0; a <= 15; a++) {
      for (var d = 0; d <= 15; d++) {
        for (var s = 0; s <= 15; s++) {
          var lv = bestLevel(p, a, d, s, cap), cpm = CPM_TABLE[lv];
          rows.push({ a: a, d: d, s: s, lv: lv, cp: cpAt(p, a, d, s, cpm),
                      prod: (p.a + a) * cpm * (p.d + d) * cpm * Math.floor((p.s + s) * cpm) });
        }
      }
    }
    rows.sort(function (x, y) { return y.prod - x.prod || y.cp - x.cp; });
    for (var i = 0; i < rows.length; i++) rows[i].rank = i + 1;
    IV_CACHE[key] = rows;
    return rows;
  }

  var ivState = { mon: null, cap: 1500, a: 0, d: 15, s: 15, active: -1, list: [] };

  function ivLvText(lv) {
    return 'Lv.' + (Number.isInteger(lv) ? lv : lv.toFixed(1));
  }

  function ivSuggest(raw) {
    var sug = $('#iv-suggest');
    var q = String(raw || '').trim();
    if (!q) { sug.hidden = true; sug.innerHTML = ''; ivState.list = []; return; }
    dexPrep();
    ivState.list = dexSearch(q, 8);
    ivState.active = 0;
    if (!ivState.list.length) {
      sug.innerHTML = '<li class="iv-sug-empty">검색 결과가 없어요. 이름·초성·도감번호(25, 025, #25)로 다시 입력해 보세요.</li>';
      sug.hidden = false;
      return;
    }
    sug.innerHTML = ivState.list.map(function (p, i) {
      return '<li><button class="iv-sug' + (i === ivState.active ? ' is-active' : '') + '" type="button" data-iv-dex="' + p.id + '">' +
        monSpriteHTML(p.id, 'iv-sug-sprite', 32) +
        '<span class="iv-sug-no">' + dexNo(p.id) + '</span>' +
        '<span class="iv-sug-name">' + p.n + '</span>' +
        '<span class="iv-sug-types">' + p.t.map(function (t) { return PGO.typeKo(t); }).join('·') + '</span>' +
      '</button></li>';
    }).join('');
    sug.hidden = false;
  }

  function ivPick(id, opts) {
    var p = DEX.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    ivState.mon = p;
    ivState.active = -1;
    $('#iv-q').value = p.n;
    $('#iv-suggest').hidden = true;
    var picked = $('#iv-picked');
    picked.hidden = false;
    picked.innerHTML = '<img src="' + dexArt(p.id, false) + '" alt="" width="34" height="34" onerror="this.style.display=\'none\'">' +
      '<b>' + p.n + '</b> <span>' + p.t.map(function (t) { return PGO.typeKo(t); }).join('·') + ' · 최대 CP ' + num(maxCP(p, CPM50)) + '</span>';
    if (!opts || !opts.silent) track('iv_pick', { pokemon: p.n, dex_id: p.id });
    renderIV();
  }

  function renderIV() {
    var box = $('#iv-result');
    if (!box) return;
    var p = ivState.mon;
    var topWrap = $('#iv-top-wrap');
    if (!p) {
      box.innerHTML = '<p class="iv-empty">포켓몬을 먼저 선택하면 순위가 바로 나옵니다.</p>';
      if (topWrap) topWrap.hidden = true;
      return;
    }
    var rows = ivTable(p, ivState.cap);
    var total = rows.length;
    var me = null, best = rows[0];
    for (var i = 0; i < total; i++) {
      if (rows[i].a === ivState.a && rows[i].d === ivState.d && rows[i].s === ivState.s) { me = rows[i]; break; }
    }
    if (!me) return;
    var pct = me.rank / total * 100;
    var pctText = pct < 1 ? pct.toFixed(2) : pct < 10 ? pct.toFixed(1) : Math.round(pct).toString();
    var ratio = me.prod / best.prod * 100;
    var cpm = CPM_TABLE[me.lv];
    var maxLv = CPM_LEVELS[CPM_LEVELS.length - 1];
    var maxCp = cpAt(p, 15, 15, 15, CPM_TABLE[maxLv]);
    var shortNote = maxCp < ivState.cap
      ? '<p class="iv-short">50레벨 최대 CP가 ' + num(maxCp) + '이라 ' + num(ivState.cap) + ' 상한에 닿지 않아요. 이 경우 15/15/15가 가장 강합니다.</p>'
      : '';
    var atk = (p.a + me.a) * cpm, def = (p.d + me.d) * cpm, sta = Math.floor((p.s + me.s) * cpm);
    var grade = me.rank <= 10 ? 'S' : me.rank <= 100 ? 'A' : me.rank <= 500 ? 'B' : me.rank <= 1500 ? 'C' : 'D';

    box.innerHTML =
      '<div class="iv-head">' +
        '<div class="iv-badge is-' + grade.toLowerCase() + '"><span>#' + num(me.rank) + '</span><small>/ ' + num(total) + '</small></div>' +
        '<div class="iv-head-text">' +
          '<p class="iv-rankline">' + (ivState.cap === 1500 ? '슈퍼리그 1500' : '하이퍼리그 2500') +
            ' · <b>상위 ' + pctText + '%</b> <span class="iv-grade">' + grade + '급</span></p>' +
          '<p class="iv-ivline">' + me.a + ' / ' + me.d + ' / ' + me.s +
            ' <span>(공격·방어·체력)</span> · 1위 대비 스탯 ' + ratio.toFixed(1) + '%</p>' +
        '</div>' +
      '</div>' +
      '<div class="iv-metrics">' +
        '<div class="iv-metric"><span>도달 레벨</span><b>' + ivLvText(me.lv) + '</b></div>' +
        '<div class="iv-metric"><span>실제 CP</span><b>' + num(me.cp) + '</b></div>' +
        '<div class="iv-metric"><span>스탯 프로덕트</span><b>' + num(Math.round(me.prod)) + '</b></div>' +
      '</div>' +
      '<div class="iv-stats">' +
        statRow('공격', Math.round(atk * 10) / 10, '#F97362') +
        statRow('방어', Math.round(def * 10) / 10, '#38BDF8') +
        statRow('체력', sta, '#34D399') +
      '</div>' +
      '<div class="iv-best">' +
        '<span class="iv-best-label">이 리그 1위</span>' +
        '<b>' + best.a + '/' + best.d + '/' + best.s + '</b>' +
        '<span>' + ivLvText(best.lv) + ' · CP ' + num(best.cp) + ' · 스탯 ' + num(Math.round(best.prod)) + '</span>' +
        (me.rank === 1 ? '<span class="iv-crown">이미 1위 개체값이에요 🎉</span>' : '') +
      '</div>' + shortNote;

    if (topWrap) {
      topWrap.hidden = false;
      var top10 = rows.slice(0, 10);
      var trs = top10.map(function (r) {
        var isMe = r.a === me.a && r.d === me.d && r.s === me.s;
        return '<tr' + (isMe ? ' class="is-me"' : '') + '><td>' + r.rank + '</td><td>' + r.a + '/' + r.d + '/' + r.s + '</td>' +
          '<td>' + ivLvText(r.lv) + '</td><td>' + num(r.cp) + '</td><td>' + num(Math.round(r.prod)) + '</td></tr>';
      }).join('');
      $('#iv-top').innerHTML = '<table><thead><tr><th>순위</th><th>개체값</th><th>레벨</th><th>CP</th><th>스탯</th></tr></thead><tbody>' + trs + '</tbody></table>';
    }
  }

  function initIV() {
    var q = $('#iv-q');
    if (!q) return;
    var sug = $('#iv-suggest');

    q.addEventListener('input', function () {
      if (!q.value.trim()) ivState.mon = null;
      else if (ivState.mon && q.value.trim() !== ivState.mon.n) ivState.mon = null;
      ivSuggest(q.value);
      renderIV();
    });
    q.addEventListener('keydown', function (e) {
      if (sug.hidden || !ivState.list.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var n = ivState.list.length;
        ivState.active = (ivState.active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        $$('.iv-sug', sug).forEach(function (b, i) { b.classList.toggle('is-active', i === ivState.active); });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var pick = ivState.list[ivState.active >= 0 ? ivState.active : 0];
        if (pick) ivPick(pick.id);
      } else if (e.key === 'Escape') {
        sug.hidden = true;
      }
    });
    sug.addEventListener('click', function (e) {
      var b = e.target.closest('[data-iv-dex]');
      if (b) ivPick(Number(b.getAttribute('data-iv-dex')));
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.iv-search')) sug.hidden = true;
    });

    var league = $('#iv-league');
    if (league) league.addEventListener('click', function (e) {
      var b = e.target.closest('.seg');
      if (!b) return;
      $$('.seg', league).forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      ivState.cap = Number(b.getAttribute('data-cap'));
      track('iv_league', { cap: ivState.cap });
      renderIV();
    });

    [['iv-atk', 'a', 'iv-atk-val'], ['iv-def', 'd', 'iv-def-val'], ['iv-sta', 's', 'iv-sta-val']].forEach(function (cfg) {
      var el = $('#' + cfg[0]);
      if (!el) return;
      el.addEventListener('input', function () {
        ivState[cfg[1]] = Number(el.value);
        $('#' + cfg[2]).textContent = el.value;
        renderIV();
      });
    });
  }

  /* ─────────────── 배틀리그 티어 (data/pvp-tier.js) ─────────────── */
  var tierState = { lg: '1500' };

  function tierRowHTML(r) {
    var types = r.t.map(function (t) {
      return '<span class="type-chip" style="background:' + PGO.typeColor(t) + ';color:' + PGO.typeText(t) + '">' + PGO.typeKo(t) + '</span>';
    }).join('');
    var mv = r.mv || [];
    var charged = mv.slice(1).join(' / ');
    var warn = [];
    if (r.weak && r.weak.length) warn.push('약점 ' + r.weak.join('·'));
    if (r.cnt && r.cnt.length) warn.push('주의 카운터 ' + r.cnt.join(', '));
    return '<article class="tier-row">' +
      '<span class="tier-rank' + (r.r <= 3 ? ' is-top' : '') + '">' + r.r + '</span>' +
      monSpriteHTML(r.n, 'tier-sprite', 44) +
      '<div class="tier-body">' +
        '<p class="tier-name">' + r.n + ' <span class="role-chip">' + r.role + '</span></p>' +
        '<div class="tier-types">' + types + '</div>' +
        '<p class="tier-moves"><span class="tm-label">노말</span> ' + (mv[0] || '-') +
          '<span class="tm-sep">·</span><span class="tm-label">스페셜</span> ' + (charged || '-') + '</p>' +
        (warn.length ? '<p class="tier-warn">' + warn.join(' · ') + '</p>' : '') +
      '</div>' +
    '</article>';
  }

  function renderTier() {
    var list = $('#tier-list');
    if (!list) return;
    var rows = PVP_TIER[tierState.lg] || [];
    list.innerHTML = rows.length
      ? rows.map(tierRowHTML).join('')
      : '<p class="iv-empty">랭킹 데이터를 불러오지 못했어요.</p>';
  }

  function initTier() {
    var wrap = $('#tier-league');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.seg');
      if (!b) return;
      $$('.seg', wrap).forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      tierState.lg = b.getAttribute('data-lg');
      track('tier_league', { league: tierState.lg });
      renderTier();
      /* 파티 진단도 같은 리그를 보도록 맞춘다 */
      if (partyState.league !== tierState.lg) {
        partyState.league = tierState.lg;
        $$('#party-league .seg').forEach(function (x) {
          x.classList.toggle('is-active', x.getAttribute('data-party-lg') === tierState.lg);
        });
        renderPartyResult();
      }
    });
    renderTier();
  }

  /* ─────────────── 도감 탭 ─────────────── */
  var ART_BASE = CDN_HOST + 'sprites/pokemon/other/official-artwork/';

  function dexArt(id, shiny) { return ART_BASE + (shiny ? 'shiny/' : '') + id + '.png'; }
  function dexNo(id) { return '#' + (id < 1000 ? ('00' + id).slice(-3) : String(id)); }

  var CPM40 = 0.7903001, CPM50 = 0.84029999;

  /* 최대 CP (15/15/15) */
  function maxCP(p, cpm) {
    return Math.floor((p.a + 15) * Math.sqrt(p.d + 15) * Math.sqrt(p.s + 15) * cpm * cpm / 10);
  }

  /* 한글 초성 추출 — 초성 검색(ㄹㅈㅁ)용 */
  var CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  function chosung(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code >= 0xAC00 && code <= 0xD7A3) out += CHO[Math.floor((code - 0xAC00) / 588)];
      else out += str.charAt(i);
    }
    return out;
  }

  var dexState = { q: '', type: 'all', shinyOnly: false, ownOnly: false, shown: 0, list: [], ready: false };
  var DEX_CHUNK = 60;

  function dexPrep() {
    if (dexState.ready) return;
    DEX.forEach(function (p) {
      p._k = chosung(p.n);
      p._e = String(p.e || '').toLowerCase();
    });
    dexState.ready = true;
  }

  /* 검색어 → 매칭 점수 (낮을수록 위에 보여 준다)
     0 도감번호 정확 · 1 도감번호 앞자리 · 2 이름 정확 · 3 이름 앞부분 · 4 영문 정확
     5 영문 앞부분 · 6 이름 가운데 · 7 영문 가운데 · 8 초성 · -1 불일치
     도감번호는 25 · 025 · #25 · 0025 · No.25 처럼 써도 같은 번호로 본다. */
  function dexQueryScore(p, raw) {
    var q = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!q) return 0;
    var numq = q.replace(/^no\.?/, '').replace(/^#/, '');
    if (/^\d+$/.test(numq)) {
      var n = parseInt(numq, 10);
      if (p.id === n) return 0;
      var idStr = String(p.id);
      if (idStr.indexOf(numq) === 0 || idStr.indexOf(String(n)) === 0) return 1;
      return -1;
    }
    if (p.n === q) return 2;
    if (p.n.indexOf(q) === 0) return 3;
    if (p._e === q) return 4;
    if (p._e.indexOf(q) === 0) return 5;
    if (p.n.indexOf(q) > 0) return 6;
    if (p._e.indexOf(q) > 0) return 7;
    if (/^[ㄱ-ㅎ]+$/.test(q) && p._k.indexOf(q) === 0) return 8;
    return -1;
  }

  function dexMatch(p, raw) { return dexQueryScore(p, raw) >= 0; }

  /* 검색어로 바로 찾기 — 정확한 번호·이름이 항상 맨 앞에 온다 */
  function dexSearch(raw, limit) {
    var q = String(raw || '').trim();
    if (!q) return [];
    dexPrep();
    var hits = [];
    for (var i = 0; i < DEX.length; i++) {
      var s = dexQueryScore(DEX[i], q);
      if (s >= 0) hits.push({ p: DEX[i], s: s, i: i });
    }
    hits.sort(function (a, b) { return a.s - b.s || a.i - b.i; });
    return hits.slice(0, limit || 8).map(function (h) { return h.p; });
  }

  function dexFiltered() {
    var q = dexState.q;
    var rows = [];
    DEX.forEach(function (p, i) {
      if (dexState.type !== 'all' && p.t.indexOf(dexState.type) < 0) return;
      if (dexState.shinyOnly && !p.sh) return;
      if (dexState.ownOnly && !shinyOwned(p.id)) return;
      var s = dexQueryScore(p, q);
      if (s < 0) return;
      rows.push({ p: p, s: s, i: i });
    });
    if (String(q).trim()) rows.sort(function (a, b) { return a.s - b.s || a.i - b.i; });
    return rows.map(function (r) { return r.p; });
  }

  function dexTypeChip(t) {
    return '<span class="type-chip" style="background:' + PGO.typeColor(t) + ';color:' + PGO.typeText(t) + '">' +
      PGO.typeKo(t) + '</span>';
  }

  function dexCardHTML(p) {
    var shiny = dexState.shinyOnly;
    return '<button class="dex-card' + (shinyOwned(p.id) ? ' is-own' : '') + '" type="button" data-dex="' + p.id + '" aria-label="' + p.n + ' 도감 상세">' +
      '<span class="dex-no">' + dexNo(p.id) + '</span>' +
      (p.sh ? '<span class="dex-shiny" title="이로치 출시">✨</span>' : '') +
      (shinyOwned(p.id) ? '<span class="dex-own-mark" title="내가 가진 이로치">🏅</span>' : '') +
      '<span class="dex-thumb"><img src="' + dexArt(p.id, shiny) + '" alt="" loading="lazy" width="72" height="72" ' +
        (shiny ? 'data-alt-src="' + dexArt(p.id, false) + '" ' : '') +
        'onerror="__spriteFallback(this)||(this.style.visibility=\'hidden\')"></span>' +
      '<span class="dex-name">' + p.n + '</span>' +
      '<span class="dex-types">' + p.t.map(dexTypeChip).join('') + '</span>' +
      '<span class="dex-cp">최대 CP ' + num(maxCP(p, CPM50)) + '</span>' +
    '</button>';
  }

  function renderDex() {
    if (!DEX.length) return;
    dexPrep();
    dexState.list = dexFiltered();
    if (!dexState.shown) dexState.shown = DEX_CHUNK;
    var total = dexState.list.length;
    var slice = dexState.list.slice(0, dexState.shown);

    $('#dex-grid').innerHTML = slice.map(dexCardHTML).join('');
    $('#dex-empty').hidden = total > 0;
    $('#dex-empty').textContent = dexState.ownOnly && !total
      ? '아직 체크한 이로치가 없어요. 포켓몬 상세를 열어 🏅를 눌러 보세요.'
      : '조건에 맞는 포켓몬이 없어요. 이름·초성·도감번호로 다시 검색해 보세요.';
    $('#dex-own-count').textContent = shinyCount();
    $('#dex-own-only').setAttribute('aria-pressed', dexState.ownOnly ? 'true' : 'false');
    $('#dex-own-only').classList.toggle('is-active', dexState.ownOnly);
    $('#dex-count').innerHTML = total
      ? '<b>' + total.toLocaleString('ko-KR') + '</b>마리' +
        (total > slice.length ? ' · ' + slice.length + '마리 보기' : '')
      : '검색 결과 없음';
    $('#dex-more').hidden = total <= slice.length;
    $('#dex-clear').hidden = !dexState.q;
  }

  /* ── 도감 상세 시트 ── */
  var dexSheet = { list: [], idx: 0, shiny: false };

  function moveChips(ids, cls) {
    if (!ids || !ids.length) return '';
    return ids.map(function (i) {
      return '<span class="move-chip ' + cls + '">' + (DEX_MOVES[i] || '?') + '</span>';
    }).join('');
  }

  function eliteChips(ids, cls) {
    if (!ids || !ids.length) return '';
    return ids.map(function (i) {
      return '<span class="move-chip ' + cls + '"><span class="elite">ⓔ</span>' + (DEX_MOVES[i] || '?') + '</span>';
    }).join('');
  }

  function statRow(label, value, color) {
    var pct = Math.max(4, Math.min(100, value / 300 * 100));
    return '<div class="stat-row"><span class="s-label">' + label + '</span>' +
      '<span class="stat-bar"><span style="width:' + pct.toFixed(1) + '%;background:' + color + '"></span></span>' +
      '<span class="s-val">' + value + '</span></div>';
  }

  /* 배율 표기: 0.625 · 0.391 · 1.6 · 2.56 처럼 실제 배율값 그대로 */
  function multText(m) { return String(Math.round(m * 1000) / 1000); }

  function renderDexSheet() {
    var p = dexSheet.list[dexSheet.idx];
    if (!p) return;
    $('#dex-sheet-no').textContent = dexNo(p.id);
    $('#dex-sheet-name').textContent = p.n;
    $('#dex-sheet-en').textContent = p.e;

    var weak = PGO.weaknesses(p.t);
    var resist = PGO.defenseTable(p.t).filter(function (r) { return r.mult < 0.99; });

    var weakHTML = weak.length ? weak.map(function (w) {
      return '<span class="weak-chip' + (w.mult > 2.5 ? ' is-double' : '') + '">' +
        '<span class="type-chip" style="background:' + w.color + ';color:' + PGO.typeText(w.type) + '">' + w.ko + '</span>' +
        '<b>×' + multText(w.mult) + '</b></span>';
    }).join('') : '<p class="dex-none">약점이 없어요.</p>';

    var resistHTML = resist.length ? resist.map(function (w) {
      return '<span class="weak-chip">' +
        '<span class="type-chip" style="background:' + w.color + ';color:' + PGO.typeText(w.type) + '">' + w.ko + '</span>' +
        '<b>×' + multText(w.mult) + '</b></span>';
    }).join('') : '<p class="dex-none">반감 타입이 없어요.</p>';

    $('#dex-sheet-body').innerHTML =
      '<div class="dex-hero">' +
        '<div class="dex-art">' +
          '<div class="dex-art-box"><img id="dex-art-img" src="' + dexArt(p.id, dexSheet.shiny) + '" alt="' + p.n + '"></div>' +
          '<button class="dex-shiny-btn" id="dex-shiny-toggle" type="button" aria-pressed="' + (dexSheet.shiny ? 'true' : 'false') + '">' +
            (dexSheet.shiny ? '✨ 이로치 보는 중' : '✨ 이로치 보기') + '</button>' +
        '</div>' +
        '<div class="dex-facts">' +
          '<div class="type-row">' + p.t.map(dexTypeChip).join('') + '</div>' +
          '<div class="stat-bars">' +
            statRow('공격', p.a, '#EF4444') + statRow('방어', p.d, '#2563EB') + statRow('체력', p.s, '#10B981') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="dex-cp-row">' +
        '<div class="cp-card"><span class="cp-label">최대 CP · Lv.40</span><strong>' + num(maxCP(p, CPM40)) + '</strong></div>' +
        '<div class="cp-card is-max"><span class="cp-label">최대 CP · Lv.50 (XL사탕)</span><strong>' + num(maxCP(p, CPM50)) + '</strong></div>' +
      '</div>' +
      '<div class="dex-mine">' +
        '<button class="dex-own-btn' + (shinyOwned(p.id) ? ' is-on' : '') + '" id="dex-own-toggle" type="button" aria-pressed="' +
          (shinyOwned(p.id) ? 'true' : 'false') + '">' +
          (shinyOwned(p.id) ? '🏅 내 이로치로 체크됨' : '🏅 내 이로치로 체크') +
        '</button>' +
        '<span class="dex-mine-hint">도감 탭 «🏅 내 이로치»에서 모아볼 수 있어요 · 이 브라우저에만 저장</span>' +
      '</div>' +
      '<div class="dex-mini">' +
        '<div class="dex-mini-item"><span>파트너 사탕 거리</span><strong>' + (p.bd ? p.bd + ' km' : '-') + '</strong></div>' +
        '<div class="dex-mini-item"><span>진화 사탕</span><strong>' + (p.ev ? p.ev + '개' : '진화 없음') + '</strong></div>' +
        '<div class="dex-mini-item"><span>이로치</span><strong>' + (p.sh ? '출시 ✨' : '정보 없음') + '</strong></div>' +
      '</div>' +
      '<h4 class="dex-h">노말 기술</h4>' +
      '<div class="dex-moves">' + (moveChips(p.f, 'is-fast') || '<p class="dex-none">정보 없음</p>') +
        eliteChips(p.ef, 'is-fast') + '</div>' +
      '<h4 class="dex-h">스페셜 기술 <span class="dex-h-sub">ⓔ = 엘리트 기술</span></h4>' +
      '<div class="dex-moves">' + (moveChips(p.c, 'is-charged') || '<p class="dex-none">정보 없음</p>') +
        eliteChips(p.ec, 'is-charged') + '</div>' +
      '<h4 class="dex-h">약점 <span class="dex-h-sub">받는 데미지 배율</span></h4>' +
      '<div class="weak-row">' + weakHTML + '</div>' +
      '<h4 class="dex-h">반감 · 무효</h4>' +
      '<div class="weak-row">' + resistHTML + '</div>';

    var img = $('#dex-art-img');
    if (img) img.addEventListener('error', function () {
      if (spriteFallback(img)) return;
      if (dexSheet.shiny) {
        dexSheet.shiny = false;
        img.removeAttribute('data-alt-src');
        img.setAttribute('data-fallback-tried', '0');
        img.src = dexArt(p.id, false);
        var btn = $('#dex-shiny-toggle');
        if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.textContent = '이로치 이미지 없음'; }
      }
    });
  }

  function openDex(id) {
    dexPrep();
    var list = dexState.list.length ? dexState.list : DEX;
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { idx = i; break; } }
    if (idx < 0) {
      list = DEX;
      for (var j = 0; j < list.length; j++) { if (list[j].id === id) { idx = j; break; } }
    }
    if (idx < 0) return;
    dexSheet.list = list;
    dexSheet.idx = idx;
    dexSheet.shiny = false;
    track('pokedex_view', { pokemon_no: id, pokemon_name: list[idx].n });
    renderDexSheet();
    $('#dex-backdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    var body = $('#dex-sheet-body');
    $('#dex-close').focus();
  }

  function closeDex() {
    $('#dex-backdrop').hidden = true;
    document.body.style.overflow = '';
  }

  function stepDex(dir) {
    var n = dexSheet.list.length;
    if (!n) return;
    dexSheet.idx = (dexSheet.idx + dir + n) % n;
    dexSheet.shiny = false;
    renderDexSheet();
    $('#dex-sheet-body').scrollTop = 0;
  }

  function initDex() {
    if (!DEX.length) return;
    dexPrep();

    var row = $('#dex-type-row');
    if (row) {
      row.innerHTML = '<button class="chip dex-type-chip is-active" type="button" data-dex-type="all">전체 타입</button>' +
        PGO.TYPES.map(function (t) {
          return '<button class="chip dex-type-chip" type="button" data-dex-type="' + t.id + '">' + t.ko + '</button>';
        }).join('');
      row.addEventListener('click', function (e) {
        var chip = e.target.closest('.dex-type-chip');
        if (!chip) return;
        var type = chip.getAttribute('data-dex-type');
        $$('.dex-type-chip', row).forEach(function (c) {
          c.classList.remove('is-active');
          c.style.background = ''; c.style.color = ''; c.style.borderColor = '';
        });
        chip.classList.add('is-active');
        if (type !== 'all') {
          chip.style.background = PGO.typeColor(type);
          chip.style.borderColor = PGO.typeColor(type);
          chip.style.color = PGO.typeText(type);
        }
        dexState.type = type;
        dexState.shown = DEX_CHUNK;
        renderDex();
        track('dex_filter', { filter_type: 'type', filter_value: type, result_count: dexState.list.length });
      });
    }

    var q = $('#dex-q');
    var searchTimer = null;
    if (q) {
      q.addEventListener('input', function () {
        dexState.q = q.value;
        dexState.shown = DEX_CHUNK;
        renderDex();
        /* 타이핑 중에는 보내지 않고, 손을 뗀 뒤 0.9초에 한 번만 */
        clearTimeout(searchTimer);
        var term = q.value.trim();
        if (!term) return;
        searchTimer = setTimeout(function () {
          track('pokedex_search', { search_term: term, result_count: dexState.list.length });
        }, 900);
      });
    }

    var clear = $('#dex-clear');
    if (clear) clear.addEventListener('click', function () {
      if (q) { q.value = ''; q.focus(); }
      dexState.q = '';
      dexState.shown = DEX_CHUNK;
      renderDex();
    });

    var shinyBtn = $('#dex-shiny-only');
    if (shinyBtn) shinyBtn.addEventListener('click', function () {
      dexState.shinyOnly = !dexState.shinyOnly;
      shinyBtn.setAttribute('aria-pressed', dexState.shinyOnly ? 'true' : 'false');
      dexState.shown = DEX_CHUNK;
      renderDex();
      track('dex_filter', { filter_type: 'shiny', filter_value: dexState.shinyOnly ? 'only' : 'all' });
    });

    var ownBtn = $('#dex-own-only');
    if (ownBtn) ownBtn.addEventListener('click', function () {
      dexState.ownOnly = !dexState.ownOnly;
      dexState.shown = DEX_CHUNK;
      renderDex();
      track('dex_filter', { filter_type: 'my_shiny', filter_value: dexState.ownOnly ? 'only' : 'all' });
    });
    shinySave();

    var more = $('#dex-more');
    if (more) more.addEventListener('click', function () {
      dexState.shown += DEX_CHUNK * 2;
      renderDex();
    });

    var grid = $('#dex-grid');
    if (grid) grid.addEventListener('click', function (e) {
      var card = e.target.closest('.dex-card');
      if (card) openDex(Number(card.getAttribute('data-dex')));
    });

    $('#dex-close').addEventListener('click', closeDex);
    $('#dex-prev').addEventListener('click', function () { stepDex(-1); });
    $('#dex-next').addEventListener('click', function () { stepDex(1); });
    $('#dex-backdrop').addEventListener('click', function (e) {
      if (e.target === $('#dex-backdrop')) closeDex();
    });
    $('#dex-sheet-body').addEventListener('click', function (e) {
      var ownToggle = e.target.closest('#dex-own-toggle');
      if (ownToggle) {
        var pm = dexSheet.list[dexSheet.idx];
        if (!pm) return;
        var next = !shinyOwned(pm.id);
        shinySet(pm.id, next);
        ownToggle.classList.toggle('is-on', next);
        ownToggle.setAttribute('aria-pressed', next ? 'true' : 'false');
        ownToggle.textContent = next ? '🏅 내 이로치로 체크됨' : '🏅 내 이로치로 체크';
        renderDex();
        track('my_shiny_toggle', { pokemon_no: pm.id, pokemon_name: pm.n, owned: next });
        if (next) toast(pm.n + ' 이로치를 체크했어요');
        else toast(pm.n + ' 이로치 체크를 해제했어요');
        return;
      }
      if (e.target.closest('#dex-shiny-toggle')) {
        dexSheet.shiny = !dexSheet.shiny;
        var p = dexSheet.list[dexSheet.idx];
        var btn = $('#dex-shiny-toggle');
        var image = $('#dex-art-img');
        if (!p || !btn || !image) return;
        btn.setAttribute('aria-pressed', dexSheet.shiny ? 'true' : 'false');
        btn.textContent = dexSheet.shiny ? '✨ 이로치 보는 중' : '✨ 이로치 보기';
        image.removeAttribute('data-alt-src');
        image.setAttribute('data-fallback-tried', '0');
        image.src = dexArt(p.id, dexSheet.shiny);
      }
    });
    document.addEventListener('keydown', function (e) {
      if ($('#dex-backdrop').hidden) return;
      if (e.key === 'Escape') closeDex();
      else if (e.key === 'ArrowRight') stepDex(1);
      else if (e.key === 'ArrowLeft') stepDex(-1);
    });

    renderDex();
  }

  /* ─────────────── 가이드 탭 (멀티 글) ───────────────
     #guide            → 글 목록
     #guide/<slug>     → 개별 글 (뒤로가기·공유 가능)
     ?guide=<slug>     → 첫 진입 시 #guide/<slug> 로 바꿔 준다 */
  var guideState = { slug: null };
  var BASE_TITLE = document.title;

  function guideBySlug(slug) {
    for (var i = 0; i < GUIDES.length; i++) if (GUIDES[i].slug === slug) return GUIDES[i];
    return null;
  }

  function guidePad(n) { return (n < 10 ? '0' : '') + n; }

  function guideCardHTML(g) {
    /* 실제 정적 페이지(guide/<slug>.html)로 가는 링크 — 자바스크립트가 없어도 열린다.
       클릭하면 아래 위임 핸들러가 preventDefault 후 앱 안에서 바로 연다. */
    return '<a class="guide-card" href="guide/' + g.slug + '.html" data-guide-slug="' + g.slug + '" aria-label="' + g.title + ' 읽기">' +
      '<span class="guide-card-top">' +
        '<span class="guide-num">' + guidePad(g.no) + '</span>' +
        '<span class="guide-card-emoji" aria-hidden="true">' + g.emoji + '</span>' +
        '<span class="guide-read">' + g.readMin + '분</span>' +
      '</span>' +
      '<span class="guide-card-title">' + g.title + '</span>' +
      '<span class="guide-card-kicker">' + g.kicker + '</span>' +
      '<span class="guide-card-summary">' + g.summary + '</span>' +
      '<span class="guide-card-foot">' +
        '<span class="guide-tags">' + g.tags.map(function (t) { return '<span class="guide-tag">#' + t + '</span>'; }).join('') + '</span>' +
        '<span class="guide-go">읽기 <span aria-hidden="true">→</span></span>' +
      '</span>' +
    '</a>';
  }

  function renderGuideList() {
    var el = $('#guide-list');
    if (!el) return;
    el.innerHTML = GUIDES.map(guideCardHTML).join('');
  }

  function guideTocHTML(g) {
    return '<nav class="guide-toc" aria-label="이 글의 목차">' +
      '<span class="guide-toc-title">목차</span><ol>' +
      g.sections.map(function (s) {
        return '<li><button type="button" class="guide-toc-link" data-guide-jump="' + s.id + '">' + s.h + '</button></li>';
      }).join('') +
      '</ol></nav>';
  }

  function guideToolsHTML(g) {
    if (!g.tools || !g.tools.length) return '';
    return '<section class="guide-tools" aria-labelledby="guide-tools-' + g.slug + '">' +
      '<h2 id="guide-tools-' + g.slug + '">이 글과 함께 쓰는 도구</h2>' +
      '<div class="guide-tool-grid">' +
      g.tools.map(function (t) {
        return '<button class="guide-tool" type="button" data-goto="' + t.tab + '"' +
          (t.q ? ' data-dex-q="' + t.q + '"' : '') +
          (t.boss ? ' data-boss="' + t.boss + '"' : '') +
          (t.from ? ' data-from="' + t.from + '"' : '') +
          (t.to ? ' data-to="' + t.to + '"' : '') +
          (t.kind ? ' data-kind="' + t.kind + '"' : '') + '>' +
          '<span class="guide-tool-label">' + t.label + '</span>' +
          '<span class="guide-tool-desc">' + t.desc + '</span>' +
          '<span class="guide-tool-go">바로 가기 <span aria-hidden="true">→</span></span>' +
        '</button>';
      }).join('') +
      '</div></section>';
  }

  function guidePagerHTML(g) {
    var idx = GUIDES.indexOf(g);
    if (idx < 0 || GUIDES.length < 2) return '';
    var prev = GUIDES[(idx - 1 + GUIDES.length) % GUIDES.length];
    var next = GUIDES[(idx + 1) % GUIDES.length];
    return '<nav class="guide-pager" aria-label="다른 가이드">' +
      '<button class="guide-pager-btn is-prev" type="button" data-guide-slug="' + prev.slug + '">' +
        '<span class="gp-dir">← 이전 글</span><span class="gp-title">' + prev.title + '</span></button>' +
      '<button class="guide-pager-btn is-next" type="button" data-guide-slug="' + next.slug + '">' +
        '<span class="gp-dir">다음 글 →</span><span class="gp-title">' + next.title + '</span></button>' +
    '</nav>';
  }

  function guideArticleHTML(g) {
    var secs = g.sections.map(function (s, i) {
      var html = '<section class="guide-sec" id="guide-' + g.slug + '-' + s.id + '">' +
        '<h2>' + s.h + '</h2>' + s.html + '</section>';
      /* 중간 배너는 세 번째 섹션 뒤에 끼워 넣는다 */
      if (i === 2) html += '<div class="guide-slot" data-slot="guide-mid"></div>';
      return html;
    }).join('');

    return '<header class="guide-head">' +
        '<button class="guide-back" type="button" data-guide-back>← 가이드 목록</button>' +
        '<p class="guide-eyebrow">GUIDE ' + guidePad(g.no) + ' · ' + g.tags.join(' · ') + '</p>' +
        '<h1 class="guide-title" tabindex="-1">' + g.title + '</h1>' +
        '<p class="guide-kicker">' + g.kicker + '</p>' +
        '<p class="guide-summary">' + g.summary + '</p>' +
        '<div class="guide-meta">' +
          '<span>🕒 약 ' + g.readMin + '분</span>' +
          '<span>최종 확인 ' + g.updated + '</span>' +
          '<button class="guide-share" type="button" data-guide-share>🔗 링크 복사</button>' +
        '</div>' +
      '</header>' +
      guideTocHTML(g) +
      '<div class="guide-body">' + secs + '</div>' +
      '<div class="guide-slot" data-slot="guide-bottom"></div>' +
      guideToolsHTML(g) +
      '<p class="fineprint guide-fineprint">' +
        '기준일 ' + g.updated + ' · 수치는 게임 내 표기와 진행 중인 이벤트에 따라 달라질 수 있어. ' +
        '업데이트로 내용이 바뀌면 게임 화면이 우선이야.' +
      '</p>' +
      guidePagerHTML(g);
  }

  /* 제휴 배너 노드는 항상 4개만 두고, 화면에 따라 자리만 옮긴다(중복 생성 금지) */
  function placeGuidePromos(where) {
    var mid = document.getElementById('promo-guide-mid');
    var bottom = document.getElementById('promo-guide-bottom');
    if (!mid || !bottom) return;
    if (where === 'article') {
      var slotMid = $('#guide-article .guide-slot[data-slot="guide-mid"]');
      var slotBottom = $('#guide-article .guide-slot[data-slot="guide-bottom"]');
      if (slotMid) slotMid.appendChild(mid);
      if (slotBottom) slotBottom.appendChild(bottom);
    } else {
      var homeMid = document.getElementById('guide-mid-home');
      var homeBottom = document.getElementById('guide-bottom-home');
      if (homeMid) homeMid.appendChild(mid);
      if (homeBottom) homeBottom.appendChild(bottom);
    }
  }

  function showGuideIndex(opts) {
    var idxEl = $('#guide-index'), artEl = $('#guide-article');
    if (!idxEl || !artEl) return;
    guideState.slug = null;
    /* 배너 노드를 먼저 꺼내야 innerHTML 초기화에 함께 지워지지 않는다 */
    placeGuidePromos('index');
    artEl.hidden = true;
    artEl.innerHTML = '';
    idxEl.hidden = false;
    document.title = BASE_TITLE;
    if (!opts || opts.nav !== 'none') {
      if (history.replaceState) history.replaceState(null, '', '#guide');
    }
  }

  function openGuide(slug, opts) {
    var g = guideBySlug(slug);
    if (!g) { showGuideIndex(opts); return; }
    var idxEl = $('#guide-index'), artEl = $('#guide-article');
    if (!idxEl || !artEl) return;
    guideState.slug = g.slug;
    idxEl.hidden = true;
    placeGuidePromos('index');
    artEl.hidden = false;
    artEl.innerHTML = guideArticleHTML(g);
    placeGuidePromos('article');
    document.title = g.title + ' | 오박사의 포켓몬 백과사전';

    var nav = (opts && opts.nav) || 'push';
    if (nav === 'push' && history.pushState) history.pushState(null, '', '#guide/' + g.slug);
    else if (nav === 'replace' && history.replaceState) history.replaceState(null, '', '#guide/' + g.slug);

    track('guide_view', { guide_slug: g.slug, guide_title: g.title, guide_no: g.no });

    window.scrollTo(0, 0);
    var title = artEl.querySelector('.guide-title');
    if (title && title.focus) title.focus({ preventScroll: true });
  }

  function copyGuideLink() {
    var url = location.href;
    track('guide_share', { guide_slug: guideState.slug || '' });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast('이 글 링크를 복사했어요'); })
        .catch(function () { toast('주소창의 링크를 복사해 주세요'); });
    } else {
      toast('주소창의 링크를 복사해 주세요');
    }
  }

  function jumpGuideSection(id) {
    var g = guideBySlug(guideState.slug);
    if (!g) return;
    var el = document.getElementById('guide-' + g.slug + '-' + id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    track('guide_toc_click', { guide_slug: g.slug, section: id });
  }

  /* 가이드 글 안의 버튼으로 다른 탭을 바로 열기 */
  function goFromGuide(btn) {
    var tab = btn.getAttribute('data-goto');
    if (TABS.indexOf(tab) < 0) return;
    track('guide_tool_click', { guide_slug: guideState.slug || '', target_tab: tab });

    if (tab === 'pokedex') {
      var q = btn.getAttribute('data-dex-q') || '';
      var input = $('#dex-q');
      dexState.q = q;
      dexState.type = 'all';
      dexState.shinyOnly = false;
      dexState.shown = DEX_CHUNK;
      if (input) input.value = q;
      var shinyBtn = $('#dex-shiny-only');
      if (shinyBtn) shinyBtn.setAttribute('aria-pressed', 'false');
      $$('.dex-type-chip').forEach(function (c) {
        c.classList.toggle('is-active', c.getAttribute('data-dex-type') === 'all');
        c.style.background = ''; c.style.color = ''; c.style.borderColor = '';
      });
      switchTab('pokedex');
    } else if (tab === 'raids') {
      switchTab('raids');
      var boss = btn.getAttribute('data-boss');
      if (boss) selectBoss(boss);
    } else if (tab === 'powerup') {
      var f = btn.getAttribute('data-from');
      var t = btn.getAttribute('data-to');
      var k = btn.getAttribute('data-kind');
      if (f) $('#from-level').value = f;
      if (t) $('#to-level').value = t;
      if (k) {
        kind = k;
        $$('.seg').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-kind') === k); });
      }
      switchTab('powerup');
    }
    window.scrollTo(0, 0);
  }

  function initGuides() {
    if (!GUIDES.length) return;
    renderGuideList();
    var root = $('#tab-guide');
    if (!root) return;
    root.addEventListener('click', function (e) {
      var back = e.target.closest('[data-guide-back]');
      if (back) { showGuideIndex(); return; }
      var share = e.target.closest('[data-guide-share]');
      if (share) { copyGuideLink(); return; }
      var jump = e.target.closest('[data-guide-jump]');
      if (jump) { jumpGuideSection(jump.getAttribute('data-guide-jump')); return; }
      var tool = e.target.closest('[data-goto]');
      if (tool) { goFromGuide(tool); return; }
      var card = e.target.closest('[data-guide-slug]');
      if (card) {
        /* 새 탭·새 창으로 열기(수정키 클릭)는 브라우저 기본 동작에 맡긴다 */
        if (card.tagName === 'A' && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
        e.preventDefault();
        openGuide(card.getAttribute('data-guide-slug'));
        return;
      }
    });
  }

  /* 주소(#guide/<slug>)로 들어온 경우 그 글을 연다 */
  function routeFromLocation() {
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash.indexOf('guide/') === 0) {
      var slug = hash.slice(6).split('/')[0];
      if (guideBySlug(slug)) { switchTab('guide', { silent: true, guide: slug }); return true; }
    }
    if (hash === 'guide') { switchTab('guide', { silent: true }); return true; }
    if (TABS.indexOf(hash) >= 0) { switchTab(hash, { silent: true }); return true; }
    return false;
  }

  /* ─────────────── 모달 ─────────────── */
  var MODALS = {
    privacy: {
      title: '개인정보처리방침',
      body:
        '<p>본 사이트(「오박사의 포켓몬 백과사전」)는 이용자의 개인정보를 소중히 생각하며, 관련 법령을 준수합니다.</p>' +
        '<h3>1. 수집하는 정보</h3>' +
        '<ul>' +
        '<li>회원가입·로그인이 없는 사이트로, 이름·전화번호·주소 같은 개인정보를 직접 수집하지 않습니다.</li>' +
        '<li>다만 접속 과정에서 IP 주소, 브라우저 종류, 방문 일시, 방문 페이지 등이 자동으로 기록될 수 있습니다.</li>' +
        '<li>광고·통계 서비스(Google AdSense, Google Analytics 등)가 쿠키와 광고 식별자를 사용할 수 있습니다.</li>' +
        '</ul>' +
        '<h3>2. 이용 목적</h3>' +
        '<ul><li>서비스 이용 통계 분석과 화면 개선</li><li>맞춤형 광고 게재 및 광고 성과 측정</li></ul>' +
        '<h3>3. 브라우저에만 저장되는 정보</h3>' +
        '<ul>' +
        '<li>「내 이로치 체크」와 「이벤트 완료 체크」는 이용자 브라우저의 <strong>localStorage</strong>에만 저장되고 서버로 전송되지 않습니다.</li>' +
        '<li>이 기록은 그 브라우저에만 남기 때문에 다른 기기에서는 보이지 않고, 브라우저 데이터를 지우면 함께 삭제됩니다.</li>' +
        '<li>「복사」 버튼으로 복사한 검색식은 이용자 클립보드에만 들어가고 사이트가 따로 보관하지 않습니다.</li>' +
        '</ul>' +
        '<h3>4. 쿠키 및 제3자 광고</h3>' +
        '<ul>' +
        '<li>Google을 비롯한 제3자 광고 사업자는 쿠키를 사용해 이용자의 이전 방문 기록에 기반한 광고를 게재할 수 있습니다.</li>' +
        '<li>Google의 광고 쿠키 사용으로 이용자는 Google 광고 설정(adssettings.google.com)에서 맞춤 광고를 해제할 수 있습니다.</li>' +
        '<li>브라우저 설정에서 쿠키 저장을 거부할 수 있으며, 이 경우 일부 기능 이용에 제한이 있을 수 있습니다.</li>' +
        '</ul>' +
        '<h3>5. 보관 및 파기</h3>' +
        '<p>자동 수집 정보는 목적 달성 후 지체 없이 파기하며, 법령에서 정한 기간 동안만 보관합니다.</p>' +
        '<h3>6. 이용자의 권리</h3>' +
        '<p>이용자는 언제든지 자신의 정보 처리에 관한 열람·정정·삭제를 요청할 수 있습니다.</p>' +
        '<h3>7. 문의</h3>' +
        '<p>개인정보 관련 문의는 운영자 이메일 <a href="mailto:redfilm24@gmail.com">redfilm24@gmail.com</a> 또는 하단 <strong>문의</strong> 메뉴로 접수해 주세요.</p>' +
        '<p style="color:var(--muted)">시행일: 2026년 11월 27일</p>'
    },
    terms: {
      title: '이용약관',
      body:
        '<h3>1. 목적</h3><p>본 약관은 「오박사의 포켓몬 백과사전」(이하 "사이트")가 제공하는 정보·계산 도구의 이용 조건을 정합니다.</p>' +
        '<h3>2. 서비스 내용</h3>' +
        '<ul><li>포켓몬고 이벤트 일정 및 카운트다운</li><li>레이드 보스 약점·추천 카운터 정보</li><li>타입 상성 계산기, 육성 비용 계산기</li><li>관련 가이드 콘텐츠</li></ul>' +
        '<h3>3. 정보의 정확성</h3>' +
        '<p>사이트의 일정·배율·비용 정보는 공개된 자료를 정리한 참고용 정보입니다. 게임 업데이트로 내용이 달라질 수 있으며, 최종 수치는 게임 내 표시가 우선합니다. 사이트는 정보의 완전성·최신성을 보증하지 않습니다.</p>' +
        '<h3>4. 지적재산권</h3>' +
        '<p>Pokémon 및 Pokémon GO와 관련된 명칭·이미지·상표의 권리는 Nintendo, Creatures Inc., GAME FREAK inc., Niantic, Inc.에 있습니다. 본 사이트는 비공식 팬 사이트로, 이들과 제휴하거나 후원받지 않습니다.</p>' +
        '<h3>5. 책임의 제한</h3>' +
        '<p>사이트 이용으로 발생한 게임 내 손실, 데이터 손실, 기타 손해에 대해 사이트 운영자는 책임을 지지 않습니다.</p>' +
        '<h3>6. 약관 변경</h3>' +
        '<p>약관이 변경될 경우 본 페이지에 게시하며, 게시 시점부터 효력이 발생합니다.</p>' +
        '<p style="color:var(--muted)">시행일: 2026년 11월 25일</p>'
    },
    contact: {
      title: '문의',
      body:
        '<p>일정 오류 제보, 기능 건의, 광고·제휴 문의는 아래 채널로 보내 주세요. 확인 후 순서대로 답변드립니다.</p>' +
        '<ul>' +
        '<li><strong>이메일</strong> — <a href="mailto:redfilm24@gmail.com">redfilm24@gmail.com</a></li>' +
        '<li><strong>블로그</strong> — blog.naver.com/seopp 의 최신 글 댓글</li>' +
        '<li><strong>인스타그램</strong> — @obak.sa DM</li>' +
        '</ul>' +
        '<p style="color:var(--muted)">일정 오류를 알려주실 때는 이벤트 이름과 화면에 보이는 시각을 함께 적어 주시면 빠르게 확인할 수 있어요.</p>'
    },
    disclaimer: {
      title: '면책조항',
      body:
        '<h3>1. 정보의 성격</h3>' +
        '<p>본 사이트의 일정·배율·육성 비용·공략은 공개된 게임 정보와 게임 내 표기를 정리한 <strong>참고 자료</strong>입니다. 게임 업데이트, 이벤트, 지역에 따라 실제 수치와 조건이 달라질 수 있으며, 최종 기준은 게임 화면입니다.</p>' +
        '<h3>2. 보증하지 않는 것</h3>' +
        '<p>정보의 완전성·최신성·특정 목적 적합성을 보증하지 않습니다. 본 사이트의 정보를 이용해 내린 육성·교환·구매 등의 판단과 그 결과에 대해 운영자는 책임을 지지 않습니다.</p>' +
        '<h3>3. 상표 및 제휴</h3>' +
        '<p>Pokémon 및 Pokémon GO 관련 명칭·이미지·상표의 권리는 Nintendo, Creatures Inc., GAME FREAK inc., Niantic, Inc.에 있습니다. 본 사이트는 비공식 팬 사이트로, 이들과 제휴하거나 후원받지 않습니다.</p>' +
        '<h3>4. 제휴 링크 고지</h3>' +
        '<p>일부 배너는 쿠팡 파트너스·겜스고 등 제휴 링크이며, 이를 통해 구매가 이루어지면 운영자가 일정액의 수수료를 받을 수 있습니다. 상품의 가격·조건·품질은 판매처가 정하는 것이며, 구매 결정은 이용자에게 있습니다.</p>' +
        '<h3>5. 외부 링크</h3>' +
        '<p>사이트에 연결된 외부 페이지의 내용과 개인정보 처리에는 운영자가 관여하지 않습니다.</p>' +
        '<p style="color:var(--muted)">시행일: 2026년 11월 26일</p>'
    },
    about: {
      title: '소개',
      body:
        '<p>「오박사의 포켓몬 백과사전」은 포켓몬고를 오래 즐겨 온 트레이너가 매일 쓰려고 만든 도구 모음입니다.</p>' +
        '<p>해외 일정 사이트는 시간이 현지 기준이라 매번 계산해야 하고, 카운터 정보는 여러 페이지를 오가야 했습니다. 그래서 <strong>한국 시간 기준 일정 · 약점과 카운터 · 육성 비용</strong>을 한 화면에 모았습니다.</p>' +
        '<p>광고는 서버 유지비를 위해 일정과 본문 사이의 빈 영역에만 배치하며, 콘텐츠를 가리지 원칙으로 운영합니다.</p>' +
        '<p>운영: 오박사의 포켓몬 백과사전 (blog.naver.com/seopp)</p>'
    }
  };

  function openModal(key) {
    var data = MODALS[key];
    if (!data) return;
    $('#modal-title').textContent = data.title;
    $('#modal-body').innerHTML = data.body;
    $('#modal-backdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#modal-close').focus();
    track('modal_open', { modal_name: key });
  }

  function closeModal() {
    $('#modal-backdrop').hidden = true;
    document.body.style.overflow = '';
  }

  function initModals() {
    $$('[data-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(btn.getAttribute('data-modal')); });
    });
    $('#modal-close').addEventListener('click', closeModal);
    $('#modal-backdrop').addEventListener('click', function (e) {
      if (e.target === $('#modal-backdrop')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#modal-backdrop').hidden) closeModal();
    });
  }

  /* ─────────────── 공유 ─────────────── */
  function initShare() {
    var btn = $('#share-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var url = location.href;
      track('share', { method: navigator.share ? 'native' : (navigator.clipboard ? 'clipboard' : 'none') });
      if (navigator.share) {
        navigator.share({ title: '오박사의 포켓몬 백과사전', url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { toast('링크를 복사했어요'); })
          .catch(function () { toast('주소창의 링크를 복사해 주세요'); });
      } else {
        toast('주소창의 링크를 복사해 주세요');
      }
    });
  }

  /* ─────────────── 제휴 배너 (쿠팡 파트너스 · 겜스고) ───────────────
     배너 마크업은 HTML에 두지 않고 여기서 만든다 — 스위치 하나로 켜고 끌 수 있게.
     이동은 링크 기본 동작에 맡기고, 클릭만 GA4 partner_click 으로 남긴다. */
  var ENABLE_AFFILIATE_BANNERS = false;   /* ← 애드센스 승인 후 true 로 바꾸면 그대로 복구 */

  var PROMO_ITEMS = [
    {
      slot: 'events-top', partner: 'coupang', mark: '쿠팡',
      eyebrow: '포켓몬고 필수템 · 쿠팡',
      title: '포고플 오토캐치 — 자동 충전식 · 배터리 교체형',
      desc: '켜 두면 알아서 몬스터볼을 던집니다.',
      cta: '쿠팡에서 보기',
      href: 'https://link.coupang.com/a/iYJYCkpdYW',
      aria: '쿠팡 파트너스 — 포고플 포켓몬고 오토캐치 상품 보기 (새 창)',
      note: '이 배너는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
    },
    {
      slot: 'raids-bottom', partner: 'gamsgo', mark: '겜스고',
      eyebrow: '포켓코인 충전 · 겜스고',
      title: '포켓코인·레이드패스, 정가보다 최대 60% 저렴',
      desc: '550+50부터 87,000+6,000 포켓코인까지, 계정으로 바로 충전합니다.',
      cta: '겜스고에서 보기',
      href: 'https://www.gamsgo.com/partner/cYpzj',
      aria: '겜스고 — 포켓몬고 포켓코인 충전 보기 (새 창)',
      note: '겜스고 제휴 링크입니다. 이 링크를 거쳐 구매하면 일정액의 수수료를 받을 수 있습니다.'
    },
    {
      slot: 'guide-mid', partner: 'coupang', mark: '쿠팡',
      eyebrow: '포켓몬고 필수템 · 쿠팡',
      title: '커뮤니티데이 3시간, 손가락 대신 포고플',
      desc: '몬스터볼·사탕을 자동으로 모아 줍니다.',
      cta: '쿠팡에서 보기',
      href: 'https://link.coupang.com/a/iYJYCkpdYW',
      aria: '쿠팡 파트너스 — 포고플 포켓몬고 오토캐치 상품 보기 (새 창)',
      note: '이 배너는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
    },
    {
      slot: 'guide-bottom', partner: 'gamsgo', mark: '겜스고',
      eyebrow: '포켓코인 충전 · 겜스고',
      title: '레이드패스·GO패스도 겜스고에서',
      desc: '포켓코인부터 리모트 레이드패스까지 한곳에서, 계정 직접 충전.',
      cta: '겜스고에서 보기',
      href: 'https://www.gamsgo.com/partner/cYpzj',
      aria: '겜스고 — 포켓몬고 포켓코인 충전 보기 (새 창)',
      note: '겜스고 제휴 링크입니다. 이 링크를 거쳐 구매하면 일정액의 수수료를 받을 수 있습니다.'
    }
  ];

  function promoHTML(item) {
    return '<a class="promo promo--' + item.partner + '" href="' + item.href + '"' +
      ' target="_blank" rel="noopener noreferrer sponsored"' +
      ' data-partner="' + item.partner + '" data-slot="' + item.slot + '" aria-label="' + item.aria + '">' +
      '<span class="promo-mark" aria-hidden="true">' + item.mark + '</span>' +
      '<span class="promo-main">' +
        '<span class="promo-eyebrow">' + item.eyebrow + '</span>' +
        '<strong class="promo-title">' + item.title + '</strong>' +
        '<span class="promo-desc">' + item.desc + '</span>' +
      '</span>' +
      '<span class="promo-cta">' + item.cta + '<span class="promo-arrow" aria-hidden="true">→</span></span>' +
      '</a>' +
      '<p class="promo-note">' + item.note + '</p>';
  }

  function initPromoBanners() {
    $$('a.promo[data-partner]').forEach(function (link) {
      link.addEventListener('click', function () {
        track('partner_click', {
          partner: link.getAttribute('data-partner'),
          slot: link.getAttribute('data-slot') || ''
        });
      });
    });
  }

  function renderPromoBanners() {
    var hosts = $$('[data-promo-slot]');
    if (!ENABLE_AFFILIATE_BANNERS) {
      /* 심사 기간: 자리 자체를 지워서 배너도 제휴 고지도 여백도 남기지 않는다 */
      hosts.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      return;
    }
    PROMO_ITEMS.forEach(function (item) {
      var host = $('[data-promo-slot="' + item.slot + '"]');
      if (host) host.innerHTML = promoHTML(item);
    });
    initPromoBanners();
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#0F172A;color:#fff;' +
        'border:1px solid #0EA5E9;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:700;z-index:120;' +
        'box-shadow:0 8px 24px rgba(0,0,0,.5);transition:opacity .25s;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 1800);
  }

  /* ─────────────── 인게임 한글 검색식 생성기 ───────────────
     포켓몬고 한국어 검색창이 실제로 알아듣는 낱말만 쓴다.
     색이 다른(이로치) · 반짝반짝(럭키) · 전설의 포켓몬 · 환상 · 울트라비스트 · 특별(코스튬)
     · 즐겨찾기 · #(태그) · @기술(특별한 기술) · 일수0-7 · cp-1500 · 0-1공격 · 3-4방어 · 3-4HP */
  var SG_EX = [
    ['star4', '4성(100%)', '!4*'],
    ['shiny', '색이 다른(이로치)', '!색이 다른'],
    ['shadow', '그림자', '!그림자'],
    ['legendary', '전설의 포켓몬', '!전설의 포켓몬'],
    ['mythical', '환상', '!환상'],
    ['ultra', '울트라비스트', '!울트라비스트'],
    ['costume', '코스튬(특별)', '!특별'],
    ['favorite', '즐겨찾기', '!즐겨찾기'],
    ['tagged', '태그 있음(#)', '!#'],
    ['legacy', '특별한 기술(@기술)', '!@기술'],
    ['lucky', '반짝반짝(럭키)', '!반짝반짝']
  ];

  function sgBlankEx() {
    var m = {};
    SG_EX.forEach(function (x) { m[x[0]] = false; });
    return m;
  }

  function sgAllEx() {
    var m = {};
    SG_EX.forEach(function (x) { m[x[0]] = true; });
    return m;
  }

  var SG_PRESETS = [
    {
      id: 'doctor', label: '박사 보내기용',
      note: '100%·이로치·그림자·전설·환상·울트라비스트·코스튬·즐겨찾기·태그·특별한 기술·럭키를 빼고 남깁니다. 여기 나오는 포켓몬이 보내기 후보예요.',
      state: { ex: sgAllEx(), grade: '', days: '', iv: '', cp: '' }
    },
    {
      id: 'pvp', label: '배틀리그 0공격',
      note: '공격은 낮고 방어·HP가 높은 배틀리그형 개체를 찾습니다. CP를 같이 고르면 슈퍼·하이퍼리그 상한 안에 있는 것만 남아요.',
      state: { ex: sgBlankEx(), grade: '', days: '', iv: '0-1공격&3-4방어&3-4HP', cp: '' }
    },
    {
      id: 'cd', label: '커뮤니티데이 정리',
      note: '오늘 잡은 포켓몬 중에서 100%·이로치·그림자·코스튬·즐겨찾기·태그를 뺀 나머지만 보여 줍니다. 커뮤니티데이 마무리에 쓰세요.',
      state: { ex: (function () { var m = sgBlankEx(); m.star4 = 1; m.shiny = 1; m.shadow = 1; m.costume = 1; m.favorite = 1; m.tagged = 1; return m; })(), grade: '', days: '일수0', iv: '', cp: '' }
    },
    {
      id: 'week', label: '최근 7일 잉여 정리',
      note: '일주일 동안 잡은 것 중에서 남길 만한 개체를 빼고 보여 줍니다. 대량 보내기 전에 한 번 더 확인하세요.',
      state: { ex: (function () { var m = sgBlankEx(); m.star4 = 1; m.shiny = 1; m.shadow = 1; m.legendary = 1; m.mythical = 1; m.favorite = 1; m.tagged = 1; return m; })(), grade: '', days: '일수0-7', iv: '', cp: '' }
    },
    {
      id: 'shiny', label: '이로치만 모아보기',
      note: '가지고 있는 이로치를 한 번에 보여 줍니다. 이로치 체크는 이 사이트 «도감 → 🏅 내 이로치»에 저장해 두세요.',
      state: { ex: sgBlankEx(), grade: '', days: '', iv: '', cp: '' , only: '색이 다른' }
    },
    {
      id: 'lucky', label: '럭키 교환 후보',
      note: '반짝반짝(럭키) 포켓몬 중 3~4성만 보여 줍니다. 교환으로 개체값을 올릴 후보를 고를 때 쓰세요.',
      state: { ex: sgBlankEx(), grade: '3*,4*', days: '', iv: '', cp: '', only: '반짝반짝' }
    },
    {
      id: 'evolve', label: '도감 신규 진화',
      note: '지금 진화할 수 있고, 진화한 모습이 아직 도감에 없는 포켓몬만 보여 줍니다. 도감 채울 때 좋아요.',
      state: { ex: sgBlankEx(), grade: '', days: '', iv: '', cp: '', only: '진화&미등록' }
    }
  ];

  var sgState = { id: 'doctor', ex: sgAllEx(), grade: '', days: '', iv: '', cp: '', only: '' };

  function sgApplyPreset(p) {
    sgState.id = p.id;
    sgState.ex = {};
    SG_EX.forEach(function (x) { sgState.ex[x[0]] = !!p.state.ex[x[0]]; });
    sgState.grade = p.state.grade || '';
    sgState.days = p.state.days || '';
    sgState.iv = p.state.iv || '';
    sgState.cp = p.state.cp || '';
    sgState.only = p.state.only || '';
  }

  function sgBuild() {
    var parts = [];
    if (sgState.only) parts.push(sgState.only);
    if (sgState.grade) parts.push(sgState.grade);
    if (sgState.days) parts.push(sgState.days);
    if (sgState.iv) parts.push(sgState.iv);
    if (sgState.cp) parts.push(sgState.cp);
    SG_EX.forEach(function (x) { if (sgState.ex[x[0]]) parts.push(x[2]); });
    return parts.join('&');
  }

  function sgNote() {
    for (var i = 0; i < SG_PRESETS.length; i++) {
      if (SG_PRESETS[i].id === sgState.id) return SG_PRESETS[i].note;
    }
    return '게임 검색창에 붙여넣으면 조건에 맞는 포켓몬만 남아요.';
  }

  function renderSg() {
    var codeEl = $('#sg-code'), noteEl = $('#sg-note');
    if (!codeEl) return;
    var code = sgBuild();
    codeEl.textContent = code || '조건을 하나 이상 골라 주세요';
    noteEl.textContent = sgNote();
    $$('#sg-presets .sg-preset').forEach(function (b) {
      var on = b.getAttribute('data-preset') === sgState.id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('#sg-exclude .sg-chip').forEach(function (b) {
      var on = !!sgState.ex[b.getAttribute('data-ex')];
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var g = $('#sg-grade'), d = $('#sg-days'), iv = $('#sg-iv'), cp = $('#sg-cp');
    if (g) g.value = sgState.grade;
    if (d) d.value = sgState.days;
    if (iv) iv.value = sgState.iv;
    if (cp) cp.value = sgState.cp;
  }

  /* 클립보드 복사 — https가 아니거나 권한이 막혀도 되도록 예비 방법을 둔다 */
  function copyPlainText(text, okMsg) {
    if (!text) { toast('만들 검색식이 없어요'); return; }
    var done = function () { toast(okMsg || '복사했어요'); };
    var legacy = function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done(); else toast('검색식이 길어요. 아래 코드를 길게 눌러 복사해 주세요');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(legacy);
    } else legacy();
  }

  function initSearchGen() {
    var presets = $('#sg-presets');
    var exclude = $('#sg-exclude');
    if (!presets || !exclude) return;

    presets.innerHTML = SG_PRESETS.map(function (p) {
      return '<button class="sg-preset' + (p.id === sgState.id ? ' is-active' : '') + '" type="button" data-preset="' + p.id +
        '" aria-pressed="' + (p.id === sgState.id ? 'true' : 'false') + '">' + p.label + '</button>';
    }).join('');

    exclude.innerHTML = SG_EX.map(function (x) {
      return '<button class="sg-chip" type="button" data-ex="' + x[0] + '" aria-pressed="false">' + x[1] + '</button>';
    }).join('');

    presets.addEventListener('click', function (e) {
      var b = e.target.closest('.sg-preset');
      if (!b) return;
      var id = b.getAttribute('data-preset');
      var p = SG_PRESETS.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      sgApplyPreset(p);
      renderSg();
      track('searchgen_preset', { preset: id });
    });

    exclude.addEventListener('click', function (e) {
      var b = e.target.closest('.sg-chip');
      if (!b) return;
      var k = b.getAttribute('data-ex');
      sgState.ex[k] = !sgState.ex[k];
      sgState.id = '';
      renderSg();
    });

    [['#sg-grade', 'grade'], ['#sg-days', 'days'], ['#sg-iv', 'iv'], ['#sg-cp', 'cp']].forEach(function (cfg) {
      var el = $(cfg[0]);
      if (!el) return;
      el.addEventListener('change', function () {
        sgState[cfg[1]] = el.value;
        sgState.id = '';
        renderSg();
      });
    });

    var copy = $('#sg-copy');
    if (copy) copy.addEventListener('click', function () {
      copyPlainText(sgBuild(), '검색식을 복사했어요. 게임 검색창에 붙여넣으세요');
      track('searchgen_copy', { preset: sgState.id || 'custom' });
    });

    renderSg();
  }

  /* ─────────────── 내 배틀 파티 3마리 약점 진단 ─────────────── */
  var partyState = { league: '1500', mons: [null, null, null], lists: [[], [], []], active: [-1, -1, -1] };

  function partySlotHTML(i) {
    return '<div class="party-slot" data-slot="' + i + '">' +
      '<span class="ps-no">' + (i + 1) + '</span>' +
      '<div class="iv-search ps-search">' +
        '<label class="iv-search-box" for="party-q-' + i + '">' +
          '<span class="iv-search-icon" aria-hidden="true">🔍</span>' +
          '<input type="search" id="party-q-' + i + '" class="iv-input" autocomplete="off" spellcheck="false"' +
            ' placeholder="' + (i === 0 ? '이름 · 초성 · 도감번호 (예: 마릴, 184)' : '포켓몬 ' + (i + 1) + ' (선택)') + '"' +
            ' aria-label="파티 ' + (i + 1) + '번째 포켓몬 검색">' +
        '</label>' +
        '<ul class="iv-suggest" id="party-sug-' + i + '" hidden></ul>' +
      '</div>' +
      '<div class="ps-picked" id="party-pick-' + i + '" hidden></div>' +
    '</div>';
  }

  function renderPartySlots() {
    var wrap = $('#party-slots');
    if (!wrap) return;
    wrap.innerHTML = [0, 1, 2].map(partySlotHTML).join('');
    [0, 1, 2].forEach(renderPartyPicked);
  }

  function renderPartyPicked(i) {
    var box = $('#party-pick-' + i);
    var input = $('#party-q-' + i);
    if (!box) return;
    var search = input && input.closest('.ps-search') ? input.closest('.ps-search') : null;
    var p = partyState.mons[i];
    if (!p) {
      box.hidden = true;
      box.innerHTML = '';
      if (search) search.hidden = false;
      if (input) input.hidden = false;
      return;
    }
    if (search) search.hidden = true;
    box.hidden = false;
    box.innerHTML = monSpriteHTML(p.id, 'ps-sprite', 40) +
      '<span class="ps-name">' + p.n + '</span>' +
      '<span class="ps-types">' + p.t.map(function (t) {
        return '<span class="type-chip" style="background:' + PGO.typeColor(t) + ';color:' + PGO.typeText(t) + '">' + PGO.typeKo(t) + '</span>';
      }).join('') + '</span>' +
      '<button class="ps-clear" type="button" data-party-clear="' + i + '" aria-label="' + p.n + ' 빼기">✕</button>';
  }

  function partySuggest(i, raw) {
    var sug = $('#party-sug-' + i);
    if (!sug) return;
    var q = String(raw || '').trim();
    if (!q) { sug.hidden = true; sug.innerHTML = ''; partyState.lists[i] = []; return; }
    partyState.lists[i] = dexSearch(q, 8);
    partyState.active[i] = 0;
    if (!partyState.lists[i].length) {
      sug.innerHTML = '<li class="iv-sug-empty">검색 결과가 없어요. 이름·초성·도감번호로 다시 입력해 보세요.</li>';
      sug.hidden = false;
      return;
    }
    sug.innerHTML = partyState.lists[i].map(function (p, idx) {
      return '<li><button class="iv-sug' + (idx === 0 ? ' is-active' : '') + '" type="button" data-party-pick="' + i + '" data-party-dex="' + p.id + '">' +
        monSpriteHTML(p.id, 'iv-sug-sprite', 32) +
        '<span class="iv-sug-no">' + dexNo(p.id) + '</span>' +
        '<span class="iv-sug-name">' + p.n + '</span>' +
        '<span class="iv-sug-types">' + p.t.map(function (t) { return PGO.typeKo(t); }).join('·') + '</span>' +
      '</button></li>';
    }).join('');
    sug.hidden = false;
  }

  function partyPick(i, id) {
    var p = DEX.filter(function (x) { return x.id === Number(id); })[0];
    if (!p) return;
    partyState.mons[i] = p;
    partyState.active[i] = -1;
    var q = $('#party-q-' + i);
    var sug = $('#party-sug-' + i);
    if (q) { q.value = p.n; q.hidden = true; }
    if (sug) { sug.hidden = true; sug.innerHTML = ''; }
    renderPartyPicked(i);
    renderPartyResult();
    track('party_pick', { slot: i + 1, pokemon: p.n, dex_id: p.id, league: partyState.league });
  }

  function partyClear(i) {
    partyState.mons[i] = null;
    var input = $('#party-q-' + i);
    if (input) { input.value = ''; input.hidden = false; }
    renderPartyPicked(i);
    renderPartyResult();
  }

  function partyAnalyze(mons) {
    var def = {};
    PGO.TYPES.forEach(function (t) { def[t.id] = { id: t.id, ko: t.ko, count: 0, max: 0, who: [] }; });
    mons.forEach(function (m) {
      PGO.defenseTable(m.t).forEach(function (r) {
        if (r.mult > 1.001) {
          var d = def[r.type];
          d.count++;
          if (r.mult > d.max) d.max = r.mult;
          d.who.push(m.n);
        }
      });
    });
    var need = mons.length >= 2 ? 2 : 1;
    var weak = Object.keys(def).map(function (k) { return def[k]; })
      .filter(function (d) { return d.count >= need; })
      .sort(function (a, b) { return b.count - a.count || b.max - a.max; });

    var covered = {};
    mons.forEach(function (m) {
      m.t.forEach(function (at) {
        PGO.TYPES.forEach(function (dt) { if (PGO.single(at, dt.id) > 1.001) covered[dt.id] = 1; });
      });
    });
    var uncovered = PGO.TYPES.filter(function (t) { return !covered[t.id]; });

    var tier = PVP_TIER[partyState.league] || [];
    var threats = [];
    var mine = {};
    mons.forEach(function (m) { mine[m.n] = 1; });
    tier.forEach(function (r) {
      if (mine[r.n]) return;
      var ourBest = 0;
      mons.forEach(function (m) {
        m.t.forEach(function (at) { if (PGO.multi(at, r.t) > ourBest) ourBest = PGO.multi(at, r.t); });
      });
      var hits = 0, theirBest = 0;
      r.t.forEach(function (tt) {
        var best = 0;
        mons.forEach(function (m) { if (PGO.multi(tt, m.t) > best) best = PGO.multi(tt, m.t); });
        if (best > 1.001) { hits++; if (best > theirBest) theirBest = best; }
      });
      var score = (ourBest < 1.6 ? 2 : 0) + hits + (theirBest > 2.5 ? 1 : 0);
      if (score >= 3) threats.push({ r: r, ourBest: ourBest, hits: hits, theirBest: theirBest, score: score });
    });
    threats.sort(function (a, b) { return b.score - a.score || a.r.r - b.r.r; });

    return { weak: weak, uncovered: uncovered, threats: threats.slice(0, 4), coveredCount: 18 - uncovered.length };
  }

  function renderPartyResult() {
    var box = $('#party-result');
    if (!box) return;
    var mons = partyState.mons.filter(Boolean);
    if (!mons.length) {
      box.innerHTML = '<p class="iv-empty">3마리를 넣으면 약점 타입·못 찌르는 타입·주의할 상대를 진단해 드려요.</p>';
      return;
    }
    var a = partyAnalyze(mons);

    var weakHTML = a.weak.length ? a.weak.map(function (d) {
      return '<span class="party-chip is-weak">' +
        '<span class="type-chip" style="background:' + PGO.typeColor(d.id) + ';color:' + PGO.typeText(d.id) + '">' + d.ko + '</span>' +
        '<b>' + d.count + '/' + mons.length + '마리</b></span>';
    }).join('') : '<span class="party-none">2마리 이상 같이 약한 타입은 없어요.</span>';

    var uncHTML = a.uncovered.length ? a.uncovered.map(function (t) {
      return '<span class="type-chip" style="background:' + PGO.typeColor(t.id) + ';color:' + PGO.typeText(t.id) + '">' + PGO.typeKo(t.id) + '</span>';
    }).join('') : '<span class="party-none">18개 타입을 모두 1.6배로 찌를 수 있어요.</span>';

    var threatHTML = a.threats.length ? a.threats.map(function (t) {
      var reasons = [];
      if (t.ourBest < 1.6) reasons.push('1.6배로 못 찌름');
      if (t.hits) reasons.push('우리 ' + t.hits + '마리에 약점');
      if (t.theirBest > 2.5) reasons.push('우리 쪽에 2.56배');
      return '<div class="threat-row">' +
        monSpriteHTML(t.r.n, 'threat-sprite', 36) +
        '<div class="threat-body">' +
          '<p class="threat-name">' + t.r.n + ' <span class="role-chip">' + t.r.role + '</span></p>' +
          '<p class="threat-reason">' + reasons.join(' · ') + '</p>' +
        '</div>' +
        '<span class="threat-types">' + t.r.t.map(function (tt) {
          return '<span class="type-chip" style="background:' + PGO.typeColor(tt) + ';color:' + PGO.typeText(tt) + '">' + PGO.typeKo(tt) + '</span>';
        }).join('') + '</span>' +
      '</div>';
    }).join('') : '<p class="party-none">이 리그 TOP 30에서는 눈에 띄는 위협이 없어요.</p>';

    var summary = '이 조합은 ' +
      (a.weak.length ? '<b>' + a.weak.slice(0, 3).map(function (d) { return d.ko; }).join('·') + '</b>에 약하고, ' : '') +
      (a.uncovered.length ? '<b>' + a.uncovered.length + '개 타입</b>을 못 찌릅니다.' : '18개 타입을 모두 찌를 수 있습니다.');

    box.innerHTML = '<p class="party-summary">' + summary + (mons.length < 3 ? ' <span class="party-tip">(' + (3 - mons.length) + '마리 더 넣으면 더 정확해져요)</span>' : '') + '</p>' +
      '<div class="party-block"><h4 class="party-h">방어 약점 — 두 마리 이상 같이 약한 타입</h4><div class="party-chips">' + weakHTML + '</div></div>' +
      '<div class="party-block"><h4 class="party-h">공격 커버리지 — 자속으로 못 찌르는 타입 (' + (18 - a.coveredCount) + '개)</h4><div class="party-chips">' + uncHTML + '</div></div>' +
      '<div class="party-block"><h4 class="party-h">주의할 상위 메타</h4><div class="threat-list">' + threatHTML + '</div></div>';
  }

  function initParty() {
    var wrap = $('#party-slots');
    if (!wrap) return;
    renderPartySlots();

    var league = $('#party-league');
    if (league) league.addEventListener('click', function (e) {
      var b = e.target.closest('.seg');
      if (!b) return;
      $$('.seg', league).forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      partyState.league = b.getAttribute('data-party-lg');
      renderPartyResult();
      track('party_league', { league: partyState.league });
      /* 티어 목록도 같은 리그로 바꿔 두면 두 목록이 엇갈리지 않는다 */
      if (tierState.lg !== partyState.league) {
        tierState.lg = partyState.league;
        $$('#tier-league .seg').forEach(function (x) {
          x.classList.toggle('is-active', x.getAttribute('data-lg') === tierState.lg);
        });
        renderTier();
      }
    });

    wrap.addEventListener('input', function (e) {
      var input = e.target.closest('.iv-input');
      if (!input) return;
      var i = Number(input.id.replace('party-q-', ''));
      partySuggest(i, input.value);
    });

    wrap.addEventListener('keydown', function (e) {
      var input = e.target.closest('.iv-input');
      if (!input) return;
      var i = Number(input.id.replace('party-q-', ''));
      var list = partyState.lists[i] || [];
      if (e.key === 'Enter') {
        if (!list.length) return;
        e.preventDefault();
        partyPick(i, (list[partyState.active[i] >= 0 ? partyState.active[i] : 0] || list[0]).id);
      } else if (e.key === 'Escape') {
        var sug = $('#party-sug-' + i);
        if (sug) sug.hidden = true;
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!list.length) return;
        e.preventDefault();
        var n = list.length;
        partyState.active[i] = ((partyState.active[i] + (e.key === 'ArrowDown' ? 1 : -1)) + n) % n;
        $$('#party-sug-' + i + ' .iv-sug').forEach(function (b, idx) {
          b.classList.toggle('is-active', idx === partyState.active[i]);
        });
      }
    });

    wrap.addEventListener('click', function (e) {
      var pick = e.target.closest('[data-party-dex]');
      if (pick) {
        partyPick(Number(pick.getAttribute('data-party-pick')), Number(pick.getAttribute('data-party-dex')));
        return;
      }
      var clear = e.target.closest('[data-party-clear]');
      if (clear) partyClear(Number(clear.getAttribute('data-party-clear')));
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.party-slot')) {
        [0, 1, 2].forEach(function (i) {
          var sug = $('#party-sug-' + i);
          if (sug) sug.hidden = true;
        });
      }
    });

    renderPartyResult();
  }

  /* ─────────────── 레이드 인원별 클리어 계산 ───────────────
     data/raid-counters.js 의 DPS 는 40레벨·개체값 15·보스 방어 CPM 0.79 기준 사이클 DPS 라서
     트레이너 레벨은 CPM 비율로, 그림자 레이드의 방어 CPM 0.82 는 배율로 보정한다.
     한 사람이 TOP 6 을 순서대로 쓰는 것으로 보고 6마리 평균 DPS 를 쓴다(리로비 때 다시 같은 6마리). */
  var rcState = { people: 3, level: 40, weather: 0, friend: 'none' };
  var RC_EFFICIENCY = 0.8;   /* 교체·리로비·회피 손실 실전 보정 */
  var RC_TIME_LIMIT = 300;

  function rcBossInfo(boss) {
    var tier = boss.tier || '';
    var hp = 15000, defCpm = 0.79, shield = false;
    if (/슈퍼 메가/.test(tier)) { hp = 22500; shield = true; }
    else if (/메가/.test(tier) || /^메가/.test(boss.kr || '')) hp = 9000;
    if (/그림자/.test(tier)) defCpm = 0.82;
    return { hp: hp, defCpm: defCpm, shield: shield, limit: RC_TIME_LIMIT };
  }

  function rcCompute(boss) {
    if (!boss) return null;
    if (boss.max) return { max: true };
    var rows = RAID_TOP[boss.id] || [];
    if (!rows.length) return null;
    var info = rcBossInfo(boss);
    var weakTypes = PGO.weaknesses(boss.types).map(function (w) { return w.type; });
    var boostTypes = {};
    PGO.weatherFor(weakTypes).forEach(function (w) {
      w.types.forEach(function (t) { boostTypes[t] = 1; });
    });
    var levelCpm = CPM_TABLE[rcState.level] || CPM_TABLE[40] || 0.7903001;
    var levelF = levelCpm / 0.7903001;
    var defF = 0.7903001 / info.defCpm;
    var friendF = rcState.friend === 'best' ? 1.10 : rcState.friend === 'ultra' ? 1.07 : 1;
    var sum = 0, boostedCount = 0;
    rows.forEach(function (r) {
      var boosted = !!rcState.weather && (r.t || []).some(function (t) { return boostTypes[t]; });
      if (boosted) boostedCount++;
      sum += r.dps * (boosted ? 1.2 : 1);
    });
    var perTrainer = (sum / rows.length) * levelF * defF;
    var table = [];
    for (var n = 1; n <= 6; n++) {
      var dps = perTrainer * friendF * n * RC_EFFICIENCY;
      var t = dps > 0 ? info.hp / dps : Infinity;
      table.push({ n: n, t: t, ok: t <= info.limit });
    }
    return {
      info: info, table: table, perTrainer: perTrainer, friendF: friendF,
      meanDps: sum / rows.length, boostedCount: boostedCount, count: rows.length
    };
  }

  function rcTimeText(t) {
    if (!isFinite(t) || t <= 0) return '—';
    if (t > 900) return '15분 이상';
    var m = Math.floor(t / 60), s = Math.round(t % 60);
    if (s === 60) { m++; s = 0; }
    return m > 0 ? m + '분 ' + (s < 10 ? '0' : '') + s + '초' : s + '초';
  }

  function rcVerdict(t, limit) {
    if (!isFinite(t)) return { cls: 'is-no', label: '계산 불가' };
    var r = t / limit;
    if (r > 1) return { cls: 'is-no', label: '시간 초과' };
    if (r <= 0.5) return { cls: 'is-easy', label: '아주 여유' };
    if (r <= 0.7) return { cls: 'is-easy', label: '여유' };
    if (r <= 0.85) return { cls: 'is-ok', label: '적당' };
    if (r <= 0.95) return { cls: 'is-tight', label: '빡빡함' };
    return { cls: 'is-tight', label: '아슬아슬' };
  }

  function renderRaidCount(boss) {
    var box = $('#raid-count');
    if (!box) return;
    var verdictEl = $('#rc-verdict'), tableEl = $('#rc-table'), noteEl = $('#rc-note');
    if (!verdictEl || !tableEl || !noteEl) return;
    var res = rcCompute(boss);

    if (!res) {
      verdictEl.innerHTML = '<p class="rc-empty">이 보스는 카운터 DPS 데이터가 없어 인원 계산을 할 수 없어요. 위 TOP 6 목록을 참고하세요.</p>';
      tableEl.innerHTML = '';
      noteEl.textContent = '';
      return;
    }
    if (res.max) {
      verdictEl.innerHTML = '<p class="rc-empty">맥스배틀은 일반 레이드와 계산이 달라요. 같은 타입 맥스무브를 가진 다이맥스 3마리를 준비하는 쪽이 먼저입니다.</p>';
      tableEl.innerHTML = '';
      noteEl.textContent = '';
      return;
    }

    var sel = res.table[rcState.people - 1] || res.table[0];
    var v = rcVerdict(sel.t, res.info.limit);
    var firstOk = null, safeOk = null;
    res.table.forEach(function (row) {
      if (row.ok && firstOk === null) firstOk = row.n;
      if (row.t <= res.info.limit * 0.7 && safeOk === null) safeOk = row.n;
    });

    var line;
    if (!firstOk) {
      line = '이 조건에서는 6명으로도 시간이 모자라요. 레벨·날씨·프렌드 보너스를 올려 보세요.';
    } else if (safeOk) {
      line = '<b>' + firstOk + '명</b>부터 가능하고, <b>' + safeOk + '명</b>이면 여유 있게 깹니다.';
    } else {
      line = '<b>' + firstOk + '명</b>부터 가능하지만 시간이 꽤 빠듯해요. 한 명 더 모으면 안정적입니다.';
    }

    verdictEl.innerHTML =
      '<div class="rc-head">' +
        '<div class="rc-big">' +
          '<span class="rc-people">' + rcState.people + '명</span>' +
          '<strong class="rc-time">' + rcTimeText(sel.t) + '</strong>' +
          '<span class="rc-badge ' + v.cls + '">' + v.label + '</span>' +
        '</div>' +
        '<p class="rc-line">' + line + ' <span class="rc-limit">(제한 시간 ' + res.info.limit + '초)</span></p>' +
      '</div>';

    tableEl.innerHTML = '<div class="rc-rows">' + res.table.map(function (row) {
      var vv = rcVerdict(row.t, res.info.limit);
      return '<div class="rc-row' + (row.n === rcState.people ? ' is-sel' : '') + '">' +
        '<span class="rc-n">' + row.n + '명</span>' +
        '<span class="rc-t">' + rcTimeText(row.t) + '</span>' +
        '<span class="rc-v ' + vv.cls + '">' + vv.label + '</span>' +
      '</div>';
    }).join('') + '</div>';

    noteEl.textContent = '보스 HP ' + num(res.info.hp) + ' · 제한 시간 ' + res.info.limit + '초 기준입니다. TOP 6 카운터 6마리를 모두 보유했다고 보고 ' +
      '평균 ' + res.meanDps.toFixed(1) + ' DPS(레벨 40·개체값 15)를 바탕으로 레벨·날씨·프렌드 보너스를 반영했습니다' +
      (rcState.weather ? ' (날씨 부스트 해당 카운터 ' + res.boostedCount + '/' + res.count + '마리)' : '') +
      '. 교체·리로비·회피 손실 20%를 빼서 계산한 추정값이라, 실제 클리어는 파티와 플레이에 따라 달라집니다' +
      (res.info.shield ? '. 슈퍼 메가 레이드는 방패를 깨는 메가진화가 있어야 해서 더 오래 걸릴 수 있어요.' : '.');
  }

  function initRaidCount() {
    var people = $('#rc-people'), level = $('#rc-level'), weather = $('#rc-weather'), friend = $('#rc-friend');
    if (!people) return;
    function refresh() {
      var boss = BOSSES.filter(function (b) { return b.id === activeBossId; })[0] || null;
      renderRaidCount(boss);
    }
    people.addEventListener('change', function () { rcState.people = Number(people.value) || 1; refresh(); track('raid_count_people', { people: rcState.people }); });
    level.addEventListener('change', function () { rcState.level = Number(level.value) || 40; refresh(); track('raid_count_level', { level: rcState.level }); });
    weather.addEventListener('change', function () { rcState.weather = Number(weather.value) || 0; refresh(); });
    friend.addEventListener('change', function () { rcState.friend = friend.value; refresh(); });
  }

  /* ─────────────── 시작 ─────────────── */
  function boot() {
    tickClock();
    initTabs();
    initBrand();
    initFilterChips();
    initEventChecks();
    initBossGrid();
    initRaidCount();
    initTypeCalc();
    initPowerUp();
    initIV();
    initTier();
    initParty();
    initDex();
    initSearchGen();
    initModals();
    initShare();
    renderPromoBanners();
    initGuides();

    window.addEventListener('popstate', routeFromLocation);
    window.addEventListener('hashchange', routeFromLocation);

    /* ?guide=<slug> 로 들어와도 해시 주소로 바꿔서 공유·뒤로가기가 되게 한다 */
    var qGuide = null;
    try { qGuide = new URLSearchParams(location.search).get('guide'); } catch (e) { qGuide = null; }
    if (qGuide && guideBySlug(qGuide)) {
      try {
        var params = new URLSearchParams(location.search);
        params.delete('guide');
        var qs = params.toString();
        if (history.replaceState) {
          history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + '#guide/' + qGuide);
        }
      } catch (e2) { /* URL API 실패 시 해시만 유지 */ }
      switchTab('guide', { silent: true, guide: qGuide });
    } else if (!routeFromLocation()) {
      switchTab('events', { silent: true });
    }
    renderEvents();

    setInterval(function () {
      tickClock();
      updateTimers();
      updateHero(Date.now());
    }, 1000);

    // 30초마다 상태(진행/예정) 재정렬
    setInterval(renderEvents, 30000);

    // 이벤트 카드 강조 표시 (오늘 이벤트)
    var now = Date.now();
    EVENTS.forEach(function (ev) {
      var s = parse(ev.start), e = parse(ev.end);
      if (s && e && now >= s && now < e && (e - s) <= 3 * 3600000) ev.hot = true;
    });
    renderEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* 테스트용 노출 */
  window.__HUB = {
    formatRemain: formatRemain,
    dday: dday,
    powerUpCost: function (f, t, k) {
      var r = powerUpCost(f, t);
      var m = KIND_MULT[k || 'normal'];
      return { dust: Math.round(r.raw.dust * m.dust), candy: Math.round(r.raw.candy * m.candy),
               xl: Math.round(r.raw.xl * m.candy), steps: r.steps, rows: r.rows };
    },
    costAt: costAt,
    computeCounters: computeCounters,
    raidTop: RAID_TOP,
    pvpTier: PVP_TIER,
    ivPick: ivPick,
    ivTable: ivTable,
    ivState: ivState,
    ivRankOf: function (id, cap, a, d, s) {
      var p = DEX.filter(function (x) { return x.id === id; })[0];
      if (!p) return null;
      var rows = ivTable(p, cap || 1500);
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].a === a && rows[i].d === d && rows[i].s === s) {
          return { rank: rows[i].rank, level: rows[i].lv, cp: rows[i].cp, prod: rows[i].prod, best: rows[0] };
        }
      }
      return null;
    },
    eventState: eventState,
    nextUpcoming: nextUpcoming,
    kstClock: kstClock,
    selectBoss: selectBoss,
    switchTab: switchTab,
    goHome: goHome,
    events: EVENTS,
    bosses: BOSSES,
    dex: DEX,
    guides: GUIDES,
    openGuide: openGuide,
    showGuideIndex: showGuideIndex,
    guideState: guideState,
    maxCP: function (id) { var p = DEX.filter(function (x) { return x.id === id; })[0]; return p ? { lv40: maxCP(p, CPM40), lv50: maxCP(p, CPM50) } : null; },
    openDex: openDex,
    closeDex: closeDex,
    dexSearch: dexSearch,
    dexQueryScore: dexQueryScore,
    dexState: dexState,
    searchGen: { build: sgBuild, state: sgState, presets: SG_PRESETS },
    party: { state: partyState, pick: partyPick, clear: partyClear, analyze: partyAnalyze, result: renderPartyResult },
    raidCount: { state: rcState, compute: rcCompute, render: renderRaidCount },
    myShiny: { owned: shinyOwned, set: shinySet, count: shinyCount },
    eventDone: { is: eventIsDone },
    dexIdOfName: dexIdOfName
  };
})();
