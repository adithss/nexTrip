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
        <div class="itinerary-preview">
          <div onclick="viewItinerary('${itinerary.id}')">
            <h3 style="font-size:1.5rem">${itinerary.itinerary_name}</h3>
            <br>
            <p style="color:white; font-size:0.8vw">Location: ${
              itinerary.location
            }</p>
            <p>Date: ${new Date(itinerary.travel_date).toLocaleDateString()}</p>
            <p>Duration: ${itinerary.number_of_days} days</p>
          </div>
          <button class="delete-btn" onclick="deleteItinerary(event, '${
            itinerary.id
          }')">Delete</button>
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

async function deleteItinerary(event, id) {
  // Prevent event bubbling to parent (which would trigger viewItinerary)
  event.stopPropagation();

  if (confirm("Are you sure you want to delete this itinerary?")) {
    try {
      const response = await fetch(`/delete-itinerary/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Remove the itinerary from the DOM
        const itineraryElement = event.target.closest(".itinerary-preview");
        itineraryElement.remove();

        // Check if there are any itineraries left
        const container = document.getElementById("itinerariesList");
        if (!container.querySelector(".itinerary-preview")) {
          container.innerHTML = `
            <div class="no-itineraries">
              <h2>No itineraries yet</h2>
              <p>Start planning your next trip!</p>
              <a href="home.html" class="btn">Plan a Trip</a>
            </div>
          `;
        }
      } else {
        alert("Error deleting itinerary: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting itinerary. Please try again later.");
    }
  }
}
