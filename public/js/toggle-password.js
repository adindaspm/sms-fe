function togglePassword(id, icon) {
    const input = document.getElementById(id);
    if (!input) return;

    const isVisible = input.type === 'text';
    input.type = isVisible ? 'password' : 'text';
    icon.classList.toggle('fa-eye', isVisible);
    icon.classList.toggle('fa-eye-slash', !isVisible);
}