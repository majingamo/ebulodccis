// js/auth_unified.js - Unified authentication that checks both admins and borrowers

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Firebase Config
  const firebaseConfig = {
    apiKey: "AIzaSyB-I8YDtDaGJ--uIw5ppePzxutvdnHYCYg",
    authDomain: "studio-5277928304-db252.firebaseapp.com",
    projectId: "studio-5277928304-db252",
    storageBucket: "studio-5277928304-db252.firebasestorage.app",
    messagingSenderId: "489996060233",
    appId: "1:489996060233:web:e088e281498e8499952198",
  };

  // ✅ Initialize Firebase (only once)
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();
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

  // ✅ Form submit handler
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
      console.log("🔍 Checking Firestore for:", studentId);

      // Check admin collection first
      const adminDocRef = db.collection("admins").doc(studentId);
      const adminDoc = await adminDocRef.get();

      if (adminDoc.exists) {
        const adminData = adminDoc.data();
        console.log("✅ Found admin account:", adminData);

        if (adminData.password === password) {
          localStorage.setItem("adminId", studentId);
          localStorage.setItem("userRole", "admin");
          console.log("➡ Redirecting to admin dashboard...");
          window.location.href = "admin_dboard.html";
          return;
        } else {
          showError("Incorrect password.");
          return;
        }
      }

      // If not found in admins, check borrowers collection
      const borrowerDocRef = db.collection("borrowers").doc(studentId);
      const borrowerDoc = await borrowerDocRef.get();

      if (borrowerDoc.exists) {
        const borrowerData = borrowerDoc.data();
        console.log("✅ Found borrower account:", borrowerData);

        if (borrowerData.password === password) {
          localStorage.setItem("borrowerId", studentId);
          localStorage.setItem("userRole", "borrower");
          console.log("➡ Redirecting to borrower dashboard...");
          window.location.href = "borrower_dashboard.html";
          return;
        } else {
          showError("Incorrect password.");
          return;
        }
      }

      // If not found in either collection
      showError("No account found for this Username.");
    } catch (error) {
      console.error("❌ Login error:", error);
      showError("An error occurred during login. Please try again.");
    }
  });
});

