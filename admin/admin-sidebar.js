
(() => {
  "use strict";

  const ITEMS = [
    ["dashboard", "Dashboard", "dashboard.html"],
    ["players", "Players", "players.html"],
    ["games", "Games", "games.html"],
    ["seasons", "Seasons", "seasons.html"],
    ["playlists", "Playlists", "playlists.html"],
    ["news", "News", "news.html"],
    ["schedule", "Schedule & Standings", "schedule.html"],
    ["livestream", "Livestream", "livestream.html"],
    ["graphics", "Website Graphics", "graphics.html"],
    ["heroes", "Hero Images", "heroes.html"],
    ["settings", "Site Settings", "settings.html"],
    ["backups", "Backup & Restore", "backups.html"]
  ];

  function renderSharedSidebar() {
    const nav = document.querySelector(".admin-nav");
    if (!nav) return;

    const current = document.body.dataset.page || "dashboard";
    nav.innerHTML = ITEMS.map(([key, label, href]) => `
      <a data-page="${key}" class="${current === key ? "active" : ""}" href="${href}">${label}</a>
    `).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSharedSidebar, { once: true });
  } else {
    renderSharedSidebar();
  }
})();
