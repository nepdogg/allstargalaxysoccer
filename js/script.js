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
        const isMediaShowcase = carousel.classList.contains("media-games-carousel") || carousel.classList.contains("media-season-carousel") || carousel.classList.contains("media-playlist-carousel");
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
            if (carousel.classList.contains("media-season-carousel")) return 9000;
            if (carousel.classList.contains("media-playlist-carousel")) return 12000;
            return isShowcaseCarousel ? 6500 : 4500;
        }

        function getInitialDelay() {
            if (carousel.classList.contains("media-season-carousel")) return 3000;
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
            const front = selectedCard.querySelector(".ultimate-player-frame")?.cloneNode(true);
            if (!front) return;
            const value = (key, fallback="N/A") => selectedCard.dataset[key] || fallback;
            const advanced = String(selectedCard.dataset.playerMode || "standard").toLowerCase() === "advanced" ||
              ["playerDob","playerNationality","playerFoot","playerHeight","playerWeight","playerQuote"].some(k => String(selectedCard.dataset[k]||"").trim());
            stage.innerHTML = "";
            const toolbar = document.createElement("div");
            toolbar.className = "ultimate-profile-toolbar";
            toolbar.innerHTML = `<button type="button" class="ultimate-tab is-active" data-card-view="front">Front Card</button>${advanced?'<button type="button" class="ultimate-tab" data-card-view="profile">Profile Card</button>':''}<a class="ultimate-open-photo" href="${value("playerImage", "#")}" target="_blank" rel="noopener">Open Full Player Photo</a>`;
            stage.appendChild(toolbar);
            const deck = document.createElement("div");
            deck.className = "ultimate-card-deck" + (advanced ? " is-advanced" : "");
            front.classList.add("ultimate-view-card","is-active");
            front.dataset.cardPanel = "front";
            deck.appendChild(front);
            if (advanced) {
                const profile = document.createElement("section");
                profile.className = "ultimate-profile-card ultimate-view-card";
                profile.dataset.cardPanel = "profile";
                profile.innerHTML = `
                  <div class="ultimate-profile-top"><div><b>${value("playerNumber","00")}</b><span class="ultimate-profile-position">${value("playerPosition","PLAYER")}</span></div><img src="images/logos/logo.png" alt="Allstar Galaxy"></div>
                  <div class="ultimate-profile-name"><small>${value("playerFirst","PLAYER")}</small><strong>${value("playerLast","PROFILE")}</strong></div>
                  <div class="ultimate-profile-rows">
                    <div class="ultimate-profile-row"><span>Date of Birth</span><b>${value("playerDob")}</b></div>
                    <div class="ultimate-profile-row"><span>Nationality</span><b>${value("playerNationality")}</b></div>
                    <div class="ultimate-profile-row"><span>Preferred Foot</span><b>${value("playerFoot")}</b></div>
                    <div class="ultimate-profile-row"><span>Height</span><b>${value("playerHeight")}</b></div>
                    <div class="ultimate-profile-row"><span>Weight</span><b>${value("playerWeight")}</b></div>
                  </div>
                  <p class="ultimate-profile-quote">“${value("playerQuote","ALLSTAR GALAXY") }”</p>`;
                deck.appendChild(profile);
            }
            stage.appendChild(deck);
            toolbar.querySelectorAll(".ultimate-tab").forEach(btn=>btn.addEventListener("click",()=>{
              toolbar.querySelectorAll(".ultimate-tab").forEach(x=>x.classList.toggle("is-active",x===btn));
              deck.querySelectorAll(".ultimate-view-card").forEach(card=>card.classList.toggle("is-active",card.dataset.cardPanel===btn.dataset.cardView));
            }));
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


// Media page game-card lightbox for Full Match / Highlights / Slideshow links.
document.addEventListener("DOMContentLoaded", async () => {
    if (window.ASGContent?.ready) await window.ASGContent.ready;
    const gameCards = Array.from(document.querySelectorAll(".media-game-slide"));
    const gameLightbox = document.getElementById("gameLinkLightbox");

    if (!gameCards.length || !gameLightbox) return;

    const title = gameLightbox.querySelector(".game-link-title");
    const opponent = gameLightbox.querySelector(".game-link-opponent");
    const result = gameLightbox.querySelector(".game-link-result");
    const fullLink = gameLightbox.querySelector(".game-link-full");
    const highlightsLink = gameLightbox.querySelector(".game-link-highlights");
    const slideshowLink = gameLightbox.querySelector(".game-link-slideshow");
    const closeButton = gameLightbox.querySelector(".game-link-close");

    function setLink(link, value, availableLabel, unavailableLabel) {
        if (!link) return;
        const unavailable = !value || value === "#";
        link.href = unavailable ? "#" : value;
        link.classList.toggle("is-disabled", unavailable);
        link.setAttribute("aria-disabled", unavailable ? "true" : "false");
        link.tabIndex = unavailable ? -1 : 0;
        link.textContent = unavailable ? unavailableLabel : availableLabel;
    }

    function openGameLightbox(card) {
        if (title) title.textContent = card.dataset.gameTitle || "Game Media";
        if (opponent) opponent.textContent = card.dataset.gameOpponent || "Allstar Galaxy";
        if (result) result.textContent = card.dataset.gameResult || "";
        const fullLabel = card.dataset.fullLabel || "▶ Full Match";
        const highlightsLabel = card.dataset.highlightsLabel || "▣ Highlights";
        const slideshowLabel = card.dataset.slideshowLabel || "▧ Slideshow";
        setLink(fullLink, card.dataset.full, fullLabel, "▶ Full Match — Coming Soon");
        setLink(highlightsLink, card.dataset.highlights, highlightsLabel, "▣ Highlights — Coming Soon");
        setLink(slideshowLink, card.dataset.slideshow, slideshowLabel, "▧ Slideshow — Coming Soon");
        gameLightbox.classList.add("is-open");
        gameLightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("lightbox-open");
        closeButton?.focus();
    }

    function closeGameLightbox() {
        gameLightbox.classList.remove("is-open");
        gameLightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("lightbox-open");
    }

    gameCards.forEach((card) => {
        card.addEventListener("click", (event) => {
            event.preventDefault();
            openGameLightbox(card);
        });
    });

    closeButton?.addEventListener("click", closeGameLightbox);
    gameLightbox.addEventListener("click", (event) => {
        if (event.target === gameLightbox) closeGameLightbox();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && gameLightbox.classList.contains("is-open")) {
            closeGameLightbox();
        }
    });
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
