// This script handles direct redirection after login
function checkAuthAndRedirect() {
  // Check if user just logged in
  if (localStorage.getItem('gg_auth_success') === 'true') {
    console.log('Authentication success detected, redirecting to homepage...');
    // Clear the flag
    localStorage.removeItem('gg_auth_success');
    // Force redirect to homepage
    window.location.href = '/';
  }
}

// Run on page load
checkAuthAndRedirect();

// Also listen for storage events (in case localStorage changes in another tab)
window.addEventListener('storage', function(e) {
  if (e.key === 'gg_auth_success' && e.newValue === 'true') {
    checkAuthAndRedirect();
  }
});
