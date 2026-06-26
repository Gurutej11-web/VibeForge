// Copy this file to config.js and add your Groq API key.
// config.js is gitignored — your key stays local.
// Get a free key at https://console.groq.com
(function () {
  const GROQ_KEY = 'YOUR_GROQ_KEY_HERE';
  if (GROQ_KEY && GROQ_KEY !== 'YOUR_GROQ_KEY_HERE') {
    localStorage.setItem('vibeforge_groq_key', GROQ_KEY);
  }
})();
