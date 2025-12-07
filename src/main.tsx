import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useWebVitals } from "@/hooks/useWebVitals"

// Debug logging
console.log('🚀 Main.tsx: Starting app initialization');

// Initialize Web Vitals tracking
function AppWithVitals() {
  useWebVitals();
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithVitals />
  </React.StrictMode>
);
