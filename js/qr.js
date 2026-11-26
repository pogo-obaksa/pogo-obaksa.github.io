/* =========================================================
   오박사의 포켓몬 백과사전 — 자체 QR 코드 생성기 (외부 라이브러리 없음)
   - 바이트 모드, 오류 정정 레벨 M(기본)·L, 버전 1~6 (최대 106바이트)
   - 트레이너 코드 12자리 같은 짧은 문자열을 canvas 에 그린다
   - 쓰는 법: PGOQR.draw(canvasEl, "123456789012", { scale: 6, quiet: 4 })
             PGOQR.make("123456789012")  → { size, modules } (테스트용)
   ========================================================= */
(function () {
  'use strict';

  /* 오류 정정 레벨별: 블록당 ECC 코드워드 수 / 블록 수 (버전 1~6) */
  var ECC = {
    L: { perBlock: [7, 10, 15, 20, 26, 18], blocks: [1, 1, 1, 1, 1, 2] },
    M: { perBlock: [10, 16, 26, 18, 24, 16], blocks: [1, 1, 1, 2, 2, 4] }
  };
  var FORMAT_BITS = { L: 1, M: 0 };
  var ALIGN = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];
  var MAX_VER = 6;

  function numRawDataModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var na = Math.floor(ver / 7) + 2;
      r -= (25 * na - 10) * na - 55;
    }
    if (ver >= 7) r -= 36;
    return r;
  }

  function totalCodewords(ver) { return Math.floor(numRawDataModules(ver) / 8); }

  function dataCodewords(ver, ecl) {
    return totalCodewords(ver) - ECC[ecl].perBlock[ver - 1] * ECC[ecl].blocks[ver - 1];
  }

  /* ── GF(256) · 리드솔로몬 ── */
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xFF;
  }

  function rsDivisor(degree) {
    var result = [];
    for (var i = 0; i < degree; i++) result.push(0);
    result[degree - 1] = 1;
    var root = 1;
    for (var k = 0; k < degree; k++) {
      for (var j = 0; j < degree; j++) {
        result[j] = gfMul(result[j], root);
        if (j + 1 < degree) result[j] ^= result[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return result;
  }

  function rsRemainder(data, divisor) {
    var result = [];
    for (var i = 0; i < divisor.length; i++) result.push(0);
    for (var d = 0; d < data.length; d++) {
      var factor = data[d] ^ result.shift();
      result.push(0);
      for (var j = 0; j < divisor.length; j++) result[j] ^= gfMul(divisor[j], factor);
    }
    return result;
  }

  /* ── 비트 버퍼 ── */
  function BitBuffer() { this.bits = []; }
  BitBuffer.prototype.append = function (val, len) {
    for (var i = len - 1; i >= 0; i--) this.bits.push((val >>> i) & 1);
  };
  BitBuffer.prototype.length = function () { return this.bits.length; };

  function utf8Bytes(str) {
    var out = [];
    var s = String(str);
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) {
        out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      } else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
        var c2 = s.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      } else {
        out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      }
    }
    return out;
  }

  function encodeData(text, ecl) {
    var bytes = utf8Bytes(text);
    var ver = 1;
    var capacityBits = 0;
    for (; ver <= MAX_VER; ver++) {
      capacityBits = dataCodewords(ver, ecl) * 8;
      if (4 + 8 + bytes.length * 8 <= capacityBits) break;
    }
    if (ver > MAX_VER) throw new Error('QR: 데이터가 너무 깁니다 (버전 ' + MAX_VER + '까지 지원)');

    var bb = new BitBuffer();
    bb.append(0x4, 4);               /* 바이트 모드 */
    bb.append(bytes.length, 8);      /* 문자 수 (버전 1~9: 8비트) */
    for (var i = 0; i < bytes.length; i++) bb.append(bytes[i], 8);

    /* 종료자 + 바이트 정렬 */
    var term = Math.min(4, capacityBits - bb.length());
    bb.append(0, term);
    while (bb.length() % 8 !== 0) bb.bits.push(0);

    /* 패드 코드워드 0xEC, 0x11 */
    var pad = [0xEC, 0x11];
    var pi = 0;
    while (bb.length() < capacityBits) {
      bb.append(pad[pi], 8);
      pi = (pi + 1) % 2;
    }

    var data = [];
    for (var b = 0; b < bb.length(); b += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bb.bits[b + k];
      data.push(v);
    }

    /* 블록 분할 */
    var numBlocks = ECC[ecl].blocks[ver - 1];
    var eccLen = ECC[ecl].perBlock[ver - 1];
    var rawCodewords = totalCodewords(ver);
    var numShort = numBlocks - (rawCodewords % numBlocks);
    var shortLen = Math.floor(rawCodewords / numBlocks);
    var blocks = [];
    var div = rsDivisor(eccLen);
    var offset = 0;
    for (var bi = 0; bi < numBlocks; bi++) {
      var datLen = shortLen - eccLen + (bi < numShort ? 0 : 1);
      var dat = data.slice(offset, offset + datLen);
      offset += datLen;
      blocks.push({ data: dat, ecc: rsRemainder(dat, div) });
    }

    /* 인터리브 */
    var out = [];
    var maxData = shortLen - eccLen + 1;
    for (var col = 0; col < maxData; col++) {
      for (var b2 = 0; b2 < numBlocks; b2++) {
        if (col < blocks[b2].data.length) out.push(blocks[b2].data[col]);
      }
    }
    for (var col2 = 0; col2 < eccLen; col2++) {
      for (var b3 = 0; b3 < numBlocks; b3++) out.push(blocks[b3].ecc[col2]);
    }
    return { ver: ver, codewords: out };
  }

  /* ── 심볼 그리기 ── */
  function buildMatrix(text, ecl) {
    var enc = encodeData(text, ecl);
    var ver = enc.ver;
    var size = ver * 4 + 17;
    var modules = [];
    var isFunc = [];
    for (var y = 0; y < size; y++) {
      modules.push(new Array(size).fill(false));
      isFunc.push(new Array(size).fill(false));
    }

    function setFn(x, yy, dark) {
      if (x < 0 || yy < 0 || x >= size || yy >= size) return;
      modules[yy][x] = !!dark;
      isFunc[yy][x] = true;
    }

    /* 타이밍 패턴 */
    for (var i = 0; i < size; i++) {
      setFn(6, i, i % 2 === 0);
      setFn(i, 6, i % 2 === 0);
    }

    /* 파인더 패턴 3개 (+ 분리자) */
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (pos) {
      for (var dy = -4; dy <= 4; dy++) {
        for (var dx = -4; dx <= 4; dx++) {
          var dist = Math.max(Math.abs(dx), Math.abs(dy));
          setFn(pos[0] + dx, pos[1] + dy, dist !== 2 && dist !== 4);
        }
      }
    });

    /* 얼라인먼트 패턴 */
    var al = ALIGN[ver - 1] || [];
    for (var ai = 0; ai < al.length; ai++) {
      for (var aj = 0; aj < al.length; aj++) {
        var ax = al[ai], ay = al[aj];
        if ((ax === 6 && ay === 6) || (ax === 6 && ay === size - 7) || (ax === size - 7 && ay === 6)) continue;
        for (var ddy = -2; ddy <= 2; ddy++) {
          for (var ddx = -2; ddx <= 2; ddx++) {
            setFn(ax + ddx, ay + ddy, Math.max(Math.abs(ddx), Math.abs(ddy)) !== 1);
          }
        }
      }
    }

    /* 포맷 정보 영역 예약 (값은 마스크 선택 뒤에 씀) */
    function reserveFormat() {
      for (var k = 0; k <= 5; k++) setFn(8, k, false);
      setFn(8, 7, false); setFn(8, 8, false); setFn(7, 8, false);
      for (var k2 = 9; k2 < 15; k2++) setFn(14 - k2, 8, false);
      for (var k3 = 0; k3 < 8; k3++) setFn(size - 1 - k3, 8, false);
      for (var k4 = 8; k4 < 15; k4++) setFn(8, size - 15 + k4, false);
      setFn(8, size - 8, true); /* 항상 어두운 모듈 */
    }
    reserveFormat();

    /* 데이터 배치 (지그재그) */
    var bits = [];
    for (var cw = 0; cw < enc.codewords.length; cw++) {
      for (var b = 7; b >= 0; b--) bits.push((enc.codewords[cw] >>> b) & 1);
    }
    var idx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var upward = ((right + 1) & 2) === 0;
          var yy = upward ? size - 1 - vert : vert;
          if (!isFunc[yy][x] && idx < bits.length) {
            modules[yy][x] = bits[idx] === 1;
            idx++;
          }
        }
      }
    }

    function formatBits(mask) {
      var data = (FORMAT_BITS[ecl] << 3) | mask;
      var rem = data;
      for (var r = 0; r < 10; r++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      return ((data << 10) | rem) ^ 0x5412;
    }

    function applyMask(mask) {
      for (var yy = 0; yy < size; yy++) {
        for (var x = 0; x < size; x++) {
          if (isFunc[yy][x]) continue;
          var invert;
          switch (mask) {
            case 0: invert = (x + yy) % 2 === 0; break;
            case 1: invert = yy % 2 === 0; break;
            case 2: invert = x % 3 === 0; break;
            case 3: invert = (x + yy) % 3 === 0; break;
            case 4: invert = (Math.floor(yy / 2) + Math.floor(x / 3)) % 2 === 0; break;
            case 5: invert = ((x * yy) % 2) + ((x * yy) % 3) === 0; break;
            case 6: invert = (((x * yy) % 2) + ((x * yy) % 3)) % 2 === 0; break;
            default: invert = (((x + yy) % 2) + ((x * yy) % 3)) % 2 === 0; break;
          }
          if (invert) modules[yy][x] = !modules[yy][x];
        }
      }
    }

    function writeFormat(mask) {
      var bits15 = formatBits(mask);
      function bit(n) { return ((bits15 >>> n) & 1) !== 0; }
      for (var i2 = 0; i2 <= 5; i2++) setFn(8, i2, bit(i2));
      setFn(8, 7, bit(6));
      setFn(8, 8, bit(7));
      setFn(7, 8, bit(8));
      for (var i3 = 9; i3 < 15; i3++) setFn(14 - i3, 8, bit(i3));
      for (var i4 = 0; i4 < 8; i4++) setFn(size - 1 - i4, 8, bit(i4));
      for (var i5 = 8; i5 < 15; i5++) setFn(8, size - 15 + i5, bit(i5));
      setFn(8, size - 8, true);
    }

    function penalty() {
      var score = 0;
      var x, y, run, dark;
      /* N1: 가로·세로 5칸 이상 같은 색 */
      for (y = 0; y < size; y++) {
        run = 1;
        for (x = 1; x < size; x++) {
          if (modules[y][x] === modules[y][x - 1]) {
            run++;
            if (run === 5) score += 3; else if (run > 5) score += 1;
          } else run = 1;
        }
      }
      for (x = 0; x < size; x++) {
        run = 1;
        for (y = 1; y < size; y++) {
          if (modules[y][x] === modules[y - 1][x]) {
            run++;
            if (run === 5) score += 3; else if (run > 5) score += 1;
          } else run = 1;
        }
      }
      /* N2: 2×2 같은 색 블록 */
      for (y = 0; y < size - 1; y++) {
        for (x = 0; x < size - 1; x++) {
          var c = modules[y][x];
          if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
        }
      }
      /* N3: 1:1:3:1:1 무늬 */
      var pat = [true, false, true, true, true, false, true];
      function matches(get, start) {
        for (var q = 0; q < 7; q++) if (get(start + q) !== pat[q]) return false;
        var before = true, after = true;
        for (var b = 1; b <= 4; b++) {
          if (start - b >= 0 && get(start - b)) before = false;
          if (start + 6 + b < size && get(start + 6 + b)) after = false;
        }
        return before || after;
      }
      for (y = 0; y < size; y++) {
        for (x = 0; x + 7 <= size; x++) {
          if (matches(function (n) { return modules[y][n]; }, x)) score += 40;
        }
      }
      for (x = 0; x < size; x++) {
        for (y = 0; y + 7 <= size; y++) {
          if (matches(function (n) { return modules[n][x]; }, y)) score += 40;
        }
      }
      /* N4: 어두운 모듈 비율 */
      dark = 0;
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (modules[y][x]) dark++;
      var ratio = Math.abs((dark * 100 / (size * size)) - 50);
      score += Math.floor(ratio / 5) * 10;
      return score;
    }

    var best = null, bestScore = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var copy = modules.map(function (row) { return row.slice(); });
      var copyFn = isFunc;
      /* 임시로 모듈판을 바꿔 마스크·포맷을 적용하고 점수를 잰다 */
      var saved = modules;
      modules = copy;
      applyMask(mask);
      writeFormat(mask);
      var sc = penalty();
      if (sc < bestScore) { bestScore = sc; best = copy.map(function (row) { return row.slice(); }); }
      modules = saved;
      isFunc = copyFn;
    }

    return { size: size, modules: best, version: ver, mask: bestScore };
  }

  function draw(canvas, text, opts) {
    if (!canvas || !canvas.getContext) return false;
    opts = opts || {};
    var ecl = ECC[opts.ecl] ? opts.ecl : 'M';
    var mat = buildMatrix(text, ecl);
    var quiet = opts.quiet == null ? 4 : opts.quiet;
    var total = mat.size + quiet * 2;
    var scale = opts.scale || Math.max(1, Math.floor((opts.size || 220) / total));
    var px = total * scale;
    var dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(px * dpr);
    canvas.height = Math.round(px * dpr);
    canvas.style.width = px + 'px';
    canvas.style.height = px + 'px';

    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = '#0F172A';
    for (var y = 0; y < mat.size; y++) {
      for (var x = 0; x < mat.size; x++) {
        if (mat.modules[y][x]) {
          ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
        }
      }
    }
    return mat;
  }

  window.PGOQR = {
    make: function (text, ecl) { return buildMatrix(String(text), ECC[ecl] ? ecl : 'M'); },
    draw: draw
  };
})();
