document.addEventListener("DOMContentLoaded", () => {
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
            const selectedImage = selectedCard.querySelector("img");
            const imageSrc = selectedCard.getAttribute("href") || selectedImage?.getAttribute("src");
            const imageAlt = selectedImage?.getAttribute("alt") || `Allstar Galaxy player card ${activePlayerIndex + 1}`;

            if (!imageSrc || !lightboxImage) return;

            lightboxImage.src = imageSrc;
            lightboxImage.alt = imageAlt;

            if (openOriginal) {
                openOriginal.href = imageSrc;
            }
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
document.addEventListener("DOMContentLoaded", () => {
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

    function setLink(link, value) {
        if (!link) return;
        link.href = value || "#";
        link.classList.toggle("is-disabled", !value || value === "#");
    }

    function openGameLightbox(card) {
        if (title) title.textContent = card.dataset.gameTitle || "Game Media";
        if (opponent) opponent.textContent = card.dataset.gameOpponent || "Allstar Galaxy";
        if (result) result.textContent = card.dataset.gameResult || "";
        setLink(fullLink, card.dataset.full);
        setLink(highlightsLink, card.dataset.highlights);
        setLink(slideshowLink, card.dataset.slideshow);
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
