// ✅ Smart Config: Auto-detects if running locally or on server

const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:";

const API_BASE_URL = isLocal
    ? "http://localhost:5000/api" // Local Backend
    : "https://yashwanthrajks1rvu23bsc180-readify-1.onrender.com/api"; // Render Backend

console.log(`🔌 Connecting to: ${API_BASE_URL}`);

export default API_BASE_URL;
