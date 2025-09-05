import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { setupTelegramWebApp } from './utils/telegramWebAppLocal'
import { runMigrations } from './utils/initMigrations'
import telegramAnalytics from '@telegram-apps/analytics'

try {
  console.log('Starting React application initialization...');
  
  // Initialize Telegram Analytics SDK before everything else
  const analyticsToken = import.meta.env.VITE_TELEGRAM_ANALYTICS_TOKEN;
  const analyticsAppName = import.meta.env.VITE_TELEGRAM_ANALYTICS_APP_NAME;
  
  if (analyticsToken && analyticsAppName) {
    try {
      telegramAnalytics.init({
        token: analyticsToken,
        appName: analyticsAppName,
      });
      console.log('Telegram Analytics SDK initialized successfully');
    } catch (analyticsError) {
      console.error('Failed to initialize Telegram Analytics:', analyticsError);
    }
  } else {
    console.warn('Telegram Analytics not initialized: Missing token or app name in environment variables');
  }
  
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
  if (webApp) {
    console.log('Telegram WebApp initialized with local implementation:', webApp.version);
  } else {
    console.log('No Telegram WebApp initialized - no URL parameters provided');
  }
  
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
