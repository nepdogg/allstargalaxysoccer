document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".carousel").forEach((carousel) => {
        const track = carousel.querySelector(".carousel-track");
        const slides = Array.from(carousel.querySelectorAll(".media-slide, .team-slide"));
        const previousButton = carousel.querySelector(".prev");
        const nextButton = carousel.querySelector(".next");
        const dotsContainer = carousel.querySelector(".carousel-dots");
        const isHomepagePlaylist = carousel.classList.contains("homepage-media-carousel");

        if (!track || slides.length === 0) {
            return;
        }

        let currentIndex = 0;
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

            if (isHomepagePlaylist) {
                const carouselCenter = carousel.clientWidth / 2;
                const slideCenter = targetSlide.offsetLeft + (targetSlide.offsetWidth / 2);
                const targetOffset = Math.max(0, slideCenter - carouselCenter);
                track.style.transform = `translateX(-${targetOffset}px)`;
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
            autoPlayTimer = setInterval(nextSlide, isHomepagePlaylist ? 6500 : 4500);
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
});
