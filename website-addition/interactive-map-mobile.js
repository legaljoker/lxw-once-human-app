/* LxW — start the map's side panels collapsed on phones so the map is visible first.
   Load at the very end of once-human/interactive-map.html, after the page's own scripts. */
(function () {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
    var loot = document.querySelector('#sidebar-filter-panel details');
    if (loot) loot.open = false;
    var tracker = document.getElementById('eternal-tracker-panel');
    if (tracker && !tracker.classList.contains('collapsed') && typeof toggleTrackerPanel === 'function') toggleTrackerPanel();
})();
