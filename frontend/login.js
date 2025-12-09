// login.js (Frontend Folder)

// FINAL FIX: Pointing to the stable local backend on port 5000
const API_BASE_URL = "http://localhost:5000/api"; 

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
<<<<<<< HEAD
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
=======
    const res = await fetch('http://localhost:5000/api/auth/login', {
>>>>>>> 9217fdf4a7266972e7ac08f654ca83dfe79151f9
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();

    if (res.ok) {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      alert('✅ Login successful! Redirecting to dashboard.');
      window.location.href = 'dashboard.html'; 
    } else {
      alert(`❌ Login failed: ${data.message || 'Check your email and password.'}`);
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('❌ Error connecting to server. Please ensure the backend is running on port 5000.'); 
  }
});