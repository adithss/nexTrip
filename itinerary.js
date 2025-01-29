// itinerary.js
document.addEventListener("DOMContentLoaded", () => {
  // Get search params from localStorage
  const searchParams = JSON.parse(localStorage.getItem("searchParams"));
  if (!searchParams) {
    window.location.href = "home.html";
    return;
  }

  // Display trip info
  const tripInfo = document.getElementById("tripInfo");
  const formattedDate = new Date(searchParams.date).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  tripInfo.innerHTML = `Destination: ${searchParams.location}<br>Date: ${formattedDate}`;
});

let savedPlaces = {
  hotels: [],
  restaurants: [],
  attractions: [],
  activities: [],
};

// Load saved places from results
function loadSavedPlaces() {
  const results = JSON.parse(localStorage.getItem("searchResults") || "{}");

  savedPlaces.hotels = formatPlaces(results.lodging || []);
  savedPlaces.restaurants = formatPlaces(results.restaurant || []);
  savedPlaces.attractions = formatPlaces(results.tourist_attraction || []);
  savedPlaces.activities = formatPlaces(results.point_of_interest || []);
}

function formatPlaces(places) {
  return places.map((place) => ({
    name: place.name,
    photo: place.photo,
    rating: place.rating,
    address: place.address,
  }));
}

function generateDays() {
  loadSavedPlaces(); // Reload saved places
  const numDays = document.getElementById("numDays").value;
  const container = document.getElementById("daysContainer");
  container.innerHTML = "";

  for (let i = 1; i <= numDays; i++) {
    const dayHTML = `
          <div class="day-container" id="day-${i}">
              <h2 class="day-title">Day ${i}</h2>
              <div class="activity-selector">
                  ${createActivityCard("hotel", i, savedPlaces.hotels)}
                  ${createActivityCard(
                    "restaurant",
                    i,
                    savedPlaces.restaurants
                  )}
                  ${createActivityCard(
                    "attraction",
                    i,
                    savedPlaces.attractions
                  )}
                  ${createActivityCard("activity", i, savedPlaces.activities)}
              </div>
          </div>
      `;
    container.insertAdjacentHTML("beforeend", dayHTML);
  }
}

function createActivityCard(type, day, options) {
  const title = type.charAt(0).toUpperCase() + type.slice(1);
  return `
      <div class="activity-card">
          <h3>${title}</h3>
          <select onchange="updateSelection('${type}', ${day}, this)">
              <option value="">Select a ${type}...</option>
              ${options
                .map(
                  (option) => `
                  <option value="${option.name}|${option.photo || ""}|${
                    option.address || ""
                  }">
                      ${option.name}
                  </option>
              `
                )
                .join("")}
          </select>
          <div id="${type}-selection-${day}" class="selected-item"></div>
      </div>
  `;
}

function updateSelection(type, day, selectElement) {
  const [name, photo, address] = selectElement.value.split("|");
  const container = document.getElementById(`${type}-selection-${day}`);

  if (name) {
    container.innerHTML = `
          <div><strong>${name}</strong></div>
          ${address ? `<div class="address">${address}</div>` : ""}
          ${photo ? `<img src="${photo}" alt="${name}">` : ""}
      `;
  } else {
    container.innerHTML = "";
  }
}

async function saveItinerary() {
  const numDays = document.getElementById("numDays").value;
  if (!numDays) {
    alert("Please select number of days first");
    return;
  }

  const searchParams = JSON.parse(localStorage.getItem("searchParams"));
  const itineraryData = {
    location: searchParams.location,
    startDate: searchParams.date,
    numDays: parseInt(numDays),
    days: [],
  };

  for (let i = 1; i <= numDays; i++) {
    const dayData = {
      dayNumber: i,
      hotel: getSelection("hotel", i),
      restaurant: getSelection("restaurant", i),
      attraction: getSelection("attraction", i),
      activity: getSelection("activity", i),
    };
    itineraryData.days.push(dayData);
  }

  try {
    const response = await fetch("/save-itinerary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itineraryData),
    });

    const result = await response.json();
    if (result.success) {
      alert("Itinerary saved successfully!");
      window.location.href = "view-itinerary.html";
    } else {
      alert("Error saving itinerary: " + result.message);
    }
  } catch (error) {
    console.error("Error saving itinerary:", error);
    alert("Error saving itinerary. Please try again.");
  }
}

function getSelection(type, day) {
  const select = document.querySelector(
    `#day-${day} select[onchange*="${type}"]`
  );
  const [name, photo, address] = (select.value || "||").split("|");
  return { name, photo, address };
}
