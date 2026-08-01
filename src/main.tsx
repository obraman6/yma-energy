import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress expected/benign Vite HMR WebSocket connection errors in sandboxed preview environment
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason?.message?.includes('WebSocket') ||
     String(event.reason).includes('WebSocket'))
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

