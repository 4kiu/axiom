import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    // We use a relative string. The browser handles the base URL logic automatically.
    // In many preview environments (like AI Studio), Service Workers are blocked by origin policies.
    // We catch and log this gracefully to prevent the app from crashing.
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('AxiomOS PWA: Service Worker Registered', reg.scope);
      })
      .catch(err => {
        // Only log a warning to avoid polluting the console with errors in environments that block SWs
        if (err.name === 'SecurityError' || err.message.includes('origin')) {
          console.info('AxiomOS PWA: Service Worker registration skipped (Security/Origin restriction).');
        } else {
          console.warn('AxiomOS PWA: Service Worker initialization deferred:', err.message);
        }
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);