document.addEventListener("DOMContentLoaded", async () => {
  const selectedId = localStorage.getItem("selectedItineraryId");
  if (!selectedId) {
    window.location.href = "manage-itineraries.html";
    return;
  }

  try {
    const response = await fetch("/user-itineraries");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    const selectedItinerary = data.itineraries.find((i) => i.id === selectedId);
    if (!selectedItinerary) {
      throw new Error("Itinerary not found");
    }

    const container = document.getElementById("itinerariesList");
    container.innerHTML = `
            <div class="itinerary-card">
                <div class="itinerary-header">
                    <div>
                        <h2>${selectedItinerary.itinerary_name}</h2>
                        <p>Location: ${selectedItinerary.location}</p>
                        <p>Date: ${new Date(
                          selectedItinerary.travel_date
                        ).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p>Duration: ${
                          selectedItinerary.number_of_days
                        } days</p>
                        <p>Created: ${new Date(
                          selectedItinerary.created_at
                        ).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="days-container">
                    ${selectedItinerary.days
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
        `;
  } catch (error) {
    console.error("Detailed error:", error);
    document.getElementById("itinerariesList").innerHTML = `
      <div class="error">
        ${error.message}
        <br><br>
        <a href="manage-itineraries.html" class="btn">Back to Itineraries</a>
      </div>
    `;
  }
});
