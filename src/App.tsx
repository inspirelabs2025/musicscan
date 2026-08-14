import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { Toaster } from './components/ui/sonner';
import ChatNudge from './components/chat-nudge'; // Import the new nudge component

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <RouterProvider router={router} />
      <Toaster />
      <ChatNudge /> {/* Render the ChatNudge component */} 
    </div>
  );
}

export default App;
