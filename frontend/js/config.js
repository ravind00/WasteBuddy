// ===========================================
//  BACKEND URL CONFIGURATION
// ===========================================
// Auto-detects your PC's IP so mobile devices
// on the same WiFi can also access it.
//
// For a deployed backend, replace with your URL:
// const BACKEND_URL = "https://your-backend.onrender.com";
// ===========================================

// Local testing across devices (Phone, Laptop) on same WiFi
const host = window.location.hostname;
const BACKEND_URL = `http://${host}:8080`;

// Production URL (commented out for local testing)
// const BACKEND_URL = "https://wastebuddy.onrender.com";
