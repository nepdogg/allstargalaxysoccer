ALLSTAR GALAXY V221 — AUTOMATED VISUAL QA

INSTALL AFTER V220.
Upload the CONTENTS of this folder to the root of the GitHub repository and replace matching files.

Changes:
- Adds Playwright visual testing.
- Captures desktop and phone screenshots of all primary public pages.
- Checks for horizontal overflow, broken image rendering, and browser console errors.
- Runs from GitHub Actions and saves the screenshots/report as a downloadable workflow artifact.

HOW TO RUN:
1. Open the repository on GitHub.
2. Select Actions.
3. Select Allstar Galaxy Visual QA.
4. Select Run workflow.
5. After the run finishes, download the visual-qa-report artifact.

This package contains testing files only and does not change the public website design.
