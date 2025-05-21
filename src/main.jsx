import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { setupTelegramWebApp } from './utils/telegramWebAppLocal'
import { runMigrations } from './utils/initMigrations'

try {
  console.log('Starting React application initialization...');
  
  // Run database migrations before starting the app
  runMigrations()
    .then(result => {
      console.log('Database migrations completed:', result.success ? 'success' : 'failed');
    })
    .catch(error => {
      console.error('Error running migrations:', error);
    });
  
  // Initialize Telegram WebApp with our local implementation before rendering React
  const webApp = setupTelegramWebApp();
  console.log('Telegram WebApp initialized with local implementation:', webApp.version);
  
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found in DOM!');
  }
  
  const root = createRoot(rootElement);
  console.log('Root created, rendering app...');
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  
  console.log('React render called successfully');
  
  // Mark Telegram WebApp as ready
  if (webApp && typeof webApp.ready === 'function') {
    webApp.ready();
    console.log('Telegram WebApp ready signal sent');
  }
} catch (error) {
  console.error('Critical error during React initialization:', error);
  
  // Try to show error on page
  const errorContainer = document.createElement('div');
  errorContainer.style.padding = '20px';
  errorContainer.style.margin = '20px';
  errorContainer.style.background = '#ffebee';
  errorContainer.style.border = '1px solid #c62828';
  errorContainer.style.borderRadius = '4px';
  
  errorContainer.innerHTML = `
    <h2 style="color: #c62828;">Error Initializing App</h2>
    <p><strong>Message:</strong> ${error.message}</p>
    <p><strong>Stack:</strong> ${error.stack}</p>
    <p>Please check the console for more details.</p>
  `;
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.appendChild(errorContainer);
  } else {
    document.body.appendChild(errorContainer);
  }
  
  // Show error message in the prepared container
  const errorMessageEl = document.getElementById('error-message');
  const errorContainerEl = document.getElementById('error-container');
  if (errorMessageEl && errorContainerEl) {
    errorMessageEl.textContent = `React Error: ${error.message}`;
    errorContainerEl.style.display = 'block';
  }
}
