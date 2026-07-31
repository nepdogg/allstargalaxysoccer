document.addEventListener("DOMContentLoaded", async () => {
    if (window.ASGContent?.ready) await window.ASGContent.ready;
    document.querySelectorAll(".carousel").forEach((carousel) => {
        const track = carousel.querySelector(".carousel-track");
        const slides = Array.from(carousel.querySelectorAll(".media-slide, .team-slide, .team-card-slide, .media-game-slide, .season-archive-slide"));
        const previousButton = carousel.querySelector(".prev");
        const nextButton = carousel.querySelector(".next");
        const dotsContainer = carousel.querySelector(".carousel-dots");
        const isHomepagePlaylist = carousel.classList.contains("homepage-media-carousel");
        const isTeamRoster = carousel.classList.contains("team-roster-carousel");
        const isMediaShowcase = carousel.classList.contains("media-games-carousel") || carousel.classList.contains("media-season-carousel") || carousel.classList.contains("media-playlist-carousel") || carousel.classList.contains("media-game-awards-carousel");
        const isShowcaseCarousel = isHomepagePlaylist || isTeamRoster || isMediaShowcase;

        if (!track || slides.length === 0) {
            return;
        }

        let currentIndex = carousel.classList.contains("team-roster-carousel") ? 4 : 0;
        let autoPlayTimer;
        let autoPlayHasStarted = false;

        if (dotsContainer) {
            dotsContainer.innerHTML = "";

            slides.forEach((_, slideIndex) => {
                const dot = document.createElement("button");
                dot.className = "carousel-dot";
                dot.type = "button";
                dot.setAttribute("aria-label", `Go to slide ${slideIndex + 1}`);
                if (slideIndex === 0) {
                    dot.classList.add("active");
                }
                dotsContainer.appendChild(dot);
            });
        }

        const dots = Array.from(carousel.querySelectorAll(".carousel-dot"));

        function updateCarousel() {
            const targetSlide = slides[currentIndex];

            slides.forEach((slide, slideIndex) => {
                const distance = Math.abs(slideIndex - currentIndex);
                const wrappedDistance = Math.min(distance, slides.length - distance);
                slide.classList.toggle("is-active", slideIndex === currentIndex);
                slide.classList.toggle("is-neighbor", wrappedDistance === 1);
            });

            if (isTeamRoster) {
                // Team roster uses absolute positioning so the cards never drift outside the page.
                track.style.setProperty('transform', 'none', 'important');

                slides.forEach((slide, slideIndex) => {
                    let offset = slideIndex - currentIndex;
                    if (offset > slides.length / 2) offset -= slides.length;
                    if (offset < -slides.length / 2) offset += slides.length;

                    const absOffset = Math.abs(offset);
                    slide.style.setProperty('--roster-offset', offset);
                    slide.classList.toggle('is-distance-2', absOffset === 2);
                    slide.classList.toggle('is-distance-3', absOffset === 3);
                    slide.classList.toggle('is-distance-4', absOffset >= 4);
                    slide.classList.toggle('is-hidden-card', absOffset > 4);
                });
            } else if (isHomepagePlaylist) {
                // Homepage playlist showcase uses absolute positioning so the
                // featured card is always exactly centered in the carousel frame.
                track.style.setProperty('transform', 'none', 'important');

                slides.forEach((slide, slideIndex) => {
                    let offset = slideIndex - currentIndex;
                    if (offset > slides.length / 2) offset -= slides.length;
                    if (offset < -slides.length / 2) offset += slides.length;

                    const absOffset = Math.abs(offset);
                    slide.style.setProperty('--home-offset', offset);
                    slide.classList.toggle('is-distance-2', absOffset === 2);
                    slide.classList.toggle('is-hidden-home', absOffset > 2);
                });
            } else if (isMediaShowcase) {
                // Media page carousels use the same centered showcase behavior
                // as the homepage carousel so the active card stays locked in
                // the middle of each frame.
                track.style.setProperty('transform', 'none', 'important');

                slides.forEach((slide, slideIndex) => {
                    let offset = slideIndex - currentIndex;
                    if (offset > slides.length / 2) offset -= slides.length;
                    if (offset < -slides.length / 2) offset += slides.length;

                    const absOffset = Math.abs(offset);
                    slide.style.setProperty('--media-offset', offset);
                    slide.classList.toggle('is-distance-2', absOffset === 2);
                    slide.classList.toggle('is-hidden-media', absOffset > 2);
                });
            } else if (isShowcaseCarousel) {
                const carouselCenter = carousel.clientWidth / 2;
                const slideCenter = targetSlide.offsetLeft + (targetSlide.offsetWidth / 2);
                const nextTranslateX = carouselCenter - slideCenter;

                track.style.setProperty('transform', `translateX(${nextTranslateX}px)`, 'important');
            } else {
                const slideLeft = targetSlide ? targetSlide.offsetLeft : 0;
                track.style.setProperty('transform', `translateX(-${slideLeft}px)`, 'important');
            }

            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle("active", dotIndex === currentIndex);
            });
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        }

        function previousSlide() {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
        }

        function getCarouselInterval() {
            if (carousel.classList.contains("media-games-carousel")) return 6500;
            if (carousel.classList.contains("media-game-awards-carousel")) return 7500;
            if (carousel.classList.contains("media-season-carousel")) return 9000;
            if (carousel.classList.contains("media-playlist-carousel")) return 12000;
            return isShowcaseCarousel ? 6500 : 4500;
        }

        function getInitialDelay() {
            if (carousel.classList.contains("media-season-carousel")) return 3000;
            if (carousel.classList.contains("media-game-awards-carousel")) return 1500;
            if (carousel.classList.contains("media-playlist-carousel")) return 6000;
            return 0;
        }

        function startAutoPlay(forceNoDelay = false) {
            stopAutoPlay();
            const interval = getCarouselInterval();
            const delay = (!autoPlayHasStarted && !forceNoDelay) ? getInitialDelay() : 0;
            autoPlayHasStarted = true;

            if (delay > 0) {
                autoPlayTimer = setTimeout(() => {
                    nextSlide();
                    autoPlayTimer = setInterval(nextSlide, interval);
                }, delay);
            } else {
                autoPlayTimer = setInterval(nextSlide, interval);
            }
        }

        function stopAutoPlay() {
            if (autoPlayTimer) {
                clearTimeout(autoPlayTimer);
                clearInterval(autoPlayTimer);
            }
        }

        carousel.querySelectorAll(".playlist-pending").forEach((pendingLink) => {
            pendingLink.addEventListener("click", (event) => event.preventDefault());
        });

        previousButton?.addEventListener("click", () => {
            previousSlide();
            startAutoPlay(true);
        });

        nextButton?.addEventListener("click", () => {
            nextSlide();
            startAutoPlay(true);
        });

        dots.forEach((dot, dotIndex) => {
            dot.addEventListener("click", () => {
                currentIndex = dotIndex;
                updateCarousel();
                startAutoPlay(true);
            });
        });

        let touchStartX = null;
        carousel.addEventListener("touchstart", (event) => {
            touchStartX = event.touches[0].clientX;
        }, { passive: true });

        carousel.addEventListener("touchend", (event) => {
            if (touchStartX === null) return;
            const touchEndX = event.changedTouches[0].clientX;
            const swipeDistance = touchStartX - touchEndX;
            if (Math.abs(swipeDistance) > 45) {
                swipeDistance > 0 ? nextSlide() : previousSlide();
                startAutoPlay(true);
            }
            touchStartX = null;
        });

        window.addEventListener("resize", updateCarousel);
        carousel.addEventListener("mouseenter", stopAutoPlay);
        carousel.addEventListener("mouseleave", startAutoPlay);

        updateCarousel();
        startAutoPlay();
    });

    const playerCards = Array.from(document.querySelectorAll(".team-roster-carousel .team-card-slide"));
    const playerLightbox = document.getElementById("playerCardLightbox");

    if (playerCards.length && playerLightbox) {
        const lightboxImage = playerLightbox.querySelector(".player-lightbox-image");
        const openOriginal = playerLightbox.querySelector(".player-lightbox-open");
        const closeButton = playerLightbox.querySelector(".player-lightbox-close");
        const previousButton = playerLightbox.querySelector(".player-lightbox-prev");
        const nextButton = playerLightbox.querySelector(".player-lightbox-next");
        let activePlayerIndex = 0;
        let lightboxTouchStartX = null;

        function showPlayerCard(index) {
            activePlayerIndex = (index + playerCards.length) % playerCards.length;
            const selectedCard = playerCards[activePlayerIndex];
            const stage = playerLightbox.querySelector("#ultimatePlayerProfile");
            if (!stage) return;
            const sourceFront = selectedCard.querySelector(".ultimate-player-frame");
            const front = sourceFront?.cloneNode(true);
            if (!front || !sourceFront) return;

            // V174: keep the popup and carousel on one shared percentage-based
            // renderer. Do not copy pixel measurements from the smaller carousel
            // card into the larger popup; only clone the card data and saved photo
            // variables, then allow the shared card CSS to scale the complete card.
            front.classList.add("popup-exact-front-card");
            // V175: this is an exact visual clone of the carousel card. Do not
            // clear or recalculate any internal photo/text measurements here.
            // The complete card scales as one proportional unit in the popup.
            const value = (key, fallback="N/A") => selectedCard.dataset[key] || fallback;
            const advanced = String(selectedCard.dataset.playerMode || "standard").toLowerCase() === "advanced" ||
              ["playerDob","playerNationality","playerFoot","playerHeight","playerWeight","playerQuote"].some(k => String(selectedCard.dataset[k]||"").trim());
            stage.innerHTML = "";
            const toolbar = document.createElement("div");
            toolbar.className = "ultimate-profile-toolbar";
            toolbar.innerHTML = `<button type="button" class="ultimate-tab is-active" data-card-view="front">Front Card</button>${advanced?'<button type="button" class="ultimate-tab" data-card-view="profile">Profile Card</button>':''}<button type="button" class="ultimate-open-photo">Open Full Player Photo</button>`;
            stage.appendChild(toolbar);
            const deck = document.createElement("div");
            deck.className = "ultimate-card-deck" + (advanced ? " is-advanced" : "");
            front.classList.add("ultimate-view-card","is-active");
            front.dataset.cardPanel = "front";
            // The carousel card inherits photo variables from its anchor.
            // A cloned popup card does not, so copy the saved player values explicitly.
            front.style.setProperty("--player-scale", String((Number(selectedCard.dataset.playerPhotoScale)||100)/100));
            front.style.setProperty("--player-x", `${Number(selectedCard.dataset.playerPhotoX)||0}%`);
            front.style.setProperty("--player-y", `${Number(selectedCard.dataset.playerPhotoY)||0}%`);
            deck.appendChild(front);
            if (advanced) {
                const profile = document.createElement("section");
                profile.className = "ultimate-profile-card ultimate-view-card prototype-profile-frame";
                profile.dataset.cardPanel = "profile";
                const profileTemplate = selectedCard.dataset.playerProfileTemplate || "generated/player-profile-card-template.png";
                profile.innerHTML = `
                  <img class="prototype-profile-template" src="${profileTemplate}" alt="" aria-hidden="true">
                  <span class="prototype-profile-number">${value("playerNumber","00")}</span>
                  <span class="prototype-profile-position">${value("playerPosition","PLAYER")}</span>
                  <div class="prototype-profile-name name-length-${Math.min(20,String(value("playerLast","PROFILE")).length)}"><small>${value("playerFirst","PLAYER")}</small><strong>${value("playerLast","PROFILE")}</strong></div>
                  <div class="prototype-profile-values">
                    <b>${value("playerDob")}</b>
                    <b>${value("playerNationality")}</b>
                    <b>${value("playerFoot")}</b>
                    <b>${value("playerHeight")}</b>
                    <b>${value("playerWeight")}</b>
                  </div>
                  <p class="prototype-profile-quote">${String(value("playerQuote","")||"").trim() ? `“${value("playerQuote","")}”` : ""}</p>`;
                deck.appendChild(profile);
            }
            stage.appendChild(deck);
            toolbar.querySelectorAll(".ultimate-tab").forEach(btn=>btn.addEventListener("click",()=>{
              toolbar.querySelectorAll(".ultimate-tab").forEach(x=>x.classList.toggle("is-active",x===btn));
              deck.querySelectorAll(".ultimate-view-card").forEach(card=>card.classList.toggle("is-active",card.dataset.cardPanel===btn.dataset.cardView));
            }));
            toolbar.querySelector(".ultimate-open-photo")?.addEventListener("click", (event)=>{
              event.preventDefault();
              const url=value("playerImage", "");
              if(url) window.open(url, "_blank", "noopener,noreferrer");
            });
        }

        function openPlayerLightbox(index) {
            showPlayerCard(index);
            playerLightbox.classList.add("is-open");
            playerLightbox.setAttribute("aria-hidden", "false");
            document.body.classList.add("lightbox-open");
            closeButton?.focus();
        }

        function closePlayerLightbox() {
            playerLightbox.classList.remove("is-open");
            playerLightbox.setAttribute("aria-hidden", "true");
            document.body.classList.remove("lightbox-open");
        }

        function showNextPlayer() {
            showPlayerCard(activePlayerIndex + 1);
        }

        function showPreviousPlayer() {
            showPlayerCard(activePlayerIndex - 1);
        }

        playerCards.forEach((card, index) => {
            card.addEventListener("click", (event) => {
                event.preventDefault();
                openPlayerLightbox(index);
            });
        });

        closeButton?.addEventListener("click", closePlayerLightbox);
        nextButton?.addEventListener("click", showNextPlayer);
        previousButton?.addEventListener("click", showPreviousPlayer);

        playerLightbox.addEventListener("click", (event) => {
            if (event.target === playerLightbox) {
                closePlayerLightbox();
            }
        });

        playerLightbox.addEventListener("touchstart", (event) => {
            lightboxTouchStartX = event.touches[0].clientX;
        }, { passive: true });

        playerLightbox.addEventListener("touchend", (event) => {
            if (lightboxTouchStartX === null) return;
            const touchEndX = event.changedTouches[0].clientX;
            const swipeDistance = lightboxTouchStartX - touchEndX;
            if (Math.abs(swipeDistance) > 50) {
                swipeDistance > 0 ? showNextPlayer() : showPreviousPlayer();
            }
            lightboxTouchStartX = null;
        });

        document.addEventListener("keydown", (event) => {
            if (!playerLightbox.classList.contains("is-open")) return;

            if (event.key === "Escape") {
                closePlayerLightbox();
            }

            if (event.key === "ArrowRight") {
                showNextPlayer();
            }

            if (event.key === "ArrowLeft") {
                showPreviousPlayer();
            }
        });
    }


    const scheduleLinks = Array.from(document.querySelectorAll(".schedule-lightbox-link"));
    const scheduleLightbox = document.getElementById("scheduleImageLightbox");

    if (scheduleLinks.length && scheduleLightbox) {
        const scheduleImage = scheduleLightbox.querySelector(".schedule-lightbox-image");
        const scheduleTitle = scheduleLightbox.querySelector(".schedule-lightbox-title");
        const scheduleOpen = scheduleLightbox.querySelector(".schedule-lightbox-open");
        const scheduleClose = scheduleLightbox.querySelector(".schedule-lightbox-close");

        function openScheduleLightbox(link) {
            const imageSrc = link.getAttribute("href");
            const imageAlt = link.querySelector("img")?.getAttribute("alt") || "Schedule image";
            const title = link.dataset.lightboxTitle || "Schedule";

            if (!imageSrc || !scheduleImage) return;

            scheduleImage.src = imageSrc;
            scheduleImage.alt = imageAlt;
            if (scheduleTitle) scheduleTitle.textContent = title;
            if (scheduleOpen) scheduleOpen.href = imageSrc;

            scheduleLightbox.classList.add("is-open");
            scheduleLightbox.setAttribute("aria-hidden", "false");
            document.body.classList.add("lightbox-open");
            scheduleClose?.focus();
        }

        function closeScheduleLightbox() {
            scheduleLightbox.classList.remove("is-open");
            scheduleLightbox.setAttribute("aria-hidden", "true");
            document.body.classList.remove("lightbox-open");
        }

        scheduleLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                openScheduleLightbox(link);
            });
        });

        scheduleClose?.addEventListener("click", closeScheduleLightbox);

        scheduleLightbox.addEventListener("click", (event) => {
            if (event.target === scheduleLightbox) {
                closeScheduleLightbox();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (!scheduleLightbox.classList.contains("is-open")) return;
            if (event.key === "Escape") {
                closeScheduleLightbox();
            }
        });
    }

});


