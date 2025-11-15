// js/auth_borrower.js - Borrower authentication (for backward compatibility)

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
  const form = document.getElementById("borrowerLoginForm");

  if (!form) return; // Exit if form doesn't exist

  // ✅ Form submit handler
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
      console.log("🔍 Checking Firestore for borrower:", borrowerId);

      const docRef = db.collection("borrowers").doc(borrowerId);
      const doc = await docRef.get();

      if (!doc.exists) {
        alert("No account found for this Student ID.");
        return;
      }

      const userData = doc.data();
      console.log("✅ Found borrower account:", userData);

      if (userData.password === password) {
        localStorage.setItem("borrowerId", borrowerId);
        localStorage.setItem("userRole", "borrower");
        alert("Login successful!");
        console.log("➡ Redirecting to borrower dashboard...");
        window.location.href = "borrower_dashboard.html";
      } else {
        alert("Incorrect password.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("An error occurred during login. Please try again.");
    }
  });
});

