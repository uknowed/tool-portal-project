// Circuit simulator: place a battery, wires, switches and bulbs on a
// breadboard, then work out which bulbs light up.
(function () {
  'use strict';

  // ---------- Board layout ----------
  // The board has COLS columns and two halves (top and bottom) of 5 rows each.
  // Like a real breadboard, the 5 holes in one column of one half are joined
  // underneath: that group of holes is called a "strip".
  var COLS = 12;
  var ROWS = 5;
  var GAP = 28;        // distance between neighbouring holes
  var PAD = 26;        // margin around the holes
  var CHANNEL = 26;    // extra space for the groove between the two halves
  var WIDTH = PAD * 2 + (COLS - 1) * GAP;
  var HEIGHT = PAD * 2 + (ROWS * 2 - 1) * GAP + CHANNEL;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var NAMES = { battery: 'battery', wire: 'wire', switch: 'switch', bulb: 'bulb' };

  // ---------- State ----------
  var parts = [];       // { id, type, a: hole, b: hole, closed }
  var nextId = 1;
  var tool = 'wire';
  var pending = null;   // first hole tapped while placing a part
  var message = '';     // one-off message for the hint line

  var svg = document.getElementById('board');
  var hintEl = document.getElementById('hint');
  var statusEl = document.getElementById('status');
  var partsLayer;
  var holeEls = {};

  // ---------- Helpers ----------
  function el(name, attrs, parent) {
    var node = document.createElementNS(SVGNS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function holeKey(h) { return h.half + '-' + h.col + '-' + h.row; }
  function stripOf(h) { return h.half + '-' + h.col; }

  function holeXY(h) {
    // Bottom-half holes sit below the top half plus the centre groove.
    var y = PAD + h.row * GAP + (h.half === 1 ? ROWS * GAP + CHANNEL : 0);
    return { x: PAD + h.col * GAP, y: y };
  }

  function partAt(h) {
    var key = holeKey(h);
    for (var i = 0; i < parts.length; i++) {
      if (holeKey(parts[i].a) === key || holeKey(parts[i].b) === key) return parts[i];
    }
    return null;
  }

  function findPart(id) {
    for (var i = 0; i < parts.length; i++) if (parts[i].id === id) return parts[i];
    return null;
  }

  // ---------- Simulation ----------
  // Every strip is a "node": a point where things are electrically joined.
  // Wires and closed switches join two nodes into one. Then a bulb lights if
  // it sits on some path from the battery's + node to its − node.
  function analyse(list, allSwitchesClosed) {
    var parentOf = {};
    function find(x) {
      if (parentOf[x] === undefined) parentOf[x] = x;
      while (parentOf[x] !== x) {
        parentOf[x] = parentOf[parentOf[x]];
        x = parentOf[x];
      }
      return x;
    }
    function join(a, b) {
      a = find(a); b = find(b);
      if (a !== b) parentOf[a] = b;
    }

    var battery = null;
    var bulbs = [];
    list.forEach(function (p) {
      var na = stripOf(p.a), nb = stripOf(p.b);
      find(na); find(nb);
      if (p.type === 'wire' || (p.type === 'switch' && (p.closed || allSwitchesClosed))) {
        join(na, nb);
      } else if (p.type === 'battery') {
        battery = p;
      } else if (p.type === 'bulb') {
        bulbs.push(p);
      }
    });

    var result = { hasBattery: !!battery, bulbCount: bulbs.length, short: false, lit: {}, litCount: 0 };
    if (!battery) return result;

    var plus = find(stripOf(battery.a));
    var minus = find(stripOf(battery.b));
    if (plus === minus) {
      // + and − are joined with nothing in between: a short circuit.
      result.short = true;
      return result;
    }

    // Bulbs are the connections ("edges") between nodes. A bulb whose two
    // legs end up in the same node is bypassed, so it can never light.
    var edges = [];
    bulbs.forEach(function (b) {
      var u = find(stripOf(b.a)), v = find(stripOf(b.b));
      if (u !== v) edges.push({ id: b.id, u: u, v: v });
    });
    var links = {};
    edges.forEach(function (e, i) {
      (links[e.u] = links[e.u] || []).push({ to: e.v, edge: i });
      (links[e.v] = links[e.v] || []).push({ to: e.u, edge: i });
    });

    // Try every route from + to − (the board is small, so this is quick)
    // and mark each bulb that is on at least one complete route.
    var onRoute = edges.map(function () { return false; });
    var visited = {};
    var route = [];
    var steps = 0;
    function explore(node) {
      if (++steps > 50000) return;
      if (node === minus) {
        route.forEach(function (i) { onRoute[i] = true; });
        return;
      }
      visited[node] = true;
      (links[node] || []).forEach(function (link) {
        if (!visited[link.to]) {
          route.push(link.edge);
          explore(link.to);
          route.pop();
        }
      });
      visited[node] = false;
    }
    explore(plus);

    edges.forEach(function (e, i) {
      if (onRoute[i]) {
        result.lit[e.id] = true;
        result.litCount++;
      }
    });
    return result;
  }

  // ---------- Drawing the board ----------
  function drawBoard() {
    svg.setAttribute('viewBox', '0 0 ' + WIDTH + ' ' + HEIGHT);
    el('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, rx: 14, 'class': 'board-bg' }, svg);

    var channelY = PAD + (ROWS - 1) * GAP + GAP / 2 + 4;
    el('rect', { x: 8, y: channelY, width: WIDTH - 16, height: CHANNEL - 8, rx: 4, 'class': 'channel' }, svg);

    var holesLayer = el('g', {}, svg);
    for (var half = 0; half < 2; half++) {
      for (var col = 0; col < COLS; col++) {
        var top = holeXY({ half: half, col: col, row: 0 });
        // Shaded strip shows which holes are joined.
        el('rect', {
          x: top.x - 10, y: top.y - 10, width: 20, height: (ROWS - 1) * GAP + 20,
          rx: 10, 'class': 'strip'
        }, holesLayer);
        for (var row = 0; row < ROWS; row++) {
          var h = { half: half, col: col, row: row };
          var p = holeXY(h);
          var key = holeKey(h);
          el('circle', { cx: p.x, cy: p.y, r: GAP / 2, 'class': 'hole-hit', 'data-hole': key }, holesLayer);
          holeEls[key] = el('circle', { cx: p.x, cy: p.y, r: 4.5, 'class': 'hole' }, holesLayer);
        }
      }
    }
    partsLayer = el('g', {}, svg);
  }

  // Draws one part. It is drawn along the x axis between its two legs, then
  // rotated into place, so diagonal parts work too.
  function drawPart(p, lit) {
    var a = holeXY(p.a), b = holeXY(p.b);
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var len = Math.hypot(b.x - a.x, b.y - a.y);
    var angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    var half = len / 2;

    var g = el('g', {
      'class': 'part ' + p.type + (lit ? ' is-lit' : ''),
      'data-part': p.id,
      transform: 'translate(' + mx + ' ' + my + ') rotate(' + angle + ')'
    }, partsLayer);

    function leads(inner) {
      if (half > inner) {
        el('line', { x1: -half, y1: 0, x2: -inner, y2: 0, 'class': 'lead-line' }, g);
        el('line', { x1: inner, y1: 0, x2: half, y2: 0, 'class': 'lead-line' }, g);
      }
    }

    if (p.type === 'wire') {
      el('line', { x1: -half, y1: 0, x2: half, y2: 0, 'class': 'wire-line' }, g);
    } else if (p.type === 'battery') {
      leads(17);
      el('rect', { x: -17, y: -11, width: 34, height: 22, rx: 4, 'class': 'battery-body' }, g);
      // Labels are turned back upright so they never read upside down.
      [['+', -9], ['−', 9]].forEach(function (pair) {
        var t = el('text', {
          x: pair[1], y: 0, 'class': 'battery-text',
          'text-anchor': 'middle', 'dominant-baseline': 'central',
          transform: 'rotate(' + (-angle) + ' ' + pair[1] + ' 0)'
        }, g);
        t.textContent = pair[0];
      });
    } else if (p.type === 'bulb') {
      leads(12);
      el('circle', { cx: 0, cy: 0, r: 12, 'class': 'bulb-glass' }, g);
      el('path', { d: 'M -6 3 L -3 -4 L 0 3 L 3 -4 L 6 3', 'class': 'bulb-filament' }, g);
    } else if (p.type === 'switch') {
      leads(12);
      el('circle', { cx: -12, cy: 0, r: 3.5, 'class': 'contact' }, g);
      el('circle', { cx: 12, cy: 0, r: 3.5, 'class': 'contact' }, g);
      var end = p.closed ? { x: 12, y: 0 } : { x: 8, y: -13 };
      el('line', { x1: -12, y1: 0, x2: end.x, y2: end.y, 'class': 'switch-line' }, g);
      el('rect', { x: -17, y: -18, width: 34, height: 30, 'class': 'switch-hit', 'data-switch': p.id }, g);
    }

    el('circle', { cx: -half, cy: 0, r: 4, 'class': 'leg' }, g);
    el('circle', { cx: half, cy: 0, r: 4, 'class': 'leg' }, g);
  }

  // ---------- Updating the page ----------
  function render() {
    var result = analyse(parts, false);

    while (partsLayer.firstChild) partsLayer.removeChild(partsLayer.firstChild);
    // Wires first so the other parts sit on top of them.
    parts.filter(function (p) { return p.type === 'wire'; })
      .concat(parts.filter(function (p) { return p.type !== 'wire'; }))
      .forEach(function (p) { drawPart(p, !!result.lit[p.id]); });

    for (var key in holeEls) {
      var isPending = pending && holeKey(pending) === key;
      holeEls[key].classList.toggle('is-pending', !!isPending);
      holeEls[key].setAttribute('r', isPending ? 7 : 4.5);
    }

    svg.classList.toggle('mode-erase', tool === 'erase');
    hintEl.textContent = message || hintText();
    setStatus(result);
  }

  function hintText() {
    if (tool === 'erase') return 'Tap a part to remove it.';
    if (tool === 'battery') {
      return pending ? 'Now tap a hole for the − (minus) end.' : 'Tap a hole for the + (plus) end of the battery.';
    }
    return pending
      ? 'Now tap a second hole for the other leg of the ' + NAMES[tool] + '.'
      : 'Tap a hole for the first leg of the ' + NAMES[tool] + '.';
  }

  function setStatus(r) {
    var text, kind = '';
    if (!parts.length) {
      text = 'The board is empty. Start by placing a battery.';
    } else if (!r.hasBattery) {
      text = 'No power yet: add a battery.';
    } else if (r.short) {
      text = 'Short circuit! A wire or closed switch joins + straight to −, so the current bypasses the bulb. Nothing lights.';
      kind = 'warn';
    } else if (!r.bulbCount) {
      text = 'Add a bulb to see if your circuit works.';
    } else if (r.litCount === r.bulbCount) {
      text = r.bulbCount === 1 ? 'Circuit complete: the bulb is on.' : 'Circuit complete: all ' + r.bulbCount + ' bulbs are on.';
      kind = 'ok';
    } else if (r.litCount > 0) {
      text = r.litCount + ' of ' + r.bulbCount + ' bulbs are on. The others are not in a full loop.';
      kind = 'ok';
    } else {
      var ifClosed = analyse(parts, true);
      if (!ifClosed.short && ifClosed.litCount > 0) {
        text = 'Circuit open: check the switch.';
      } else {
        text = 'Circuit open: there’s a gap. Current needs a full loop from + back to −.';
      }
    }
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' is-' + kind : '');
  }

  // ---------- Interaction ----------
  function selectTool(name) {
    tool = name;
    pending = null;
    message = '';
    var buttons = document.querySelectorAll('.tool-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-tool') === name ? 'true' : 'false');
    }
    render();
  }

  function parseHole(key) {
    var bits = key.split('-').map(Number);
    return { half: bits[0], col: bits[1], row: bits[2] };
  }

  function tapHole(h) {
    message = '';
    if (tool === 'erase') {
      var p = partAt(h);
      if (p) removePart(p.id);
      render();
      return;
    }
    if (partAt(h)) {
      message = 'That hole is already used. Pick an empty hole.';
      render();
      return;
    }
    if (!pending) {
      if (tool === 'battery' && parts.some(function (p) { return p.type === 'battery'; })) {
        message = 'There is already a battery. Use the Eraser to remove it first.';
        render();
        return;
      }
      pending = h;
    } else if (holeKey(pending) === holeKey(h)) {
      pending = null; // tapping the same hole again cancels
    } else {
      parts.push({ id: nextId++, type: tool, a: pending, b: h, closed: false });
      pending = null;
    }
    render();
  }

  function removePart(id) {
    parts = parts.filter(function (p) { return p.id !== id; });
  }

  svg.addEventListener('click', function (event) {
    var target = event.target;
    var partEl = target.closest('[data-part]');
    if (partEl) {
      var id = Number(partEl.getAttribute('data-part'));
      if (tool === 'erase') {
        removePart(id);
      } else if (target.hasAttribute('data-switch')) {
        var sw = findPart(id);
        sw.closed = !sw.closed;
      }
      message = '';
      render();
      return;
    }
    var holeEl = target.closest('[data-hole]');
    if (holeEl) tapHole(parseHole(holeEl.getAttribute('data-hole')));
  });

  document.querySelectorAll('.tool-btn').forEach(function (button) {
    button.addEventListener('click', function () { selectTool(button.getAttribute('data-tool')); });
  });

  document.getElementById('clear-board').addEventListener('click', function () {
    parts = [];
    pending = null;
    message = '';
    render();
  });

  drawBoard();
  render();
})();
