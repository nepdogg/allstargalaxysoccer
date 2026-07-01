document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = carousel.querySelectorAll(".media-slide, .team-slide");
    const previousButton = carousel.querySelector(".prev");
    const nextButton = carousel.querySelector(".next");
    const dots = carousel.querySelectorAll(".carousel-dot");

    let currentIndex = 0;
    let autoPlay;
    let isPaused = false;

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
        autoPlay = setInterval(() => {
            if (!isPaused) {
                nextSlide();
            }
        }, 5000);
    }

    function resetAutoPlay() {
        clearInterval(autoPlay);
        startAutoPlay();
    }

    if (previousButton) {
        previousButton.addEventListener("click", () => {
            previousSlide();
            resetAutoPlay();
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            nextSlide();
            resetAutoPlay();
        });
    }

    dots.forEach((dot, dotIndex) => {
        dot.addEventListener("click", () => {
            currentIndex = dotIndex;
            updateCarousel();
            resetAutoPlay();
        });
    });

    carousel.addEventListener("mouseenter", () => {
        isPaused = true;
    });

    carousel.addEventListener("mouseleave", () => {
        isPaused = false;
    });

    updateCarousel();
    startAutoPlay();
});
