/* 오박사의 포켓몬 백과사전 — 보스별 추천 카운터 TOP 6
   생성: tools/build_data.py · 원본: pogoapi.net(PvE 기술 위력·종족값) + PokeAPI(한국어 이름)
   · 순위는 같은 레벨(40) 기준 사이클 DPS와 내구를 합친 종합 지수(ER)로 계산한 추정값입니다.
   · tag: 메가 / 그림자 / 일반 · f·c 는 그 포켓몬의 졸업 기술(노말·스페셜)
   · fe·ce 가 1이면 엘리트(기술머신·이벤트 한정) 기술 */
window.HUB_RAID_TOP = {
  'deoxys-normal': [
    {n:'메가마기라스', tag:'메가', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:45.3, eff:1.6, score:100},
    {n:'메가팬텀', tag:'메가', t:['ghost', 'poison'], f:'핥기', fEn:'Lick', c:'섀도볼', cEn:'Shadow Ball', fe:1, ce:0, dps:53.3, eff:1.6, score:100},
    {n:'메가헤라크로스', tag:'메가', t:['bug', 'fighting'], f:'벌레의저항', fEn:'Struggle Bug', c:'메가혼', cEn:'Megahorn', fe:0, ce:0, dps:43.9, eff:1.6, score:89},
    {n:'그림자 마기라스', tag:'그림자', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:44.7, eff:1.6, score:88},
    {n:'루나아라', tag:'일반', t:['psychic', 'ghost'], f:'섀도클로', fEn:'Shadow Claw', c:'섀도볼', cEn:'Shadow Ball', fe:0, ce:0, dps:38.8, eff:1.6, score:82},
    {n:'무한다이노', tag:'일반', t:['poison', 'dragon'], f:'독찌르기', fEn:'Poison Jab', c:'다이맥스포', cEn:'Dynamax Cannon', fe:0, ce:1, dps:38.1, eff:1.0, score:80}
  ],
  'deoxys-attack': [
    {n:'메가팬텀', tag:'메가', t:['ghost', 'poison'], f:'핥기', fEn:'Lick', c:'섀도볼', cEn:'Shadow Ball', fe:1, ce:0, dps:112.1, eff:1.6, score:100},
    {n:'메가마기라스', tag:'메가', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:94.9, eff:1.6, score:100},
    {n:'메가헤라크로스', tag:'메가', t:['bug', 'fighting'], f:'벌레의저항', fEn:'Struggle Bug', c:'메가혼', cEn:'Megahorn', fe:0, ce:0, dps:92.9, eff:1.6, score:89},
    {n:'그림자 마기라스', tag:'그림자', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:93.5, eff:1.6, score:88},
    {n:'루나아라', tag:'일반', t:['psychic', 'ghost'], f:'섀도클로', fEn:'Shadow Claw', c:'섀도볼', cEn:'Shadow Ball', fe:0, ce:0, dps:81.1, eff:1.6, score:81},
    {n:'무한다이노', tag:'일반', t:['poison', 'dragon'], f:'독찌르기', fEn:'Poison Jab', c:'다이맥스포', cEn:'Dynamax Cannon', fe:0, ce:1, dps:80.2, eff:1.0, score:81}
  ],
  'deoxys-defense': [
    {n:'메가마기라스', tag:'메가', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:18.0, eff:1.6, score:100},
    {n:'메가팬텀', tag:'메가', t:['ghost', 'poison'], f:'핥기', fEn:'Lick', c:'섀도볼', cEn:'Shadow Ball', fe:1, ce:0, dps:20.9, eff:1.6, score:98},
    {n:'그림자 마기라스', tag:'그림자', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:17.8, eff:1.6, score:88},
    {n:'메가헤라크로스', tag:'메가', t:['bug', 'fighting'], f:'벌레의저항', fEn:'Struggle Bug', c:'메가혼', cEn:'Megahorn', fe:0, ce:0, dps:17.0, eff:1.6, score:86},
    {n:'루나아라', tag:'일반', t:['psychic', 'ghost'], f:'섀도클로', fEn:'Shadow Claw', c:'섀도볼', cEn:'Shadow Ball', fe:0, ce:0, dps:15.6, eff:1.6, score:82},
    {n:'무한다이노', tag:'일반', t:['poison', 'dragon'], f:'독찌르기', fEn:'Poison Jab', c:'다이맥스포', cEn:'Dynamax Cannon', fe:0, ce:1, dps:15.0, eff:1.0, score:79}
  ],
  'deoxys-speed': [
    {n:'메가마기라스', tag:'메가', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:26.0, eff:1.6, score:100},
    {n:'메가팬텀', tag:'메가', t:['ghost', 'poison'], f:'핥기', fEn:'Lick', c:'섀도볼', cEn:'Shadow Ball', fe:1, ce:0, dps:30.3, eff:1.6, score:99},
    {n:'그림자 마기라스', tag:'그림자', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:25.6, eff:1.6, score:88},
    {n:'메가헤라크로스', tag:'메가', t:['bug', 'fighting'], f:'벌레의저항', fEn:'Struggle Bug', c:'메가혼', cEn:'Megahorn', fe:0, ce:0, dps:24.8, eff:1.6, score:87},
    {n:'루나아라', tag:'일반', t:['psychic', 'ghost'], f:'섀도클로', fEn:'Shadow Claw', c:'섀도볼', cEn:'Shadow Ball', fe:0, ce:0, dps:22.3, eff:1.6, score:82},
    {n:'무한다이노', tag:'일반', t:['poison', 'dragon'], f:'독찌르기', fEn:'Poison Jab', c:'다이맥스포', cEn:'Dynamax Cannon', fe:0, ce:1, dps:21.7, eff:1.0, score:80}
  ],
  'mega-metagross': [
    {n:'메가그란돈', tag:'메가', t:['ground', 'fire'], f:'머드샷', fEn:'Mud Shot', c:'단애의칼', cEn:'Precipice Blades', fe:0, ce:1, dps:23.6, eff:1.6, score:100},
    {n:'메가리자몽 Y', tag:'메가', t:['fire', 'flying'], f:'회오리불꽃', fEn:'Fire Spin', c:'블라스트번', cEn:'Blast Burn', fe:0, ce:1, dps:22.7, eff:1.6, score:88},
    {n:'메가마기라스', tag:'메가', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:20.3, eff:1.6, score:87},
    {n:'레시라무', tag:'일반', t:['dragon', 'fire'], f:'불꽃엄니', fEn:'Fire Fang', c:'크로스플레임', cEn:'Fusion Flare', fe:0, ce:1, dps:20.3, eff:1.6, score:80},
    {n:'그림자 마기라스', tag:'그림자', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:20.0, eff:1.6, score:77},
    {n:'그림자 파이어', tag:'그림자', t:['fire', 'flying'], f:'회오리불꽃', fEn:'Fire Spin', c:'오버히트', cEn:'Overheat', fe:0, ce:0, dps:20.7, eff:1.6, score:75}
  ],
  'mega-clefable': [
    {n:'메가메타그로스', tag:'메가', t:['steel', 'psychic'], f:'불릿펀치', fEn:'Bullet Punch', c:'코멧펀치', cEn:'Meteor Mash', fe:0, ce:1, dps:28.3, eff:1.6, score:100},
    {n:'레지에레키', tag:'일반', t:['electric'], f:'록온', fEn:'Lock On', c:'썬더프리즌', cEn:'Thunder Cage', fe:0, ce:1, dps:33.4, eff:1.6, score:97},
    {n:'그림자 메타그로스', tag:'그림자', t:['steel', 'psychic'], f:'불릿펀치', fEn:'Bullet Punch', c:'코멧펀치', cEn:'Meteor Mash', fe:0, ce:1, dps:29.3, eff:1.6, score:94},
    {n:'메가마기라스', tag:'메가', t:['rock', 'dark'], f:'떨어뜨리기', fEn:'Smack Down', c:'스톤에지', cEn:'Stone Edge', fe:1, ce:0, dps:25.2, eff:1.6, score:91},
    {n:'무한다이노', tag:'일반', t:['poison', 'dragon'], f:'독찌르기', fEn:'Poison Jab', c:'오물폭탄', cEn:'Sludge Bomb', fe:0, ce:0, dps:25.3, eff:1.6, score:88},
    {n:'메가디안시', tag:'메가', t:['rock', 'fairy'], f:'돌떨구기', fEn:'Rock Throw', c:'스톤샤워', cEn:'Rock Slide', fe:0, ce:0, dps:28.1, eff:1.6, score:88}
  ],
  'cryogonal': [
    {n:'메가루카리오', tag:'메가', t:['fighting', 'steel'], f:'발경', fEn:'Force Palm', c:'파동탄', cEn:'Aura Sphere', fe:1, ce:0, dps:32.1, eff:1.6, score:100},
    {n:'메가리자몽 Y', tag:'메가', t:['fire', 'flying'], f:'회오리불꽃', fEn:'Fire Spin', c:'블라스트번', cEn:'Blast Burn', fe:0, ce:1, dps:29.4, eff:1.6, score:98},
    {n:'메가메타그로스', tag:'메가', t:['steel', 'psychic'], f:'불릿펀치', fEn:'Bullet Punch', c:'코멧펀치', cEn:'Meteor Mash', fe:0, ce:1, dps:26.8, eff:1.6, score:96},
    {n:'그림자 메타그로스', tag:'그림자', t:['steel', 'psychic'], f:'불릿펀치', fEn:'Bullet Punch', c:'코멧펀치', cEn:'Meteor Mash', fe:0, ce:1, dps:27.7, eff:1.6, score:90},
    {n:'레시라무', tag:'일반', t:['dragon', 'fire'], f:'불꽃엄니', fEn:'Fire Fang', c:'크로스플레임', cEn:'Fusion Flare', fe:0, ce:1, dps:26.2, eff:1.6, score:89},
    {n:'그림자 파이어', tag:'그림자', t:['fire', 'flying'], f:'회오리불꽃', fEn:'Fire Spin', c:'오버히트', cEn:'Overheat', fe:0, ce:0, dps:26.8, eff:1.6, score:84}
  ],
  'shadow-tornadus': [
    {n:'레지에레키', tag:'일반', t:['electric'], f:'록온', fEn:'Lock On', c:'썬더프리즌', cEn:'Thunder Cage', fe:0, ce:1, dps:40.8, eff:1.6, score:100},
    {n:'메가마기라스', tag:'메가', t:['rock', 'dark'], f:'떨어뜨리기', fEn:'Smack Down', c:'스톤에지', cEn:'Stone Edge', fe:1, ce:0, dps:30.7, eff:1.6, score:94},
    {n:'메가디안시', tag:'메가', t:['rock', 'fairy'], f:'돌떨구기', fEn:'Rock Throw', c:'스톤샤워', cEn:'Rock Slide', fe:0, ce:0, dps:34.3, eff:1.6, score:90},
    {n:'제크로무', tag:'일반', t:['dragon', 'electric'], f:'차지빔', fEn:'Charge Beam', c:'크로스썬더', cEn:'Fusion Bolt', fe:0, ce:1, dps:31.4, eff:1.6, score:88},
    {n:'메가전룡', tag:'메가', t:['electric', 'dragon'], f:'볼트체인지', fEn:'Volt Switch', c:'전자포', cEn:'Zap Cannon', fe:0, ce:0, dps:31.4, eff:1.6, score:88},
    {n:'그림자 썬더', tag:'그림자', t:['electric', 'flying'], f:'전기쇼크', fEn:'Thunder Shock', c:'전자포', cEn:'Zap Cannon', fe:1, ce:0, dps:32.8, eff:1.6, score:86}
  ],
  'regidrago': [
    {n:'무한다이노', tag:'일반', t:['poison', 'dragon'], f:'드래곤테일', fEn:'Dragon Tail', c:'다이맥스포', cEn:'Dynamax Cannon', fe:0, ce:1, dps:67.4, eff:1.6, score:100},
    {n:'메가레쿠쟈', tag:'메가', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'와이드브레이커', cEn:'Breaking Swipe', fe:0, ce:1, dps:63.2, eff:1.6, score:92},
    {n:'메가한카리아스', tag:'메가', t:['dragon', 'ground'], f:'드래곤테일', fEn:'Dragon Tail', c:'와이드브레이커', cEn:'Breaking Swipe', fe:0, ce:0, dps:57.2, eff:1.6, score:85},
    {n:'메가보만다', tag:'메가', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'용성군', cEn:'Draco Meteor', fe:0, ce:0, dps:55.0, eff:1.6, score:83},
    {n:'그림자 보만다', tag:'그림자', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'용성군', cEn:'Draco Meteor', fe:0, ce:0, dps:59.2, eff:1.6, score:77},
    {n:'그림자 망나뇽', tag:'그림자', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'용성군', cEn:'Draco Meteor', fe:0, ce:1, dps:56.4, eff:1.6, score:76}
  ],
  'mega-slowbro': [
    {n:'메가마기라스', tag:'메가', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:22.3, eff:1.6, score:100},
    {n:'메가팬텀', tag:'메가', t:['ghost', 'poison'], f:'핥기', fEn:'Lick', c:'섀도볼', cEn:'Shadow Ball', fe:1, ce:0, dps:26.0, eff:1.6, score:99},
    {n:'메가나무킹', tag:'메가', t:['grass', 'dragon'], f:'연속자르기', fEn:'Fury Cutter', c:'하드플랜트', cEn:'Frenzy Plant', fe:0, ce:1, dps:25.5, eff:1.6, score:98},
    {n:'레지에레키', tag:'일반', t:['electric'], f:'록온', fEn:'Lock On', c:'썬더프리즌', cEn:'Thunder Cage', fe:0, ce:1, dps:27.1, eff:1.6, score:97},
    {n:'그림자 마기라스', tag:'그림자', t:['rock', 'dark'], f:'물기', fEn:'Bite', c:'세차게휘두르기', cEn:'Brutal Swing', fe:0, ce:0, dps:22.0, eff:1.6, score:88},
    {n:'제크로무', tag:'일반', t:['dragon', 'electric'], f:'차지빔', fEn:'Charge Beam', c:'크로스썬더', cEn:'Fusion Bolt', fe:0, ce:1, dps:20.8, eff:1.6, score:86}
  ],
  'shadow-dialga': [
    {n:'메가그란돈', tag:'메가', t:['ground', 'fire'], f:'머드샷', fEn:'Mud Shot', c:'단애의칼', cEn:'Precipice Blades', fe:0, ce:1, dps:31.2, eff:1.6, score:100},
    {n:'메가루카리오', tag:'메가', t:['fighting', 'steel'], f:'발경', fEn:'Force Palm', c:'파동탄', cEn:'Aura Sphere', fe:1, ce:0, dps:33.0, eff:1.6, score:91},
    {n:'메가한카리아스', tag:'메가', t:['dragon', 'ground'], f:'머드샷', fEn:'Mud Shot', c:'지진', cEn:'Earthquake', fe:0, ce:0, dps:27.6, eff:1.6, score:86},
    {n:'그란돈', tag:'일반', t:['ground'], f:'머드샷', fEn:'Mud Shot', c:'단애의칼', cEn:'Precipice Blades', fe:0, ce:1, dps:24.6, eff:1.6, score:75},
    {n:'테라키온', tag:'일반', t:['rock', 'fighting'], f:'두번차기', fEn:'Double Kick', c:'성스러운칼', cEn:'Sacred Sword', fe:0, ce:1, dps:24.4, eff:1.6, score:72},
    {n:'그림자 맘모꾸리', tag:'그림자', t:['ice', 'ground'], f:'진흙뿌리기', fEn:'Mud Slap', c:'10만마력', cEn:'High Horsepower', fe:0, ce:0, dps:26.1, eff:1.6, score:71}
  ],
  'palkia': [
    {n:'무한다이노', tag:'일반', t:['poison', 'dragon'], f:'드래곤테일', fEn:'Dragon Tail', c:'다이맥스포', cEn:'Dynamax Cannon', fe:0, ce:1, dps:34.4, eff:1.6, score:100},
    {n:'메가레쿠쟈', tag:'메가', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'와이드브레이커', cEn:'Breaking Swipe', fe:0, ce:1, dps:32.4, eff:1.6, score:92},
    {n:'메가한카리아스', tag:'메가', t:['dragon', 'ground'], f:'드래곤테일', fEn:'Dragon Tail', c:'와이드브레이커', cEn:'Breaking Swipe', fe:0, ce:0, dps:29.3, eff:1.6, score:86},
    {n:'메가보만다', tag:'메가', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'용성군', cEn:'Draco Meteor', fe:0, ce:0, dps:28.1, eff:1.6, score:83},
    {n:'그림자 보만다', tag:'그림자', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'용성군', cEn:'Draco Meteor', fe:0, ce:0, dps:30.3, eff:1.6, score:77},
    {n:'그림자 망나뇽', tag:'그림자', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'용성군', cEn:'Draco Meteor', fe:0, ce:1, dps:28.9, eff:1.6, score:76}
  ],
  'mega-dragonite': [
    {n:'무한다이노', tag:'일반', t:['poison', 'dragon'], f:'드래곤테일', fEn:'Dragon Tail', c:'다이맥스포', cEn:'Dynamax Cannon', fe:0, ce:1, dps:29.5, eff:1.6, score:100},
    {n:'그림자 포푸니라', tag:'그림자', t:['dark', 'ice'], f:'얼음뭉치', fEn:'Ice Shard', c:'눈사태', cEn:'Avalanche', fe:0, ce:0, dps:32.5, eff:2.56, score:92},
    {n:'메가레쿠쟈', tag:'메가', t:['dragon', 'flying'], f:'드래곤테일', fEn:'Dragon Tail', c:'와이드브레이커', cEn:'Breaking Swipe', fe:0, ce:1, dps:27.7, eff:1.6, score:92},
    {n:'그림자 맘모꾸리', tag:'그림자', t:['ice', 'ground'], f:'눈싸라기', fEn:'Powder Snow', c:'눈사태', cEn:'Avalanche', fe:0, ce:0, dps:30.8, eff:2.56, score:91},
    {n:'드닐레이브', tag:'일반', t:['dragon', 'ice'], f:'얼음엄니', fEn:'Ice Fang', c:'눈보라', cEn:'Blizzard', fe:0, ce:0, dps:28.3, eff:2.56, score:90},
    {n:'큐레무', tag:'일반', t:['dragon', 'ice'], f:'용의숨결', fEn:'Dragon Breath', c:'얼어붙은세계', cEn:'Glaciate', fe:0, ce:1, dps:26.9, eff:2.56, score:87}
  ]
};
