import API_BASE_URL from "./config.js";

const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

// Get params from URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('bookId');
const amount = urlParams.get('amount');
const title = urlParams.get('title');
const rentalId = urlParams.get('rentalId'); // If paying for existing rental

document.getElementById("bookTitle").innerText = title || "Book Rental";
document.getElementById("amount").innerText = amount || "0";

let selectedMethod = 'upi';

window.selectMethod = function (method) {
    selectedMethod = method;
    document.querySelectorAll('.method-card').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

window.processPayment = async function () {
    const transactionId = document.getElementById("transactionId").value;
    if (!transactionId) return alert("Please enter Transaction ID");

    // Call API to create Payment record
    try {
        const res = await fetch(`${API_BASE_URL}/payments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                rentalId: rentalId || null, // Optional if just booking
                // If existing rental, we link it. If new rental, we might need to create rental first.
                // For now assuming this confirms a rental.
                amount: amount,
                transactionId: transactionId,
                paymentMethod: selectedMethod,
                bookId: bookId // Pass bookId if creating new rental context
            })
        });

        if (res.ok) {
            alert("Payment Successful!");
            window.location.href = "dashboard.html";
        } else {
            alert("Payment Failed");
        }
    } catch (err) {
        console.error(err);
        alert("Error processing payment");
    }
};
