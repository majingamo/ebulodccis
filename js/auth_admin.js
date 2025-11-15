// js/auth_admin.js

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
  const form = document.getElementById("adminLoginForm");

  // ✅ Form submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const adminId = document.getElementById("adminId").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!adminId || !password) {
      alert("Please fill in both Admin ID and Password.");
      return;
    }

    try {
      console.log("🔍 Checking Firestore for:", adminId);

      const docRef = db.collection("admins").doc(adminId);
      const doc = await docRef.get();

      if (!doc.exists) {
        alert("No account found for this Admin ID.");
        return;
      }

      const userData = doc.data();
      console.log("✅ Found account:", userData);

      if (userData.password === password) {
        localStorage.setItem("adminId", adminId);
        alert("Login successful!");
        console.log("➡ Redirecting to dashboard...");
        window.location.href = "admin_dboard.html"; // 👈 make sure file name matches
      } else {
        alert("Incorrect password.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("An error occurred during login. Please try again.");
    }
  });
});
