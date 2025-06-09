// results.js
// Add these variables near the top of your results.js file
let placeCache = {}; // To store already fetched results
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

  // Replace your existing getPlacePhotos function with this:
  async function getPlacePhotos(place) {
    return new Promise((resolve) => {
      if (!place.photos || place.photos.length === 0) {
        console.log(`No photos available for ${place.name}`);
        resolve([]);
        return;
      }

      // Take up to 10 photos if available
      const photosToProcess = place.photos.slice(0, 10);

      const photos = photosToProcess.map((photo) => {
        return new Promise((resolvePhoto) => {
          try {
            const photoUrl = photo.getUrl({
              maxWidth: 800,
              maxHeight: 600,
            });
            resolvePhoto(photoUrl);
          } catch (error) {
            console.error(`Error getting photo for ${place.name}:`, error);
            resolvePhoto(null);
          }
        });
      });

      Promise.all(photos)
        .then((photoUrls) => {
          const validUrls = photoUrls.filter((url) => url !== null);
          console.log(
            `Retrieved ${validUrls.length} of ${photosToProcess.length} photos for ${place.name}`
          );
          resolve(validUrls);
        })
        .catch((error) => {
          console.error(`Failed to get photos for ${place.name}:`, error);
          resolve([]);
        });
    });
  }

  async function createPlaceCard(place) {
    const card = document.createElement("div");
    card.className = "place-card animate__animated animate__fadeIn";

    // Get place details for additional information
    const detailsPromise = new Promise((resolve) => {
      // Replace the existing service.getDetails call in createPlaceCard function with this:
      service.getDetails(
        {
          placeId: place.place_id,
          fields: [
            "formatted_phone_number",
            "website",
            "opening_hours",
            "price_level",
            "photos", // Request more photos
            // Request editorial summary
          ],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            resolve(result);
          } else {
            console.error("Error fetching place details:", status);
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

          // Store the results in localStorage based on type
          const storedResults = JSON.parse(
            localStorage.getItem("searchResults") || "{}"
          );
          storedResults[type] = filteredResults.map((place) => ({
            name: place.name,
            photo: place.photos ? place.photos[0].getUrl() : null,
            rating: place.rating,
            address: place.vicinity || place.formatted_address,
          }));
          localStorage.setItem("searchResults", JSON.stringify(storedResults));

          // Add places with staggered animation
          for (let i = 0; i < filteredResults.length; i++) {
            const card = await createPlaceCard(filteredResults[i]);
            setTimeout(() => {
              placesList.appendChild(card);
            }, i * 200);
          }
          if (results.length > filteredResults.length) {
            addShowMoreButton(container, type);
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
  // Add this function after your existing searchPlaces function
  function loadMorePlaces(type, container, page = 1) {
    const placesList = container.querySelector(".places-list");
    const loadingElement = document.createElement("div");
    loadingElement.className = "loading";
    loadingElement.textContent = "Loading more places...";
    placesList.appendChild(loadingElement);

    try {
      const request = {
        query: `${type} in ${searchParams.location}`,
        type: type,
      };

      service.textSearch(request, async (results, status) => {
        // Remove the loading element
        placesList.removeChild(loadingElement);

        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const maxPriceLevel = Math.ceil(searchParams.maxPrice / 100);
          // Skip the first 5 places (already shown) and take the next 5
          const startIndex = page * 5;
          const filteredResults = results
            .filter(
              (place) =>
                !place.price_level || place.price_level <= maxPriceLevel
            )
            .slice(startIndex, startIndex + 5);

          if (filteredResults.length === 0) {
            const noMoreElement = document.createElement("div");
            noMoreElement.className = "error";
            noMoreElement.textContent = "No more places available";
            placesList.appendChild(noMoreElement);

            // Hide the "Show More" button if it exists
            const showMoreBtn = container.querySelector(".show-more-btn");
            if (showMoreBtn) {
              showMoreBtn.style.display = "none";
            }
            return;
          }

          // Add places with staggered animation
          for (let i = 0; i < filteredResults.length; i++) {
            const card = await createPlaceCard(filteredResults[i]);
            setTimeout(() => {
              placesList.appendChild(card);
            }, i * 200);
          }

          // Update the "Show More" button's page attribute
          const showMoreBtn = container.querySelector(".show-more-btn");
          if (showMoreBtn) {
            showMoreBtn.setAttribute("data-page", page + 1);
          }
        } else {
          const errorElement = document.createElement("div");
          errorElement.className = "error";
          errorElement.textContent =
            "Error loading more places. Please try again later.";
          placesList.appendChild(errorElement);
        }
      });
    } catch (error) {
      console.error("Load more error:", error);
    }
  }

  // Add this function after the searchPlaces function to add "Show More" buttons
  function addShowMoreButton(container, type) {
    // Check if a button already exists
    if (container.querySelector(".show-more-btn")) {
      return;
    }

    const button = document.createElement("button");
    button.className = "show-more-btn";
    button.textContent = "Show More";
    button.setAttribute("data-page", 1);
    button.setAttribute("data-type", type);

    button.addEventListener("click", function () {
      const page = parseInt(this.getAttribute("data-page"));
      const placeType = this.getAttribute("data-type");
      loadMorePlaces(placeType, container, page);
    });

    container.appendChild(button);
  }

  // Modify your existing searchPlaces function to add the "Show More" button
  // Add this at the end of your searchPlaces function, right before the final closing bracket
  // Insert this code right after the for loop that adds place cards in the searchPlaces function:

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
