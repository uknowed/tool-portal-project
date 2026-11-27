// Resistor colour code (4 bands): pick colours, get the resistance.
// Band 1 and 2 are digits, band 3 multiplies them, band 4 is the tolerance:
// how far the real value may be from the printed one.
(function () {
  'use strict';

  var COLOURS = {
    black:  { name: 'Black',  hex: '#111111', digit: 0, mult: 1 },
    brown:  { name: 'Brown',  hex: '#7b4a26', digit: 1, mult: 10,  tol: 1 },
    red:    { name: 'Red',    hex: '#d0312d', digit: 2, mult: 100, tol: 2 },
    orange: { name: 'Orange', hex: '#f08a24', digit: 3, mult: 1e3 },
    yellow: { name: 'Yellow', hex: '#f5d020', digit: 4, mult: 1e4 },
    green:  { name: 'Green',  hex: '#2e9e44', digit: 5, mult: 1e5, tol: 0.5 },
    blue:   { name: 'Blue',   hex: '#2563eb', digit: 6, mult: 1e6, tol: 0.25 },
    violet: { name: 'Violet', hex: '#7c3aed', digit: 7, mult: 1e7, tol: 0.1 },
    grey:   { name: 'Grey',   hex: '#8c8c8c', digit: 8, mult: 1e8, tol: 0.05 },
    white:  { name: 'White',  hex: '#ffffff', digit: 9, mult: 1e9 },
    gold:   { name: 'Gold',   hex: '#c9a227', mult: 0.1,  tol: 5 },
    silver: { name: 'Silver', hex: '#c4c4c4', mult: 0.01, tol: 10 }
  };

  var DIGITS = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
  // Each band only offers the colours that are allowed there.
  var BANDS = [
    { options: DIGITS.slice(1), start: 'yellow', label: function (c) { return c.name + ' = ' + c.digit; } },
    { options: DIGITS, start: 'violet', label: function (c) { return c.name + ' = ' + c.digit; } },
    { options: DIGITS.concat(['gold', 'silver']), start: 'red', label: function (c) { return c.name + ' = × ' + formatNumber(c.mult); } },
    { options: ['brown', 'red', 'green', 'blue', 'violet', 'grey', 'gold', 'silver'], start: 'gold', label: function (c) { return c.name + ' = ±' + c.tol + '%'; } }
  ];

  // 4700 -> "4,700"; 0.1 -> "0.1"
  function formatNumber(n) {
    return Number(n.toPrecision(6)).toLocaleString('en-GB', { maximumFractionDigits: 3 });
  }

  // 4700 -> "4.7 kΩ" (k = thousand, M = million, G = billion)
  function formatOhms(ohms) {
    var units = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k']];
    for (var i = 0; i < units.length; i++) {
      if (ohms >= units[i][0]) return formatNumber(ohms / units[i][0]) + ' ' + units[i][1] + 'Ω';
    }
    return formatNumber(ohms) + ' Ω';
  }

  var selects = BANDS.map(function (band, i) {
    var select = document.getElementById('sel-' + i);
    band.options.forEach(function (key) {
      var option = document.createElement('option');
      option.value = key;
      option.textContent = band.label(COLOURS[key]);
      select.appendChild(option);
    });
    select.value = band.start;
    select.addEventListener('change', update);
    return select;
  });

  function update() {
    var c = selects.map(function (s) { return COLOURS[s.value]; });

    c.forEach(function (colour, i) {
      document.getElementById('band-' + i).setAttribute('fill', colour.hex);
      document.getElementById('swatch-' + i).style.background = colour.hex;
    });
    document.getElementById('resistor').setAttribute('aria-label',
      'Resistor with bands ' + c.map(function (x) { return x.name; }).join(', '));

    var digits = c[0].digit * 10 + c[1].digit;
    var ohms = Number((digits * c[2].mult).toPrecision(6));
    var spread = ohms * c[3].tol / 100;

    document.getElementById('value').textContent = formatOhms(ohms) + ' ±' + c[3].tol + '%';
    document.getElementById('range').textContent =
      'The real value is somewhere between ' + formatOhms(ohms - spread) + ' and ' + formatOhms(ohms + spread) + '.';

    var steps = [
      'Band 1 (' + c[0].name + ') is ' + c[0].digit + ' and band 2 (' + c[1].name + ') is ' + c[1].digit +
        ', so the digits are ' + digits + '.',
      'Band 3 (' + c[2].name + ') means multiply by ' + formatNumber(c[2].mult) + ': ' +
        digits + ' × ' + formatNumber(c[2].mult) + ' = ' + formatNumber(ohms) + ' Ω' +
        (ohms >= 1000 ? ', which is ' + formatOhms(ohms) + '.' : '.'),
      'Band 4 (' + c[3].name + ') is the tolerance: the real value may be up to ' + c[3].tol + '% higher or lower.'
    ];
    var list = document.getElementById('steps');
    list.textContent = '';
    steps.forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
  }

  update();
})();
