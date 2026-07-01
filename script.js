document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = carousel.querySelectorAll(".media-slide, .team-slide");
    const previousButton = carousel.querySelector(".prev");
    const nextButton = carousel.querySelector(".next");
    const dots = carousel.querySelectorAll(".carousel-dot");

    let currentIndex = 0;

    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === currentIndex);
        });
    }

    if (previousButton) {
        previousButton.addEventListener("click", () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        });
    }

    dots.forEach((dot, dotIndex) => {
        dot.addEventListener("click", () => {
            currentIndex = dotIndex;
            updateCarousel();
        });
    });

    updateCarousel();
});
