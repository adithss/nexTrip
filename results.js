// results.js
document.addEventListener("DOMContentLoaded", () => {
  // Retrieve search parameters from localStorage
  const searchParams = JSON.parse(localStorage.getItem("searchParams"));
  if (!searchParams) {
    window.location.href = "home.html";
    return;
  }

  // Update summary
  const summaryElement = document.getElementById("summary");
  const formattedDate = new Date(searchParams.date).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  summaryElement.textContent = `Discovering ${searchParams.location} for your trip on ${formattedDate}
      (Budget: $${searchParams.maxPrice})`;

  // Initialize Places service
  const service = new google.maps.places.PlacesService(
    document.createElement("div")
  );

  // Photo modal setup
  const modal = document.getElementById("photoModal");
  const modalImg = document.getElementById("modalImg");
  const photoNav = document.getElementById("photoNav");
  let currentPhotoIndex = 0;
  let currentPhotos = [];

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Close modal with X button
  document.querySelector(".close-modal").addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Add keyboard navigation for modal
  document.addEventListener("keydown", (e) => {
    if (modal.style.display === "flex") {
      if (e.key === "Escape") {
        modal.style.display = "none";
      } else if (e.key === "ArrowLeft" && currentPhotoIndex > 0) {
        showPhoto(currentPhotoIndex - 1);
      } else if (
        e.key === "ArrowRight" &&
        currentPhotoIndex < currentPhotos.length - 1
      ) {
        showPhoto(currentPhotoIndex + 1);
      }
    }
  });

  function showPhoto(index) {
    currentPhotoIndex = index;
    modalImg.src = currentPhotos[index];

    // Update navigation dots
    const dots = photoNav.querySelectorAll(".photo-nav-dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  function createPhotoNavigation(photos) {
    photoNav.innerHTML = "";
    photos.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.className = `photo-nav-dot ${index === 0 ? "active" : ""}`;
      dot.addEventListener("click", () => showPhoto(index));
      photoNav.appendChild(dot);
    });
  }

  async function getPlacePhotos(place) {
    return new Promise((resolve) => {
      if (!place.photos) {
        resolve([]);
        return;
      }

      const photos = place.photos.map((photo) => {
        return new Promise((resolvePhoto) => {
          try {
            const photoUrl = photo.getUrl({
              maxWidth: 800,
              maxHeight: 600,
            });
            resolvePhoto(photoUrl);
          } catch (error) {
            resolvePhoto(null);
          }
        });
      });

      Promise.all(photos)
        .then((photoUrls) => resolve(photoUrls.filter((url) => url !== null)))
        .catch(() => resolve([]));
    });
  }

  async function createPlaceCard(place) {
    const card = document.createElement("div");
    card.className = "place-card animate__animated animate__fadeIn";

    // Get place details for additional information
    const detailsPromise = new Promise((resolve) => {
      service.getDetails(
        {
          placeId: place.place_id,
          fields: [
            "formatted_phone_number",
            "website",
            "opening_hours",
            "price_level",
          ],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            resolve(result);
          } else {
            resolve({});
          }
        }
      );
    });

    const details = await detailsPromise;
    const priceLevel = "💰".repeat(
      place.price_level || details.price_level || 1
    );
    const rating = "⭐".repeat(Math.round(place.rating || 0));
    const reviews = place.user_ratings_total
      ? `(${place.user_ratings_total} reviews)`
      : "(No reviews yet)";

    // Get photos for the place
    const photos = await getPlacePhotos(place);
    const photoHTML =
      photos.length > 0
        ? `
          <img src="${photos[0]}" alt="${
            place.name
          }" class="place-photo" loading="lazy">
          ${
            photos.length > 1
              ? `
              <div class="photo-grid">
                  ${photos
                    .slice(1, 4)
                    .map(
                      (photo) => `
                      <img src="${photo}" alt="Additional photo of ${place.name}" class="additional-photo" loading="lazy">
                  `
                    )
                    .join("")}
              </div>
          `
              : ""
          }
      `
        : `
          <div class="photo-placeholder">
              <span>No photo available</span>
          </div>
      `;

    // Additional details HTML
    const additionalDetails = `
          ${
            details.formatted_phone_number
              ? `
              <div class="place-phone">📞 ${details.formatted_phone_number}</div>
          `
              : ""
          }
          ${
            details.website
              ? `
              <div class="place-website">
                  <a href="${details.website}" target="_blank" rel="noopener noreferrer">🌐 Visit Website</a>
              </div>
          `
              : ""
          }
          ${
            details.opening_hours
              ? `
              <div class="place-hours">
                  ${
                    details.opening_hours.isOpen()
                      ? '<span class="open-now">✅ Open Now</span>'
                      : '<span class="closed-now">❌ Closed Now</span>'
                  }
              </div>
          `
              : ""
          }
      `;

    card.innerHTML = `
          ${photoHTML}
          <div class="place-name">${place.name}</div>
          <div class="price-level">${priceLevel}</div>
          <div class="place-rating">${rating} ${reviews}</div>
          <div class="place-address">${
            place.vicinity || place.formatted_address
          }</div>
          ${additionalDetails}
      `;

    // Add click handlers for photos
    if (photos.length > 0) {
      const allPhotos = card.querySelectorAll(
        ".place-photo, .additional-photo"
      );
      allPhotos.forEach((photo, index) => {
        photo.addEventListener("click", () => {
          currentPhotos = photos;
          modal.style.display = "flex";
          createPhotoNavigation(photos);
          showPhoto(index);
        });
      });
    }

    return card;
  }

  function showError(container, message) {
    container.innerHTML = `
          <div class="error animate__animated animate__fadeIn">
              ${message}
          </div>
      `;
  }

  async function searchPlaces(type, container) {
    const placesList = container.querySelector(".places-list");
    placesList.innerHTML =
      '<div class="loading">Finding the best places for you...</div>';

    try {
      const request = {
        query: `${type} in ${searchParams.location}`,
        type: type,
      };

      service.textSearch(request, async (results, status) => {
        placesList.innerHTML = "";

        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const maxPriceLevel = Math.ceil(searchParams.maxPrice / 100);
          const filteredResults = results
            .filter(
              (place) =>
                !place.price_level || place.price_level <= maxPriceLevel
            )
            .slice(0, 5);

          if (filteredResults.length === 0) {
            showError(
              placesList,
              "No places found within your budget. Try increasing your budget or searching nearby areas."
            );
            return;
          }

          // Sort results by rating
          filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));

          // Add places with staggered animation
          for (let i = 0; i < filteredResults.length; i++) {
            const card = await createPlaceCard(filteredResults[i]);
            setTimeout(() => {
              placesList.appendChild(card);
            }, i * 200);
          }
        } else {
          showError(
            placesList,
            "Error loading places. Please try again later."
          );
        }
      });
    } catch (error) {
      showError(placesList, "An unexpected error occurred. Please try again.");
      console.error("Search error:", error);
    }
  }

  // Define searches for different types of places
  const searches = [
    { type: "lodging", container: document.getElementById("hotels") },
    { type: "restaurant", container: document.getElementById("restaurants") },
    {
      type: "tourist_attraction",
      container: document.getElementById("attractions"),
    },
    {
      type: "point_of_interest",
      container: document.getElementById("activities"),
    },
  ];

  // Execute searches with slight delay between each
  searches.forEach((search, index) => {
    setTimeout(() => {
      searchPlaces(search.type, search.container);
    }, index * 300);
  });
});
