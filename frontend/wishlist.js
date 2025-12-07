import API_BASE_URL from "./config.js";

const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

const wishlistGrid = document.getElementById("wishlistGrid");

async function loadWishlist() {
    try {
        const res = await fetch(`${API_BASE_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch wishlist");

        const wishlistItems = await res.json();

        wishlistGrid.innerHTML = wishlistItems.length
            ? wishlistItems.map((item) => {
                const b = item.bookId;
                return `
          <div class="card">
            <h3>${b.title}</h3>
            <p>${b.authors?.length ? b.authors.join(", ") : "Unknown Author"}</p>
            <p>⭐ ${b.averageRating ? b.averageRating.toFixed(1) : "No ratings"}</p>
            <div style="margin-top: auto; display: flex; gap: 10px;">
              <button onclick="removeFromWishlist('${item._id}')" style="border-color: #ff4b4b; color: #ff4b4b;">Remove</button>
              <button onclick="window.location.href='dashboard.html'">View to Rent</button>
            </div>
          </div>
        `;
            }).join("")
            : "<p>Your wishlist is empty.</p>";

    } catch (err) {
        console.error(err);
        wishlistGrid.innerHTML = "<p>Error loading wishlist.</p>";
    }
}

window.removeFromWishlist = async function (id) {
    if (!confirm("Remove from wishlist?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/wishlist/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) loadWishlist();
    } catch (err) {
        console.error(err);
    }
};

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

loadWishlist();
