// js/auth_unified.js - Unified authentication using API

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  // Helper function to show error message
  function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    const passwordInput = document.getElementById("password");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.add("show");
      passwordInput.classList.add("is-invalid");
    }
  }

  // Helper function to hide error message
  function hideError() {
    const errorDiv = document.getElementById("errorMessage");
    const passwordInput = document.getElementById("password");
    if (errorDiv) {
      errorDiv.classList.remove("show");
      errorDiv.textContent = "";
      passwordInput.classList.remove("is-invalid");
    }
  }

  // Clear error when user starts typing
  const passwordInput = document.getElementById("password");
  const studentIdInput = document.getElementById("studentId");
  if (passwordInput) {
    passwordInput.addEventListener("input", hideError);
  }
  if (studentIdInput) {
    studentIdInput.addEventListener("input", hideError);
  }

  // Form submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError(); // Clear any previous errors

    const studentId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!studentId || !password) {
      showError("Please fill in both Username and Password.");
      return;
    }

    try {
      console.log("🔍 Attempting login for:", studentId);

      // Use API endpoint for authentication
      const response = await fetch('api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: studentId,
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Login successful:", data.data);
        
        // Store user info
        if (data.data.role === 'admin') {
          localStorage.setItem("adminId", studentId);
          localStorage.setItem("userRole", "admin");
          console.log("➡ Redirecting to admin dashboard...");
          window.location.href = data.data.redirect || "admin_dboard.html";
        } else if (data.data.role === 'borrower') {
          localStorage.setItem("borrowerId", studentId);
          localStorage.setItem("userRole", "borrower");
          console.log("➡ Redirecting to borrower dashboard...");
          window.location.href = data.data.redirect || "borrower_dashboard.html";
        }
      } else {
        showError(data.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      showError("An error occurred during login. Please try again.");
    }
  });
});
