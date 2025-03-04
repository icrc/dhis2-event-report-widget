import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import global styles
import './index.css';

// Detect the root element
const rootElement = document.getElementById('root');

// Create React root using createRoot method
const root = createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Add error tracking or performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Example of adding error boundary or performance tracking
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    // Optionally send error to monitoring service
  });
}

// Hot module replacement for development
if (module.hot) {
  module.hot.accept('./App', () => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
}