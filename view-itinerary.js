// view-itinerary.js
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/user-itineraries");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    const container = document.getElementById("itinerariesList");

    if (data.itineraries.length === 0) {
      container.innerHTML = `
                <div class="no-itineraries">
                    <h2>No itineraries yet</h2>
                    <p>Start planning your next trip!</p>
                    <a href="home.html" class="btn">Plan a Trip</a>
                </div>
            `;
      return;
    }

    container.innerHTML = data.itineraries
      .map(
        (itinerary) => `
            <div class="itinerary-card">
                <div class="itinerary-header">
                    <div>
                        <h2>${itinerary.itinerary_name}</h2>
                        <p>Location: ${itinerary.location}</p>
                        <p>Date: ${new Date(
                          itinerary.travel_date
                        ).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p>Duration: ${itinerary.number_of_days} days</p>
                        <p>Created: ${new Date(
                          itinerary.created_at
                        ).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="days-container">
                    ${itinerary.days
                      .map(
                        (day) => `
                        <div class="day-card">
                            <h3>Day ${day.dayNumber}</h3>
                            ${
                              day.hotel.name
                                ? `
                                <div class="activity-item">
                                    ${
                                      day.hotel.photo
                                        ? `<img src="${day.hotel.photo}" alt="${day.hotel.name}" class="activity-photo">`
                                        : ""
                                    }
                                    <div>
                                        <h4>Hotel</h4>
                                        <p>${day.hotel.name}</p>
                                    </div>
                                </div>
                            `
                                : ""
                            }
                            ${
                              day.restaurant.name
                                ? `
                                <div class="activity-item">
                                    ${
                                      day.restaurant.photo
                                        ? `<img src="${day.restaurant.photo}" alt="${day.restaurant.name}" class="activity-photo">`
                                        : ""
                                    }
                                    <div>
                                        <h4>Restaurant</h4>
                                        <p>${day.restaurant.name}</p>
                                    </div>
                                </div>
                            `
                                : ""
                            }
                            ${
                              day.attraction.name
                                ? `
                                <div class="activity-item">
                                    ${
                                      day.attraction.photo
                                        ? `<img src="${day.attraction.photo}" alt="${day.attraction.name}" class="activity-photo">`
                                        : ""
                                    }
                                    <div>
                                        <h4>Tourist Attraction</h4>
                                        <p>${day.attraction.name}</p>
                                    </div>
                                </div>
                            `
                                : ""
                            }
                            ${
                              day.activity.name
                                ? `
                                <div class="activity-item">
                                    ${
                                      day.activity.photo
                                        ? `<img src="${day.activity.photo}" alt="${day.activity.name}" class="activity-photo">`
                                        : ""
                                    }
                                    <div>
                                        <h4>Activity</h4>
                                        <p>${day.activity.name}</p>
                                    </div>
                                </div>
                            `
                                : ""
                            }
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("itinerariesList").innerHTML = `
            <div class="error">
                Error loading itineraries. Please try again later.
            </div>
        `;
  }
});
