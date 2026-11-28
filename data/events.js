/* =========================================================
   오박사의 포켓몬 백과사전 — 일정 데이터 (한국 시간 KST 기준)
   기준 확인일: 2026-11-25 (leekduck.com/events/ 및 각 이벤트 상세 페이지 대조)
   - 모든 시각은 한국 표준시(+09:00) 고정값입니다. 기기 시간대와 무관하게 동작합니다.
   - desc·tip 은 사이트 말투와 같이 태초마을 오박사 말투(~단다·~란다·~구나·~하렴·~보렴·~자꾸나)로 쓴다.
     일반 반말(~야·~어·~나와·~사라져·~올라가·~열려)과 존댓말·'~다네'는 쓰지 않는다.
   - 모바일에서 문장이 뭉치지 않도록 문장 사이에 \n 을 넣는다(CSS white-space: pre-line).
   - 이벤트가 추가/변경되면 이 파일만 고치면 됩니다.
   category: raid | spotlight | max | community | event
   pokemonId: 이벤트 주인공 포켓몬 도감번호. 있으면 카드 아이콘이 공식 일러스트로 바뀌고,
              로드에 실패하면 emoji 로 자동 폴백합니다. 메가 포켓몬은 PokeAPI 폼 번호
              (메가메타그로스 10076 · 메가야도란 10071 · 메가픽시 10278)를 씁니다.
   thumb: 주인공 포켓몬이 없는 시즌·메인 이벤트·GO패스 카드용 공식 배너 썸네일.
          assets/events/{id}.jpg (160×160, 배너를 중앙 크롭) — 로드 실패 시 emoji 폴백.
          ⓘ 썸네일 원본(공식 배너, leekduck.com 경유 배포본)을 새로 받을 때:
            - 시즌 24 Twilight Trails : article-images/2026/2026-09-08-season-24-twilight-trails/season-24-twilight-trails.jpg
            - 시즌 25 Daydream Destinations : article-images/2026/2026-12-01-season-25-daydream-destinations/season-25-daydream-destinations.jpg
            - 트로피컬 파라다이스 : events/tropical-paradise-2026.jpg
            - GO 패스 12월 : article-images/2026/2026-12-01-go-pass-december-2026/go-pass-december-2026.jpg
            - 맥스배틀 데이(12/5) : article-images/2026/2026-12-05-gigantamax-inteleon-max-battle-day-2026/gigantamax-inteleon-max-battle-day.jpg
            - 12월 커뮤니티 데이 : article-images/2026/2026-12-12-december-communityday2026/december-2026-community-day.jpg
          (앞의 경로는 https://cdn.leekduck.com/assets/img/ 아래)
   ========================================================= */
