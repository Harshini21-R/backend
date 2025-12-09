// signup.js (Frontend Folder)

// FINAL FIX: Pointing to the stable local backend on port 5000
const API_BASE_URL = "http://localhost:5000/api"; 

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await res.json();

    if (res.ok) {
      alert('✅ Signup successful! Please login.');
      window.location.href = 'login.html'; 
    } else {
      alert(`❌ ${data.message || 'Signup failed'}`);
    }
  } catch (err) {
    console.error('Signup error:', err);
    alert('❌ Error connecting to server. (Is the backend running on port 5000?)'); 
  }
});