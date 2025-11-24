import API_BASE_URL from "./config.js";

const token = localStorage.getItem("token");

// Redirect to login if not logged in
if (!token) {
  alert("Please login first.");
  window.location.href = "login.html";
}

// ✅ Add to History — call this when user opens / reads a book
// bookId = string
async function addToHistory(bookId) {
  try {
    const res = await fetch(`${API_BASE_URL}/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error adding history:", data.error);
      return;
    }

    console.log("History added ✅", data);
  } catch (err) {
    console.error("History error:", err);
  }
}

// ✅ Load reading history
async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const history = await res.json();

    if (!res.ok) {
      document.getElementById("historyList").innerHTML =
        "<p>Failed to load history.</p>";
      return;
    }

    document.getElementById("historyList").innerHTML = history.length
      ? history.map(
        (h) => `
        <div class="card">
          <h3>${h.bookId?.title || "Unknown Book"}</h3>
          <p>Read on: ${new Date(h.date).toLocaleString()}</p>
          <button onclick="window.rateBook('${h.bookId?._id || ""}')">Rate</button>
        </div>
      `
      ).join("")
      : "<p>No reading history yet.</p>";
  } catch (err) {
    console.error("Error loading history:", err);
  }
}

// ✅ Redirect to rating page
window.rateBook = function (bookId) {
  if (!bookId) return;
  localStorage.setItem("bookId", bookId);
  window.location.href = "ratings.html";
}

// Auto-load when history page opens
loadHistory();