// V211 — Complete game-media lightbox with eight links and embedded YouTube playback.
document.addEventListener("DOMContentLoaded", async () => {
    if (window.ASGContent?.ready) await window.ASGContent.ready;

    function ensureGameLightbox() {
        let lightbox = document.getElementById("gameLinkLightbox");
        if (lightbox) return lightbox;
        document.body.insertAdjacentHTML("beforeend", `
          <div aria-hidden="true" class="game-link-lightbox" id="gameLinkLightbox">
            <div aria-label="Game media links" aria-modal="true" class="game-link-panel" role="dialog">
              <button aria-label="Close game media links" class="game-link-close" type="button">×</button>
              <h2 class="game-link-title">Game Media</h2>
              <p class="game-link-opponent">Allstar Galaxy</p>
              <p class="game-link-result"></p>
              <div class="game-video-player" hidden>
                <div class="game-video-frame-wrap"><iframe class="game-video-frame" title="Allstar Galaxy video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
                <div class="game-video-now-playing"></div>
              </div>
              <div class="game-link-actions"></div>
              <p class="game-link-note">Select a video to play it here without leaving the Allstar Galaxy website.</p>
            </div>
          </div>`);
        return document.getElementById("gameLinkLightbox");
    }

    const gameLightbox = ensureGameLightbox();
    if (!gameLightbox) return;
    const panel = gameLightbox.querySelector(".game-link-panel");
    const title = gameLightbox.querySelector(".game-link-title");
    const opponent = gameLightbox.querySelector(".game-link-opponent");
    const result = gameLightbox.querySelector(".game-link-result");
    const actions = gameLightbox.querySelector(".game-link-actions");
    const closeButton = gameLightbox.querySelector(".game-link-close");

    let player = gameLightbox.querySelector(".game-video-player");
    let iframe = gameLightbox.querySelector(".game-video-frame");
    let nowPlaying = gameLightbox.querySelector(".game-video-now-playing");
    let activeRandomType = "";
    let activeRandomLabel = "";
    if (!player) {
        const markup = `<div class="game-video-player" hidden><div class="game-video-frame-wrap"><iframe class="game-video-frame" title="Allstar Galaxy video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><div class="game-video-now-playing"></div></div>`;
        actions?.insertAdjacentHTML("beforebegin", markup);
        player = gameLightbox.querySelector(".game-video-player");
        iframe = gameLightbox.querySelector(".game-video-frame");
        nowPlaying = gameLightbox.querySelector(".game-video-now-playing");
    }

    function youtubeEmbedUrl(value) {
        const raw = String(value || "").trim();
        if (!raw || raw === "#") return "";
        try {
            const url = new URL(raw, window.location.href);
            let id = "";
            if (url.hostname.includes("youtu.be")) id = url.pathname.split("/").filter(Boolean)[0] || "";
            else if (url.hostname.includes("youtube.com")) {
                if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/") || url.pathname.startsWith("/embed/")) id = url.pathname.split("/").filter(Boolean)[1] || "";
                else id = url.searchParams.get("v") || "";
            }
            return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1` : "";
        } catch (_) { return ""; }
    }

    function stopVideo() {
        if (iframe) iframe.src = "about:blank";
        if (player) player.hidden = true;
        if (nowPlaying) nowPlaying.textContent = "";
    }

    function playVideo(url, label) {
        const embed = youtubeEmbedUrl(url);
        if (!embed || !iframe || !player) return;
        iframe.src = embed;
        player.hidden = false;
        if (nowPlaying) nowPlaying.textContent = `NOW PLAYING — ${label}`;
        player.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function buildAction(label, icon, url, key) {
        const unavailable = !url || url === "#";
        const button = document.createElement("button");
        button.type = "button";
        button.className = `game-link-action game-link-${key}${unavailable ? " is-disabled" : ""}`;
        button.disabled = unavailable;
        button.setAttribute("aria-disabled", unavailable ? "true" : "false");
        button.textContent = unavailable ? `${icon} ${label} — Coming Soon` : `${icon} ${label}`;
        if (!unavailable) button.addEventListener("click", () => playVideo(url, label));
        return button;
    }

    function openGameLightbox(card) {
        const isSeason = card.classList.contains("generated-season-card") || card.classList.contains("season-archive-slide");
        const randomType = card.dataset.randomVideoType || "";
        const randomLabels = {full:"FULL MATCH",highlights:"HIGHLIGHTS",slideshow:"SLIDESHOW",goal:"GOAL OF THE GAME",save:"SAVE OF THE GAME",assist:"ASSIST OF THE GAME",play:"PLAY OF THE GAME",player:"PLAYER OF THE GAME"};
        activeRandomType = randomType;
        activeRandomLabel = randomLabels[randomType] || "RANDOM VIDEO";
        stopVideo();

        if (randomType) {
            const playAnotherRandom = () => {
                const pool = window.ASG_HOME_RANDOM_VIDEO_POOLS?.[randomType] || [];
                if (!pool.length) return;
                let item = pool[Math.floor(Math.random() * pool.length)];
                if (pool.length > 1 && iframe?.dataset.currentRandomUrl === item.url) {
                    const alternatives = pool.filter(entry => entry.url !== iframe.dataset.currentRandomUrl);
                    item = alternatives[Math.floor(Math.random() * alternatives.length)] || item;
                }
                if (title) title.textContent = item.title || activeRandomLabel;
                if (opponent) opponent.textContent = item.subtitle || "Allstar Galaxy";
                if (result) result.textContent = item.result || "Random Video";
                if (iframe) iframe.dataset.currentRandomUrl = item.url || "";
                playVideo(item.url, activeRandomLabel);
            };
            if (actions) {
                actions.innerHTML = "";
                const nextButton = document.createElement("button");
                nextButton.type = "button";
                nextButton.className = "game-link-action game-link-random-next";
                nextButton.textContent = `⟳ RANDOM ${activeRandomLabel}`;
                nextButton.addEventListener("click", playAnotherRandom);
                actions.appendChild(nextButton);
            }
            panel?.classList.remove("is-season-panel");
            panel?.classList.add("is-random-panel");
            gameLightbox.classList.add("is-open");
            gameLightbox.setAttribute("aria-hidden", "false");
            document.body.classList.add("lightbox-open");
            playAnotherRandom();
            closeButton?.focus();
            return;
        }

        panel?.classList.remove("is-random-panel");
        if (title) title.textContent = card.dataset.gameTitle || "Game Media";
        if (opponent) opponent.textContent = card.dataset.gameOpponent || "Allstar Galaxy";
        if (result) result.textContent = card.dataset.gameResult || "";
        if (actions) {
            actions.innerHTML = "";
            const items = [
                [card.dataset.fullLabel || (isSeason ? "Full Matches" : "Full Match"), "▶", card.dataset.full, "full"],
                [card.dataset.highlightsLabel || "Highlights", "▣", card.dataset.highlights, "highlights"],
                [card.dataset.slideshowLabel || (isSeason ? "Slideshows" : "Slideshow"), "▧", card.dataset.slideshow, "slideshow"]
            ];
            if (!isSeason) items.push(
                ["Goal of the Game", "⚽", card.dataset.goal, "goal"],
                ["Save of the Game", "✋", card.dataset.save, "save"],
                ["Assist of the Game", "➤", card.dataset.assist, "assist"],
                ["Play of the Game", "★", card.dataset.play, "play"],
                ["Player of the Game", "🏆", card.dataset.player, "player"]
            );
            items.forEach(([label, icon, url, key]) => actions.appendChild(buildAction(label.replace(/^[▶▣▧]\s*/, ""), icon, url, key)));
        }
        panel?.classList.toggle("is-season-panel", isSeason);
        gameLightbox.classList.add("is-open");
        gameLightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("lightbox-open");
        closeButton?.focus();
    }

    function closeGameLightbox() {
        stopVideo();
        gameLightbox.classList.remove("is-open");
        gameLightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("lightbox-open");
    }

    document.addEventListener("click", (event) => {
        const card = event.target.closest(".media-game-slide");
        if (!card) return;
        event.preventDefault();
        openGameLightbox(card);
    });
    closeButton?.addEventListener("click", closeGameLightbox);
    gameLightbox.addEventListener("click", (event) => { if (event.target === gameLightbox) closeGameLightbox(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && gameLightbox.classList.contains("is-open")) closeGameLightbox(); });
});


/* ============================================================
   V118 — DYNAMIC SCHEDULE IMAGE LIGHTBOX
   Generated schedule cards are added after the page loads, so
   use event delegation instead of querying only at startup.
   ============================================================ */
document.addEventListener("click", (event) => {
    const link = event.target.closest(".schedule-lightbox-link");
    if (!link) return;

    const lightbox = document.getElementById("scheduleImageLightbox");
    if (!lightbox) return;

    event.preventDefault();

    const image = lightbox.querySelector(".schedule-lightbox-image");
    const title = lightbox.querySelector(".schedule-lightbox-title");
    const open = lightbox.querySelector(".schedule-lightbox-open");
    const source = link.getAttribute("href");
    const imageAlt = link.querySelector("img")?.getAttribute("alt") || "Schedule image";

    if (!source || source === "#") return;

    if (image) {
        image.src = source;
        image.alt = imageAlt;
    }
    if (title) title.textContent = link.dataset.lightboxTitle || "Schedule";
    if (open) open.href = source;

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    lightbox.querySelector(".schedule-lightbox-close")?.focus();
});

document.addEventListener("click", (event) => {
    const close = event.target.closest(".schedule-lightbox-close");
    const lightbox = document.getElementById("scheduleImageLightbox");
    if (!close || !lightbox) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
});


/* ============================================================
   V119 — DYNAMIC NEWS IMAGE LIGHTBOX
   News cards are rendered from master-content.json after load.
   ============================================================ */
(() => {
    const getLightbox = () => document.getElementById("newsImageLightbox");

    const closeNewsLightbox = () => {
        const lightbox = getLightbox();
        if (!lightbox) return;
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("lightbox-open");
    };

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest(".news-lightbox-link");
        if (trigger) {
            const lightbox = getLightbox();
            if (!lightbox) return;

            const source = trigger.dataset.newsImage || trigger.querySelector("img")?.src;
            if (!source) return;

            event.preventDefault();
            const image = lightbox.querySelector(".news-lightbox-image");
            const title = lightbox.querySelector(".news-lightbox-title");
            const open = lightbox.querySelector(".news-lightbox-open");

            if (image) {
                image.src = source;
                image.alt = trigger.querySelector("img")?.alt || "News image";
            }
            if (title) title.textContent = trigger.dataset.newsTitle || "News";
            if (open) open.href = source;

            lightbox.classList.add("is-open");
            lightbox.setAttribute("aria-hidden", "false");
            document.body.classList.add("lightbox-open");
            lightbox.querySelector(".news-lightbox-close")?.focus();
            return;
        }

        if (event.target.closest(".news-lightbox-close")) {
            event.preventDefault();
            closeNewsLightbox();
            return;
        }

        const lightbox = getLightbox();
        if (lightbox && event.target === lightbox) {
            closeNewsLightbox();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeNewsLightbox();
    });
})();


/* ============================================================
   V123 — SCHEDULE LIGHTBOX CLOSE FALLBACK
   ============================================================ */
(() => {
    const closeScheduleViewer = () => {
        const lightbox = document.getElementById("scheduleImageLightbox");
        if (!lightbox) return;
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("lightbox-open");
    };

    document.addEventListener("click", (event) => {
        const lightbox = document.getElementById("scheduleImageLightbox");
        if (!lightbox || !lightbox.classList.contains("is-open")) return;

        if (event.target.closest(".schedule-lightbox-close")) {
            event.preventDefault();
            event.stopPropagation();
            closeScheduleViewer();
            return;
        }

        if (event.target === lightbox) {
            closeScheduleViewer();
        }
    }, true);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeScheduleViewer();
    });
})();

/* V182 — deterministic player-card typography.
   Previous runtime fitting measured inactive carousel slides while they were
   transformed or partially hidden, which permanently shrank some surnames.
   Typography is now controlled by the shared percentage-based CSS renderer. */
(()=>{
  const clearLegacyFits=(root=document)=>{
    root.querySelectorAll?.('.prototype-player-name small, .prototype-player-name strong, .prototype-player-name em, .prototype-profile-name small, .prototype-profile-name strong, .prototype-profile-position').forEach(el=>{
      el.style.removeProperty('font-size');
      el.style.removeProperty('transform');
      el.style.removeProperty('transform-origin');
    });
  };
  const run=()=>requestAnimationFrame(()=>clearLegacyFits());
  document.addEventListener('DOMContentLoaded',run,{once:true});
  window.addEventListener('load',run,{once:true});
  new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});
})();
