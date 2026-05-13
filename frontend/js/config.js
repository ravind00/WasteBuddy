// ===========================================
//  BACKEND URL CONFIGURATION
// ===========================================
// Auto-detects your PC's IP so mobile devices
// on the same WiFi can also access it.
//
// For a deployed backend, replace with your URL:
// const BACKEND_URL = "https://your-backend.onrender.com";
// ===========================================

// Smart environment detection for Backend URL
const host = window.location.hostname;
let BACKEND_URL;

if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("172.") || host.startsWith("10.")) {
    // Local testing across devices (Phone, Laptop) on same WiFi
    BACKEND_URL = `http://${host}:8080`;
} else {
    // Production deployed URL
    BACKEND_URL = "https://wastebuddy.onrender.com";
}
