// js/auth_admin.js - Admin authentication using API

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");

  // Form submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const adminId = document.getElementById("adminId").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!adminId || !password) {
      alert("Please fill in both Admin ID and Password.");
      return;
    }

    try {
      console.log("🔍 Attempting admin login for:", adminId);

      // Use API endpoint for authentication
      const response = await fetch('api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: adminId,
          password: password
        })
      });

      const data = await response.json();

      if (data.success && data.data.role === 'admin') {
        console.log("✅ Admin login successful");
        localStorage.setItem("adminId", adminId);
        localStorage.setItem("userRole", "admin");
        alert("Login successful!");
        console.log("➡ Redirecting to dashboard...");
        window.location.href = data.data.redirect || "admin_dboard.html";
      } else {
        alert(data.error || "Invalid credentials. Please check your Admin ID and Password.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("An error occurred during login. Please try again.");
    }
  });
});
