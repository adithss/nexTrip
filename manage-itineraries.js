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
            <div class="itinerary-preview" onclick="viewItinerary('${
              itinerary.id
            }')">
                <h3>${itinerary.itinerary_name}</h3>
                <p>Location: ${itinerary.location}</p>
                <p>Date: ${new Date(
                  itinerary.travel_date
                ).toLocaleDateString()}</p>
                <p>Duration: ${itinerary.number_of_days} days</p>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("itinerariesList").innerHTML = `
            <div class="error">Error loading itineraries. Please try again later.</div>
        `;
  }
});

function viewItinerary(id) {
  localStorage.setItem("selectedItineraryId", id);
  window.location.href = "view-itinerary.html";
}
