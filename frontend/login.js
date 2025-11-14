document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('https://yashwanthrajks1rvu23bsc180-readify-1.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('✅ Login successful!');
      window.location.href = 'dashboard.html';
    } else {
      alert(`❌ ${data.message || 'Login failed'}`);
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('❌ Error connecting to server.');
  }
});
