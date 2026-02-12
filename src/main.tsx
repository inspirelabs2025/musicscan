// Unregister any stale service workers and clear all caches from previous PWA builds
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}

import React, { Suspense, lazy, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Simple loading component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: '16px',
    background: '#0a0a0a',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #333',
      borderTop: '3px solid #8b5cf6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p>MusicScan laden...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: '16px',
    background: '#0a0a0a',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    padding: '20px',
    textAlign: 'center'
  }}>
    <h1 style={{ color: '#ef4444' }}>Laad Fout</h1>
    <p>Probeer de pagina te verversen (Ctrl+Shift+R)</p>
    <pre style={{ 
      background: '#1a1a1a', 
      padding: '16px', 
      borderRadius: '8px',
      maxWidth: '80%',
      overflow: 'auto',
      fontSize: '12px'
    }}>
      {error.message}
    </pre>
    <button 
      onClick={() => window.location.reload()}
      style={{
        background: '#8b5cf6',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      Pagina Herladen
    </button>
  </div>
);

// Lazy load App with error handling
const App = lazy(() => import('./App'));

function AppWrapper() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error || new Error(event.message));
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <AppWrapper />
    </React.StrictMode>
  );
}
