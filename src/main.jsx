import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

window.addEventListener('error', (e) => {
  console.error('🌐 Global error:', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('🤖 Unhandled promise:', e.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
