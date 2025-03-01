// Loading state HTML template
const loadingHTML = `
  <div class="no-itineraries">
    <h2>Loading itineraries...</h2>
  </div>
`;

// Error state HTML template
const errorHTML = (message) => `
  <div class="no-itineraries">
    <h2>Error loading itineraries</h2>
    <p>${message || "Please try again later."}</p>
    <button onclick="location.reload()" class="btn">Retry</button>
  </div>
`;

// Empty state HTML template
const emptyHTML = `
  <div class="no-itineraries">
    <h2>No itineraries yet</h2>
    <p>Start planning your next trip!</p>
    <a href="home.html" class="btn">Plan a Trip</a>
  </div>
`;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("itinerariesList");
  container.innerHTML = loadingHTML;

  try {
    const response = await fetch("/user-itineraries");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load itineraries");
    }

    if (!data.itineraries || data.itineraries.length === 0) {
      container.innerHTML = emptyHTML;
      return;
    }

    renderItineraries(data.itineraries, container);
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML = errorHTML(error.message);
  }
});

function renderItineraries(itineraries, container) {
  container.innerHTML = itineraries
    .map((itinerary) => {
      // Validate required fields
      if (!itinerary || !itinerary.itinerary_name || !itinerary.days) {
        console.error("Invalid itinerary data:", itinerary);
        return "";
      }

      return `
        <div class="itinerary-card">
          ${renderItineraryHeader(itinerary)}
          <div class="days-container">
            ${renderDays(itinerary.days)}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderItineraryHeader(itinerary) {
  return `
    <div class="itinerary-header">
      <div>
        <h2 class="itinerary-title">${sanitizeHTML(
          itinerary.itinerary_name
        )}</h2>
        <div class="itinerary-meta">
          <span>📍 ${sanitizeHTML(
            itinerary.location || "Location not specified"
          )}</span>
          <span>📅 ${
            itinerary.travel_date
              ? formatDate(itinerary.travel_date)
              : "Date not specified"
          }</span>
        </div>
      </div>
      <div class="itinerary-meta">
        <span>⏱ ${itinerary.number_of_days || "?"} days</span>
        <span>✨ Created: ${
          itinerary.created_at
            ? formatDate(itinerary.created_at)
            : "Date not specified"
        }</span>
      </div>
    </div>
  `;
}

function renderDays(days) {
  return (days || [])
    .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
    .map((day) => {
      if (!day) return "";

      return `
        <div class="day-card">
          <div class="day-header">
            <h3>Day ${day.dayNumber || "?"}</h3>
          </div>
          <div class="activities-grid">
            ${renderActivity(day.hotel || {}, "Hotel")}
            ${renderActivity(day.restaurant || {}, "Restaurant")}
            ${renderActivity(day.attraction || {}, "Tourist Attraction")}
            ${renderActivity(day.activity || {}, "Activity")}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderActivity(activity, type) {
  if (!activity || !activity.name) return "";

  return `
    <div class="activity-card">
      ${renderActivityPhoto(activity)}
      <div class="activity-content">
        <div class="activity-type">${sanitizeHTML(type)}</div>
        <h4 class="activity-name">${sanitizeHTML(activity.name)}</h4>
      </div>
    </div>
  `;
}

function renderActivityPhoto(activity) {
  if (!activity.photo) return "";

  return `
    <div class="activity-photo-container">
      <img src="${sanitizeHTML(activity.photo)}" 
           alt="${sanitizeHTML(activity.name)}" 
           class="activity-photo"
           onerror="this.onerror=null; this.src='placeholder.jpg';">
    </div>
  `;
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    console.error("Date formatting error:", e);
    return "Invalid date";
  }
}

function sanitizeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
