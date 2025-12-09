document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 🔥 ROLE-BASED REDIRECTION
      if (data.user.role === "admin") {
        alert("Welcome Admin!");
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } else {
      alert(`❌ ${data.message || 'Login failed'}`);
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('❌ Error connecting to server.');
  }
});
