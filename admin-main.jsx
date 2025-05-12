import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AdminApp from './src/admin/AdminApp.jsx'
import './src/index.css'

// Add console logs for debugging
console.log('Admin app initializing...');

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AdminApp />
    </StrictMode>
  );
  console.log('Admin app rendered successfully!');
} else {
  console.error('Root element not found in the DOM!');
}
