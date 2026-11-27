// Light/dark theme toggle, shared by every page.
// The theme is stored as data-theme="light" or "dark" on the <html> element.
// A tiny script in each page's <head> applies the saved theme before the page
// is drawn; this file wires up the button.
(function () {
  'use strict';

  var root = document.documentElement;

  function save(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // Storage can be blocked (private windows, strict settings). The toggle
      // still works for this visit; it just won't be remembered.
    }
  }

  function updateButton(button) {
    var isDark = root.getAttribute('data-theme') === 'dark';
    button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    button.textContent = isDark ? 'Dark theme: on' : 'Dark theme: off';
  }

  function init() {
    if (root.getAttribute('data-theme') !== 'dark') {
      root.setAttribute('data-theme', 'light');
    }
    var button = document.getElementById('theme-toggle');
    if (!button) return;
    updateButton(button);
    button.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      save(next);
      updateButton(button);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
