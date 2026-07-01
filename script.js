document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".carousel").forEach((carousel) => {
        const track = carousel.querySelector(".carousel-track");
        const slides = carousel.querySelectorAll(".media-slide, .team-slide");
        const previousButton = carousel.querySelector(".prev");
        const nextButton = carousel.querySelector(".next");
        const dots = carousel.querySelectorAll(".carousel-dot");

        if (!track || slides.length === 0) return;

        let currentIndex = 0;
        let autoPlayTimer;

        function updateCarousel() {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;

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
            autoPlayTimer = setInterval(nextSlide, 4000);
        }

        function stopAutoPlay() {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
            }
        }

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

        carousel.addEventListener("mouseenter", stopAutoPlay);
        carousel.addEventListener("mouseleave", startAutoPlay);

        updateCarousel();
        startAutoPlay();
    });
});
