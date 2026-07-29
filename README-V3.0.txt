ALLSTAR GALAXY WEBSITE V3.0
===========================

V3.0 foundation update

WHAT CHANGED
------------
1. Added js/site-core-v3.js as the shared public-site foundation.
2. Public navigation is now generated from one central NAV_ITEMS list.
3. Desktop navigation now permanently includes a SEARCH button.
4. Phone header replaces the right Allstar Galaxy logo with a large search button.
5. Added a single shared Galaxy Search overlay on every public page.
6. Search automatically reads data/master-content.json, with master-content.json as a fallback.
7. Search includes games, awards, players, seasons, playlists, and news.
8. Search supports live filtering and Ctrl+K / Command+K.
9. Removed the old galaxy-search.js loader from public pages to prevent duplicate or disappearing controls.
10. Added a clearly separated V3.0 CSS foundation block at the bottom of css/styles.css.

FUTURE GLOBAL CHANGES
---------------------
Navigation items: edit NAV_ITEMS near the top of js/site-core-v3.js.
Search categories/data mapping: edit buildRecords() in js/site-core-v3.js.
Shared navigation/search styling: edit the ALLSTAR GALAXY V3.0 FOUNDATION block at the bottom of css/styles.css.

GITHUB INSTALLATION
-------------------
Upload the contents of this repository to the root of the existing GitHub repository and overwrite matching files.
Do not upload the enclosing allstargalaxysoccer-main folder as an extra nested directory.
