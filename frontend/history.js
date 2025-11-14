// ✅ history.js

const API_BASE = "https://yashwanthrajks1rvu23bsc180-readify-1.onrender.com/api";
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
    const res = await fetch(`${API_BASE}/history`, {
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
    const res = await fetch(`${API_BASE}/history`, {
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
          ${
            h.bookId?.coverUrl
              ? `<img src="${h.bookId.coverUrl}" alt="${h.bookId.title}"
                style="width:80px;height:110px;border-radius:7px;float:right;margin-left:18px;">`
              : ""
          }
          <h3>${h.bookId?.title || "Unknown Book"}</h3>
          <p>Read on: ${new Date(h.date).toLocaleString()}</p>
          <button onclick="rateBook('${h.bookId?._id || ""}')">Rate</button>
        </div>
      `
        ).join("")
      : "<p>No reading history yet.</p>";
  } catch (err) {
    console.error("Error loading history:", err);
  }
}

// ✅ Redirect to rating page
function rateBook(bookId) {
  if (!bookId) return;
  localStorage.setItem("bookId", bookId);
  window.location.href = "rating.html";
}

// Auto-load when history page opens
loadHistory();
