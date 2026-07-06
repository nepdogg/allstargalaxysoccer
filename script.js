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

            if (isShowcaseCarousel) {
                /*
                 * Center the active playlist card using its real rendered position.
                 * This keeps the selected card centered even when CSS scale, gaps,
                 * padding, or responsive sizing change the visible card width.
                 */
                const carouselRect = carousel.getBoundingClientRect();
                const slideRect = targetSlide.getBoundingClientRect();
                const transform = window.getComputedStyle(track).transform;
                let currentTranslateX = 0;

                if (transform && transform !== "none") {
                    const matrixValues = transform.match(/matrix.*\((.+)\)/);
                    if (matrixValues) {
                        const values = matrixValues[1].split(",").map((value) => parseFloat(value.trim()));
                        currentTranslateX = values.length === 6 ? values[4] : values[12] || 0;
                    }
                }

                const carouselCenter = carouselRect.left + (carouselRect.width / 2);
                const slideCenter = slideRect.left + (slideRect.width / 2);
                const correction = slideCenter - carouselCenter;
                const nextTranslateX = currentTranslateX - correction;

                track.style.transform = `translateX(${nextTranslateX}px)`;
            } else {
                const slideLeft = targetSlide ? targetSlide.offsetLeft : 0;
                track.style.transform = `translateX(-${slideLeft}px)`;
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

});
