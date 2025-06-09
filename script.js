document.addEventListener("DOMContentLoaded", function () {
  const wrapper = document.querySelector(".wrapper");
  const register = document.querySelector(".register");
  const loginLink = document.querySelector(".login-link");
  const registerLink = document.querySelector(".register-link");

  // Toggle between login and register forms
  registerLink.addEventListener("click", () => {
    wrapper.style.display = "none";
    register.style.display = "block";
  });

  loginLink.addEventListener("click", () => {
    register.style.display = "none";
    wrapper.style.display = "block";
  });

  // Handle login form submission
  document.getElementById("myForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("user1").value;
    const password = document.getElementById("pass1").value;

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "/home";
        // Redirect or update UI as needed
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during login");
    }
  });

  // Handle registration form submission
  document.getElementById("myForm2").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("user").value;
    const email = document.getElementById("mail").value;
    const password = document.getElementById("pass").value;

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");
        // Switch to login form
        register.style.display = "none";
        wrapper.style.display = "block";
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during registration");
    }
  });
});
