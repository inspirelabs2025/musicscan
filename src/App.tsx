import { Outlet } from "react-router-dom";
import Nav from "./components/Nav";
import { Sonner } from "./components/ui/sonner"; // Import Sonner
import { useEffect } from "react";
import { toast } from "sonner";

function App() {
  // Simulate fetching chat messages count
  // In a real application, this would come from an API or context
  const chatMessagesCount = 0; // Replace with actual data fetching later

  useEffect(() => {
    if (chatMessagesCount === 0) {
      toast.info("💬 Heb je de chat al geprobeerd?", {
        description: "Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!",
        action: {
          label: "Probeer chat",
          onClick: () => console.log("Navigate to chat"), // Replace with actual navigation to chat
        },
        duration: 8000,
        id: 'chat-nudge-toast'
      });
    }
  }, [chatMessagesCount]);

  return (
    <div className="flex flex-col h-full">
      <Nav />
      <main className="flex-grow overflow-auto p-4">
        <Outlet />
      </main>
      <Sonner /> {/* Add Sonner component here */}
    </div>
  );
}

export default App;
