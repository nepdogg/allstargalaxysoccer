document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".carousel").forEach((carousel) => {
        const track = carousel.querySelector(".carousel-track");
        const slides = Array.from(carousel.querySelectorAll(".media-slide, .team-slide, .team-card-slide"));
        const previousButton = carousel.querySelector(".prev");
        const nextButton = carousel.querySelector(".next");
        const dotsContainer = carousel.querySelector(".carousel-dots");
        const isHomepagePlaylist = carousel.classList.contains("homepage-media-carousel");
        const isTeamRoster = carousel.classList.contains("team-roster-carousel");
        const isShowcaseCarousel = isHomepagePlaylist || isTeamRoster;

        if (!track || slides.length === 0) {
            return;
        }

        let currentIndex = carousel.classList.contains("team-roster-carousel") ? 4 : 0;
        let autoPlayTimer;

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
                // This avoids the tiny visual drift that happened with flex-track
                // translate calculations after card scaling and spacing changes.
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

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayTimer = setInterval(nextSlide, isShowcaseCarousel ? 6500 : 4500);
        }

        function stopAutoPlay() {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
            }
        }

        carousel.querySelectorAll(".playlist-pending").forEach((pendingLink) => {
            pendingLink.addEventListener("click", (event) => event.preventDefault());
        });

        previousButton?.addEventListener("click", () => {
            previousSlide();
            startAutoPlay();
        });

        nextButton?.addEventListener("click", () => {
            nextSlide();
            startAutoPlay();
        });

        dots.forEach((dot, dotIndex) => {
            dot.addEventListener("click", () => {
                currentIndex = dotIndex;
                updateCarousel();
                startAutoPlay();
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
                startAutoPlay();
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
