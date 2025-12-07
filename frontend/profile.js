import API_BASE_URL from "./config.js";

const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await res.json();

        document.getElementById("userName").innerText = user.name;
        document.getElementById("userEmail").innerText = user.email;
        document.getElementById("userRole").innerText = user.role;

        // Fetch stats
        fetchStats();

    } catch (err) {
        console.error(err);
    }
}

async function fetchStats() {
    try {
        // 1. Get Active Rentals
        const rentalRes = await fetch(`${API_BASE_URL}/rentals/my-rentals`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const rentals = await rentalRes.json();
        const activeCount = rentals.filter(r => r.status === 'active').length;

        // 2. Get Books Read (History)
        const historyRes = await fetch(`${API_BASE_URL}/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const history = await historyRes.json();
        const readCount = history.filter(h => h.isCompleted).length;

        document.getElementById("activeRentalsCount").innerText = activeCount;
        document.getElementById("booksReadCount").innerText = readCount;

    } catch (err) {
        console.error("Error loading stats:", err);
    }
}

// Global function for My Rentals link
window.openMyRentals = function () {
    // Redirect to dashboard with a query param to open rentals immediately
    window.location.href = "dashboard.html?openRentals=true";
};

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

loadProfile();
