# Allstar Galaxy V81 — Master Content System

The public website is now generated from one file:

`data/master-content.json`

Do not add carousel cards manually to HTML. Edit the matching section in the master file and commit the change to GitHub.

## Publish a new game

Open the `games` section. Find a hidden `new-game-XX` record and change:

- `season`
- `gameNumber`
- `opponent`
- `date`
- `time`
- `location`
- `result`
- `fullMatch`
- `highlights`
- `slideshow`
- `status` from `hidden` to `published`

The card is generated automatically and added to the Latest Games carousel.

## Publish a new season

Open `seasons`, complete one hidden season record, paste the three playlist links, and set `status` to `published`.

## Add a playlist

Open `playlists`. Use a category:

- `core` — gold
- `goals` — red
- `saves` — blue
- `assists` — green
- `plays` — purple
- `shorts` — cyan
- `best` — pink
- `archive` — silver

Use locations to choose where the card appears:

- `home-best`
- `media-archive`
- `season-archive`
- `latest-season-playlists`

## Add a player

Open `players`, enter name, number, position and optional photo path. Set status to `published`. With no photo, the standard Allstar Galaxy placeholder is displayed.

## Schedule, standings, news and livestream

Edit the `schedule`, `standings`, `news`, and `live` sections. They are generated automatically.

## Status values

- `published` — visible
- `placeholder` — visible as a Coming Soon item
- `hidden` — not shown

## Required permanent assets

- `images/generated/media-card-background.png`
- `images/generated/allstar-galaxy-logo.png`

The website does not require a custom graphic for every new game, season, playlist, news item, or schedule item.
