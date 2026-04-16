import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ChatNudge } from '../components/ui/chat-nudge';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const [messageCount, setMessageCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate fetching message count. In a real app, this would come from an API/context.
    // Here, we set it to 0 initially to trigger the nudge for demonstration.
    const fetchMessages = setTimeout(() => {
      setMessageCount(0); // Set to 0 to show the nudge
    }, 500);
    return () => clearTimeout(fetchMessages);
  }, []);

  const handleTryChat = () => {
    console.log('User clicked to try chat!');
    // Implement actual chat functionality here, e.g., open a chat modal, navigate to chat route
    navigate('/dashboard/chat-feature'); // Example: navigate to a dedicated chat route
  };

  return (
    <DashboardLayout>
      <Outlet />
      {/* Conditionally render ChatNudge at the bottom right of the dashboard content */}
      {messageCount === 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatNudge messageCount={messageCount} onTryChat={handleTryChat} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
