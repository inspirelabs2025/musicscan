import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Trigger blog post regeneration with new structure
import './utils/regenerateBlogPost'

// Debug logging
console.log('🚀 Main.tsx: Starting app initialization');

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
