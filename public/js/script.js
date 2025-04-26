function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    toggleIcon.classList.toggle('fa-eye-slash');
  }
  
  // Modal close logic
  document.addEventListener('DOMContentLoaded', () => {
    const closeErrorModal = document.getElementById('closeErrorModal');
    const errorModal = document.getElementById('errorModal');
    const closeModal = document.getElementById('closeModal');
    const logoutModal = document.getElementById('logoutModal');
  
    if (closeErrorModal && errorModal) {
      closeErrorModal.addEventListener('click', () => {
        errorModal.classList.add('hidden');
      });
    }
  
    if (closeModal && logoutModal) {
      closeModal.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
      });
    }
  });
  