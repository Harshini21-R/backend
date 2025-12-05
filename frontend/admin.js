import API_BASE_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    window.location.href = "login.html";
    return;
  }
  if (user.role !== "admin") {
    alert("Admin only!");
    window.location.href = "dashboard.html";
    return;
  }

  const bookTable = document.getElementById("bookTable");

  /* ===============================
      ✅ LOAD BOOKS
  =============================== */
  async function loadBooks() {
    try {
      const res = await fetch(`${API_BASE_URL}/books?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert("Session expired. Please login again.");
          localStorage.clear();
          window.location.href = "login.html";
          return;
        }
        throw new Error(`Failed to load books: ${res.statusText}`);
      }

      const books = await res.json();

      if (!Array.isArray(books) || books.length === 0) {
        bookTable.innerHTML = `<tr><td colspan="6" style="text-align:center;">No books found</td></tr>`;
        return;
      }

      renderBooks(books);
    } catch (err) {
      console.error("Error loading books:", err);
      bookTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Error loading books. Please refresh.</td></tr>`;
    }
  }

  /* ===============================
      ✅ RENDER BOOK TABLE
  =============================== */
  function renderBooks(books) {
    bookTable.innerHTML = books
      .map(
        (b) => `
        <tr id="row-${b._id}">
          <td>${b.title}</td>
          <td>${(b.authors || []).join(", ")}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${b.isRentable ? "checked" : ""} 
                onchange="window.toggleRentable('${b._id}')">
              <span class="slider round"></span>
            </label>
            <span style="font-size: 0.8rem; margin-left: 5px;">${b.isRentable ? "Rent" : "Free"}</span>
          </td>
          <td>
            <button class="btn-small" onclick="window.editBook('${b._id}')">Edit</button>
          </td>
          <td>
            <button class="btn-small btn-delete" onclick="window.deleteBook('${b._id}')">Delete</button>
          </td>
        </tr>`
      )
      .join("");
  }

  /* ===============================
      ✅ TOGGLE RENTABLE
  =============================== */
  window.toggleRentable = async function (id) {
    try {
      await fetch(`${API_BASE_URL}/rentals/toggle-rentable/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadBooks(); // Refresh UI
    } catch (err) {
      console.error("Error toggling rentable:", err);
    }
  };

  /* ===============================
      🔔 LOAD RENTAL REQUESTS
  =============================== */
  async function loadRentals() {
    try {
      const res = await fetch(`${API_BASE_URL}/rentals/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return; // Skip if error, handled by loadBooks mostly

      const rentals = await res.json();
      const pendingTable = document.getElementById("pendingRentalsTable");

      if (!Array.isArray(rentals)) return;

      pendingTable.innerHTML = rentals.length
        ? rentals.map(r => `
          <tr>
            <td>${r.userId ? r.userId.name : "Unknown"}</td>
            <td>${r.bookId ? r.bookId.title : "Unknown"}</td>
            <td>${r.hours} hrs</td>
            <td>₹${r.totalCost}</td>
            <td style="font-family: monospace; color: #ffd700;">${r.transactionId}</td>
            <td>
              <button class="btn-small" style="background: #28a745;" onclick="window.approveRental('${r._id}')">Approve</button>
              <button class="btn-small btn-delete" onclick="window.rejectRental('${r._id}')">Unapprove</button>
            </td>
          </tr>
        `).join("")
        : `<tr><td colspan="6" style="text-align:center; color: #888;">No pending requests</td></tr>`;

    } catch (err) {
      console.error("Error loading rentals:", err);
    }
  }

  /* ===============================
      ⏳ LOAD ACTIVE RENTALS
  =============================== */
  async function loadActiveRentals() {
    try {
      const res = await fetch(`${API_BASE_URL}/rentals/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const rentals = await res.json();
      const activeTable = document.getElementById("activeRentalsTable");

      if (!Array.isArray(rentals)) return;

      activeTable.innerHTML = rentals.length
        ? rentals.map(r => {
          const endTime = new Date(r.endTime);
          const now = new Date();
          const timeLeft = endTime - now;
          const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
          const minsLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

          return `
          <tr>
            <td>${r.userId && r.userId.name ? r.userId.name : "Unknown User"}</td>
            <td>${r.bookId ? r.bookId.title : "Unknown Book"}</td>
            <td>${hoursLeft}h ${minsLeft}m</td>
            <td style="color: #28a745; font-weight: bold;">Active</td>
            <td>
              <button class="btn-small btn-delete" onclick="window.deleteRental('${r._id}')">Delete</button>
            </td>
          </tr>
        `;
        }).join("")
        : `<tr><td colspan="5" style="text-align:center; color: #888;">No active rentals</td></tr>`;

    } catch (err) {
      console.error("Error loading active rentals:", err);
    }
  }

  /* ===============================
      🗑️ DELETE ACTIVE RENTAL
  =============================== */
  window.deleteRental = async function (id) {
    if (!confirm("Are you sure you want to manually delete this active rental?")) return;

    try {
      await fetch(`${API_BASE_URL}/rentals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Rental deleted successfully.");
      loadActiveRentals();
    } catch (err) {
      console.error("Error deleting rental:", err);
    }
  };

  /* ===============================
      ➕ LOAD EXTENSION REQUESTS
  =============================== */
  async function loadExtensions() {
    try {
      const res = await fetch(`${API_BASE_URL}/rentals/pending-extensions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const extensions = await res.json();
      const extensionTable = document.getElementById("pendingExtensionsTable");

      if (!Array.isArray(extensions)) return;

      extensionTable.innerHTML = extensions.length
        ? extensions.map(r => `
          <tr>
            <td>${r.userId ? r.userId.name : "Unknown"}</td>
            <td>${r.bookId ? r.bookId.title : "Unknown"}</td>
            <td>${r.extensionHours} hrs</td>
            <td>₹${r.extensionCost}</td>
            <td style="font-family: monospace; color: #ffd700;">${r.extensionTransactionId}</td>
            <td>
              <button class="btn-small" style="background: #28a745;" onclick="window.approveExtension('${r._id}')">Approve</button>
              <button class="btn-small btn-delete" onclick="window.rejectExtension('${r._id}')">Unapprove</button>
            </td>
          </tr>
        `).join("")
        : `<tr><td colspan="6" style="text-align:center; color: #888;">No pending extensions</td></tr>`;

    } catch (err) {
      console.error("Error loading extensions:", err);
    }
  }

  /* ===============================
      ✅ APPROVE EXTENSION
  =============================== */
  window.approveExtension = async function (id) {
    if (!confirm("Confirm payment received for extension?")) return;

    try {
      await fetch(`${API_BASE_URL}/rentals/approve-extension/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Extension Approved! Time added.");
      loadExtensions();
      loadActiveRentals();
    } catch (err) {
      console.error("Error approving extension:", err);
    }
  };

  /* ===============================
      ✅ APPROVE RENTAL
  =============================== */
  window.approveRental = async function (id) {
    if (!confirm("Confirm payment received?")) return;

    try {
      await fetch(`${API_BASE_URL}/rentals/approve/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Rental Approved! User can now read.");
      loadRentals();
    } catch (err) {
      console.error("Error approving rental:", err);
    }
  };

  /* ===============================
      ❌ REJECT RENTAL
  =============================== */
  window.rejectRental = async function (id) {
    if (!confirm("Reject this rental request?")) return;

    try {
      await fetch(`${API_BASE_URL}/rentals/reject/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Rental Rejected.");
      loadRentals();
    } catch (err) {
      console.error("Error rejecting rental:", err);
    }
  };

  /* ===============================
      ❌ REJECT EXTENSION
  =============================== */
  window.rejectExtension = async function (id) {
    if (!confirm("Reject this extension request?")) return;

    try {
      await fetch(`${API_BASE_URL}/rentals/reject-extension/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Extension Rejected.");
      loadExtensions();
    } catch (err) {
      console.error("Error rejecting extension:", err);
    }
  };

  /* ===============================
      ✅ ADD BOOK
  =============================== */
  const addBookForm = document.getElementById("addBookForm");
  if (addBookForm) {
    addBookForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("title").value;
      const authors = document.getElementById("authors").value;
      const categories = document.getElementById("categories").value;
      const description = document.getElementById("description").value;
      const pdfUrl = document.getElementById("pdfUrl").value;

      const body = {
        title: title,
        authors: authors.split(",").map((x) => x.trim()),
        categories: categories.split(",").map((x) => x.trim()),
        description: description,
        pdfUrl: pdfUrl,
      };

      try {
        await fetch(`${API_BASE_URL}/books`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        e.target.reset();
        loadBooks();
      } catch (err) {
        console.error("Error adding book:", err);
      }
    });
  }

  /* ===============================
      ✅ DELETE BOOK
  =============================== */
  window.deleteBook = async function (id) {
    if (!confirm("Delete this book?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/books/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete book");
      }

      loadBooks();
    } catch (err) {
      console.error("Error deleting book:", err);
      alert(`Error deleting book: ${err.message}`);
    }
  };

  /* ===============================
      ✏️ EDIT BOOK (INLINE)
  =============================== */
  window.editBook = function (id) {
    const row = document.getElementById(`row-${id}`);
    const cells = row.children;

    const title = cells[0].innerText;
    const authors = cells[1].innerText;
    // Skip Rentable column (index 2)

    row.innerHTML = `
      <td><input class="edit-input" id="edit-title-${id}" value="${title}" /></td>
      <td><input class="edit-input" id="edit-authors-${id}" value="${authors}" /></td>
      <td>Cannot Edit Here</td>
      <td><button class="btn-small" onclick="window.saveBook('${id}')">Save</button></td>
      <td><button class="btn-small btn-delete" onclick="window.location.reload()">Cancel</button></td>
    `;
  };

  /* ===============================
      💾 SAVE EDITED BOOK
  =============================== */
  window.saveBook = async function (id) {
    const newTitle = document.getElementById(`edit-title-${id}`).value;
    const newAuthors = document
      .getElementById(`edit-authors-${id}`)
      .value.split(",")
      .map((x) => x.trim());

    try {
      await fetch(`${API_BASE_URL}/books/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          authors: newAuthors,
        }),
      });

      loadBooks();
    } catch (err) {
      console.error("Error saving book:", err);
    }
  };

  /* ===============================
      ✅ LOGOUT
  =============================== */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  /* ===============================
      📧 TEST EMAIL CONFIG
  =============================== */
  window.testEmailConfig = async function () {
    if (!confirm("Send a test email to yourself to check Render configuration?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/rentals/test-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ SUCCESS: " + data.message);
      } else {
        alert("❌ FAILURE: " + data.error);
        console.error("Email Error Details:", data);
      }
    } catch (err) {
      console.error("Error testing email:", err);
      alert("❌ Network/Server Error: " + err.message);
    }
  };

  /* ✅ INIT */
  loadBooks();
  loadRentals();
  loadActiveRentals();
  loadExtensions();
  setInterval(() => {
    loadRentals();
    loadActiveRentals();
    loadExtensions();
  }, 10000); // Auto-refresh requests every 10s
});