(function (global) {
  'use strict';

  var E = function (id, title, start, end, category, opts) {
    var o = opts || {};
    return {
      id: id,
      title: title,
      start: start,
      end: end,
      category: category,
      badge: o.badge || '',
      emoji: o.emoji || '📅',
      pokemonId: o.pokemonId || null,
      thumb: o.thumb || '',
      desc: o.desc || '',
      tip: o.tip || '',
      priority: o.priority || 0,
      source: o.source || 'https://leekduck.com/events/'
    };
  };

  var EVENTS = [
    // ── 진행 중 (2026-11-25 현재) ─────────────────────────────
    // ── 지난 일정 (기록용) ──────────────────────────────────
    E('cresselia-darkrai', '크레세리아 · 다크라이 5성 레이드 (종료)', null, '2026-11-24T22:00:00+09:00', 'raid', {
      badge: '5성 레이드', emoji: '🌑', pokemonId: 488, priority: 0,
      desc: '황혼의 소원 초반부 5성 레이드였단다.\n다음 재등장을 기다려 보렴.',
      source: 'https://leekduck.com/events/cresselia-darkrai-in-5-star-raid-battles-november-2026/'
    }),
    E('max-monday-espurr', '다이맥스 냐스퍼 맥스 먼데이 (종료)', null, '2026-11-23T21:00:00+09:00', 'max', {
      badge: '맥스 먼데이', emoji: '💜', pokemonId: 677, priority: 0,
      desc: '11/23 맥스 먼데이 메인 다이맥스 보스였단다.',
      source: 'https://leekduck.com/events/max-mondays-2026-11-23/'
    }),

    E('deoxys-5star', '테오키스 4폼 5성 레이드', '2026-11-25T06:00:00+09:00', '2026-12-01T22:00:00+09:00', 'raid', {
      badge: '5성 레이드', emoji: '👾', pokemonId: 386, priority: 30,
      desc: '노말·어택·디펜스·스피드 4폼이 5성 레이드에 동시에 나온단다.\n어택폼은 물몸이고, 디펜스폼은 방어가 아주 높구나.',
      tip: '에스퍼 단일 타입이라 악·고스트·벌레로 두들겨 패면 된단다.\n2인 클리어도 되는 물량이란다.',
      source: 'https://leekduck.com/events/deoxys-normal-defense-attack-speed-formes-in-5-star-raid-battles-november-2026/'
    }),
    E('deoxys-raid-hour', '테오키스 레이드 아워 (오늘!)', '2026-11-25T18:00:00+09:00', '2026-11-25T19:00:00+09:00', 'raid', {
      badge: '레이드 아워', emoji: '⏰', pokemonId: 386, priority: 100,
      desc: '오늘 18:00~19:00, 모든 체육관 5성 레이드가 테오키스 4폼으로 바뀐단다.',
      tip: '무료 레이드 패스는 하루 1장, 전날 안 쓴 1장까지 합쳐 최대 2장이란다.\n17:50까지 체육관 앞에서 기다려 보렴.',
      source: 'https://leekduck.com/events/raidhour20261125/'
    }),
    E('mega-metagross', '메가메타그로스 메가 레이드', '2026-11-25T06:00:00+09:00', '2026-12-01T22:00:00+09:00', 'raid', {
      badge: '메가 레이드', emoji: '🦾', pokemonId: 10076, priority: 25,
      desc: '강철·에스퍼 복합이란다. 불꽃·땅·고스트·악이 약점이구나.',
      tip: '메가 에너지를 모아 두면 강철 타입 딜러로 오래 써먹을 수 있단다.',
      source: 'https://leekduck.com/events/mega-metagross-in-mega-raids-november-2026/'
    }),
    E('twilight-wishes', '황혼의 소원 (Twilight Wishes)', '2026-11-24T10:00:00+09:00', '2026-11-30T20:00:00+09:00', 'event', {
      badge: '메인 이벤트', emoji: '🌙', pokemonId: 197, priority: 40,
      desc: '해 스카프 에브이·달 스카프 블래키·록러프가 나오고, 별가사리와 엘리짐 이로치 확률이 올라간단다.',
      tip: 'GO패스 마일스톤을 채우면 교환 럭키 확률 업에 별의모래 2배 보너스까지 열린단다.',
      source: 'https://leekduck.com/events/twilight-wishes-2026/'
    }),
    E('shadow-tornadus', '그림자 토네로스 (화신 폼) 그림자 레이드', '2026-11-16T06:00:00+09:00', '2026-12-01T22:00:00+09:00', 'raid', {
      badge: '그림자 5성', emoji: '🌪️', pokemonId: 641, priority: 20,
      desc: '주말마다 5성 그림자 레이드로 나온단다.\n비행 단일 타입이구나.',
      tip: '그림자 포켓몬은 정화하면 능력치가 오르지만, 공격용으로는 그림자 그대로 쓰는 편이 세단다.',
      source: 'https://leekduck.com/events/shadow-tornadus-incarnate-forme-in-shadow-raids-november-16-2026/'
    }),

    // ── 예정 ─────────────────────────────────────────────────
    E('noibat-spotlight', '음뱃 스포트라이트 아워', '2026-11-26T18:00:00+09:00', '2026-11-26T19:00:00+09:00', 'spotlight', {
      badge: '스포트라이트', emoji: '🦇', pokemonId: 714, priority: 60,
      desc: '18:00~19:00 음뱃 대량 발생이란다.\n음번까지 진화하려면 사탕 400개가 필요하단다.',
      tip: '파인베리를 먹여 잡으면 사탕 2배라 진화용으로 딱이란다.\n이로치도 노려 볼 만하구나.',
      source: 'https://leekduck.com/events/pokemonspotlighthour2026-11-26/'
    }),
    E('clefable-raid-day', '메가픽시 슈퍼 메가 레이드 데이', '2026-11-28T14:00:00+09:00', '2026-11-28T17:00:00+09:00', 'raid', {
      badge: '슈퍼 메가 레이드 데이', emoji: '🌷', pokemonId: 10278, priority: 90,
      desc: '메가픽시(페어리·비행)가 포켓몬 GO에 처음 등장한단다.\n14:00~17:00 3시간 한정이구나.',
      tip: '체육관 돌리기로 레이드 패스 최대 6장, 티켓을 사면 14장까지란다.\n독·강철·전기·얼음·바위가 약점이란다.',
      source: 'https://leekduck.com/events/clefable-super-mega-raid-day-2026/'
    }),
    E('max-monday-cryogonal', '다이맥스 프리지오 맥스 먼데이', '2026-11-30T06:00:00+09:00', '2026-11-30T21:00:00+09:00', 'max', {
      badge: '맥스 먼데이', emoji: '❄️', pokemonId: 615, priority: 50,
      desc: '월요일 06:00~21:00 맥스배틀이 열린단다.\n이날 메인은 프리지오(얼음)란다.',
      tip: '18~19시에 파워스팟이 가장 많이 열린단다.\n불꽃·격투·바위·강철 다이맥스를 준비해 보렴.',
      source: 'https://leekduck.com/events/max-mondays-2026-11-30/'
    }),
    E('twilight-trails-end', '시즌 24 「Twilight Trails」 종료', null, '2026-12-01T10:00:00+09:00', 'event', {
      badge: '시즌', emoji: '🌆', thumb: 'assets/events/twilight-trails-end.jpg', priority: 35,
      desc: '황혼 시즌이 12월 1일 10:00에 끝난단다.\n시즌 리서치도 같이 사라지니 미리 챙기렴.',
      tip: '시즌 리서치·GO패스 보상은 끝나기 전에 받으렴.\n안 받으면 그대로 사라진단다.',
      source: 'https://leekduck.com/events/season-24-twilight-trails/'
    }),
    E('daydream-destinations', '새 시즌 「Daydream Destinations」 개막', '2026-12-01T10:00:00+09:00', '2027-03-01T10:00:00+09:00', 'event', {
      badge: '새 시즌', emoji: '🌅', thumb: 'assets/events/daydream-destinations.jpg', priority: 80,
      desc: '12월 1일 10:00부터 2027년 3월 1일 10:00까지 이어지는 새 시즌이란다.',
      tip: '시즌 첫날은 야생·레이드 로테이션이 한 번에 바뀌니까 10시 전후로 접속해 두렴.',
      source: 'https://leekduck.com/events/season-25-daydream-destinations/'
    }),
    E('tropical-paradise', '트로피컬 파라다이스', '2026-12-01T10:00:00+09:00', '2026-12-07T20:00:00+09:00', 'event', {
      badge: '메인 이벤트', emoji: '🏝️', thumb: 'assets/events/tropical-paradise.jpg', priority: 45,
      desc: '새 시즌 개막과 함께 시작하는 첫 이벤트란다.',
      tip: '이벤트가 시작되면 GO패스 12월 시즌도 같이 열린단다.',
      source: 'https://leekduck.com/events/tropical-paradise-2026/'
    }),
    E('go-pass-dec', 'GO 패스: 12월', '2026-12-01T10:00:00+09:00', '2027-01-05T10:00:00+09:00', 'event', {
      badge: 'GO 패스', emoji: '🎟️', thumb: 'assets/events/go-pass-dec.jpg', priority: 30,
      desc: '12월 GO 패스가 진행된단다.\n매일 미션을 채워 보상 트랙을 올려 보렴.',
      tip: 'GO 패스 델럭스는 별의모래·XP 보너스가 붙어서 육성 효율이 확 올라간단다.',
      source: 'https://leekduck.com/events/go-pass-december-2026/'
    }),
    E('regidrago', '레지드래고 5성 레이드', '2026-12-02T06:00:00+09:00', '2026-12-08T22:00:00+09:00', 'raid', {
      badge: '5성 레이드', emoji: '🐉', pokemonId: 895, priority: 55,
      desc: '드래곤 단일 타입 5성 레이드란다.\n얼음·드래곤·페어리가 약점이란다.',
      tip: '체력이 높아서 3인 이상을 권한단다.\n얼음 딜러는 최소 2마리 데려가렴.',
      source: 'https://leekduck.com/events/regidrago-in-5-star-raid-battles-december-2026/'
    }),
    E('regidrago-raid-hour', '레지드래고 레이드 아워', '2026-12-02T18:00:00+09:00', '2026-12-02T19:00:00+09:00', 'raid', {
      badge: '레이드 아워', emoji: '⏰', pokemonId: 895, priority: 70,
      desc: '12월 2일 18:00~19:00, 모든 체육관이 레지드래고로 바뀐단다.',
      tip: '레이드 아워는 1시간뿐이란다.\n17:40에 체육관 3~4개를 미리 찍어 두렴.',
      source: 'https://leekduck.com/events/raidhour20261202/'
    }),
    E('mega-slowbro', '메가야도란 메가 레이드', '2026-12-02T06:00:00+09:00', '2026-12-08T22:00:00+09:00', 'raid', {
      badge: '메가 레이드', emoji: '🛡️', pokemonId: 10071, priority: 35,
      desc: '물·에스퍼 복합이란다. 전기·풀·벌레·고스트·악이 약점이란다.',
      tip: '전기 딜러 한 마리면 2인도 가능한 수준이란다.',
      source: 'https://leekduck.com/events/mega-slowbro-in-mega-raids-december-2026/'
    }),
    E('shadow-dialga', '그림자 디아루가 그림자 레이드', '2026-12-02T06:00:00+09:00', '2027-01-05T22:00:00+09:00', 'raid', {
      badge: '그림자 5성', emoji: '⏳', pokemonId: 483, priority: 40,
      desc: '강철·드래곤 그림자 전설이란다.\n한 달 동안 주말 위주로 나온단다.',
      tip: '격투가 2.56배로 가장 잘 꽂히고 땅도 1.6배란다.\n그림자라 받는 피해가 아프니까 방어 위주로 가렴.',
      source: 'https://leekduck.com/events/shadow-dialga-in-shadow-raids-december-2026/'
    }),
    E('wimpod-spotlight', '꼬시레 스포트라이트 아워', '2026-12-03T18:00:00+09:00', '2026-12-03T19:00:00+09:00', 'spotlight', {
      badge: '스포트라이트', emoji: '🪲', pokemonId: 767, priority: 45,
      desc: '18:00~19:00 꼬시레 대량 발생에 사탕 2배까지란다.',
      tip: '꼬시레는 도망을 잘 가니까 파인베리를 꼭 먹이렴.',
      source: 'https://leekduck.com/events/pokemonspotlighthour2026-12-03/'
    }),
    E('max-battle-day', '거다이맥스 인텔리레온 맥스배틀 데이', '2026-12-05T14:00:00+09:00', '2026-12-05T17:00:00+09:00', 'max', {
      badge: '맥스배틀 데이', emoji: '💥', thumb: 'assets/events/max-battle-day.jpg', priority: 60,
      desc: '14:00~17:00 모든 파워스팟이 거다이맥스 배틀로 바뀐단다.\n6성 거다이맥스 인텔리레온(물 단일)이 이로치로 처음 나온다니 놓치지 보렴.',
      tip: '물 단일이라 풀·전기 맥스무브가 1.6배로 꽂힌단다.\n풀 타입은 물 공격도 반감하니까 다이맥스 풀 딜러 3마리로 가고, 이날 맥스파티클 한도는 1,600까지 열린단다.',
      source: 'https://leekduck.com/events/gigantamax-inteleon-max-battle-day-2026/'
    }),
    E('deino-max-monday', '다이맥스 모노두 맥스 먼데이', '2026-12-07T06:00:00+09:00', '2026-12-07T21:00:00+09:00', 'max', {
      badge: '맥스 먼데이', emoji: '🐲', pokemonId: 633, priority: 40,
      desc: '모노두(악·드래곤)가 맥스배틀 메인으로 나온단다.',
      tip: '다이맥스 삼삼드래는 악 타입 맥스무브로 레이드에서도 쓸 만하단다.',
      source: 'https://leekduck.com/events/max-mondays-2026-12-07/'
    }),
    E('dec-community-day', '12월 커뮤니티 데이 2026', '2026-12-12T14:00:00+09:00', '2026-12-13T17:00:00+09:00', 'community', {
      badge: '커뮤니티 데이', emoji: '🎉', thumb: 'assets/events/dec-community-day.jpg', priority: 75,
      desc: '12/12·13 이틀 모두 14:00~17:00 재등장이란다.\n토요일은 흥나숭·염버니·어리짱·팽도리 등, 일요일은 울머기·자망칼·조로아·드니차 등이 몰려온단다.',
      tip: '대도각참·드닐레이브·인텔리레온 전용 기술은 12/12 09:00~13 21:00 진화 창에만 배운단다.\n잡기 XP·별의모래 2배에 특별 교환 2회(별의모래 50% 할인)도 이 기간이니 챙기렴.',
      source: 'https://leekduck.com/events/december-communityday2026/'
    })
  ];

  global.HUB_EVENTS = EVENTS;

  global.HUB_META = {
    verifiedAt: '2026-11-25',
    verifiedFrom: 'leekduck.com/events/ (한국 시간 기준으로 변환)',
    disclaimer: '일정은 해외 공지 기반을 한국 시간으로 정리한 값이란다. 게임 내 공지와 다르면 게임이 우선이니, 게임 안 공지를 믿으렴.'
  };
})(window);
