  // Cek apakah token login ada
  const token = localStorage.getItem('authToken');

  // Kalau tidak ada, redirect ke halaman login
  if (!token) {
    window.location.href = '/login.html'; // ganti sesuai nama file login kamu
  }

  function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html'; // redirect ke login
  }