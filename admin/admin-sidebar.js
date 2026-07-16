
(() => {
  "use strict";

  const ITEMS = [
    ["dashboard", "Dashboard", "dashboard.html", true],
    ["players", "Players", "players.html", false],
    ["games", "Games", "games.html", true],
    ["seasons", "Seasons", "seasons.html", false],
    ["playlists", "Playlists", "playlists.html", false],
    ["news", "News", "news.html", true],
    ["schedule", "Schedule & Standings", "schedule.html", false],
    ["livestream", "Livestream", "livestream.html", false],
    ["graphics", "Website Graphics", "graphics.html", false],
    ["heroes", "Hero Images", "heroes.html", false],
    ["settings", "Site Settings", "settings.html", false],
    ["backups", "Backup & Restore", "backups.html", false]
  ];

  const MODE_KEY = "asgAdminCustomizeMode";

  function currentMode() {
    return localStorage.getItem(MODE_KEY) === "customize" ? "customize" : "basic";
  }

  function renderSharedSidebar() {
    const nav = document.querySelector(".admin-nav");
    if (!nav) return;

    const current = document.body.dataset.page || "dashboard";
    const mode = currentMode();

    // If an advanced page is opened directly, keep it visible without
    // permanently changing the user's saved default mode.
    const currentIsAdvanced = ITEMS.some(([key,,,basic]) => key === current && !basic);
    const showAdvanced = mode === "customize" || currentIsAdvanced;

    nav.innerHTML = `
      <div class="admin-mode-summary">
        <span>${showAdvanced ? "CUSTOMIZE MODE" : "BASIC MODE"}</span>
      </div>

      ${ITEMS.filter(([, , , basic]) => basic || showAdvanced).map(([key, label, href]) => `
        <a data-page="${key}" class="${current === key ? "active" : ""}" href="${href}">${label}</a>
      `).join("")}

      <button type="button" class="admin-customize-toggle ${showAdvanced ? "is-open" : ""}" id="adminCustomizeToggle">
        ${showAdvanced ? "← Basic View" : "Customize Website"}
      </button>
    `;

    const button = document.getElementById("adminCustomizeToggle");
    button?.addEventListener("click", () => {
      const next = showAdvanced ? "basic" : "customize";
      localStorage.setItem(MODE_KEY, next);

      // When leaving Customize Mode from an advanced page, return to Dashboard
      // so the user never lands on a page hidden by Basic Mode.
      if (showAdvanced && currentIsAdvanced) {
        location.href = "dashboard.html";
      } else {
        renderSharedSidebar();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSharedSidebar, { once: true });
  } else {
    renderSharedSidebar();
  }
})();
