// js/auth_borrower.js - Borrower authentication using API

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("borrowerLoginForm");

  if (!form) return; // Exit if form doesn't exist

  // Form submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const borrowerId = document.getElementById("borrowerId").value.trim();
    const password = document.getElementById("borrowerPassword").value.trim();

    if (!borrowerId || !password) {
      alert("Please fill in both Username and Password.");
      return;
    }

    // Validate student ID format
    if (!/^\d{2}-\d{6}$/.test(borrowerId)) {
      alert("Invalid Student ID format. Example: 23-140133");
      return;
    }

    try {
      console.log("🔍 Attempting borrower login for:", borrowerId);

      // Use API endpoint for authentication
      const response = await fetch('api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: borrowerId,
          password: password
        })
      });

      const data = await response.json();

      if (data.success && data.data.role === 'borrower') {
        console.log("✅ Borrower login successful");
        localStorage.setItem("borrowerId", borrowerId);
        localStorage.setItem("userRole", "borrower");
        alert("Login successful!");
        console.log("➡ Redirecting to borrower dashboard...");
        window.location.href = data.data.redirect || "borrower_dashboard.html";
      } else {
        alert(data.error || "Invalid credentials. Please check your Student ID and Password.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("An error occurred during login. Please try again.");
    }
  });
});
