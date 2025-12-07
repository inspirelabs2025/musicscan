import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  
  // Show loading state immediately
  root.render(
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Laden...</p>
      </div>
    </div>
  );
  
  // Load app
  import('./App').then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }).catch(err => {
    console.error('App load error:', err);
    root.render(
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Laad Fout</h1>
          <p className="text-muted-foreground mb-4">Probeer de pagina te verversen (Ctrl+Shift+R)</p>
          <pre className="text-left bg-muted p-4 rounded text-xs overflow-auto">{err.message}</pre>
        </div>
      </div>
    );
  });
}
