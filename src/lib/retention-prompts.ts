import { create } from 'zustand';

interface RetentionPromptState {
  showChatPrompt: boolean;
  setChatPromptVisibility: (visible: boolean) => void;
}

export const useRetentionPromptStore = create<RetentionPromptState>()((set) => ({
  showChatPrompt: false,
  setChatPromptVisibility: (visible) => set({ showChatPrompt: visible }),
}));


// Placeholder for fetching actual chat message count
// In a real application, this would interact with your backend/database
export async function fetchChatMessageCount(projectId: string): Promise<number> {
  // Simulate API call
  console.log(`Fetching chat message count for project: ${projectId}`);
  return new Promise(resolve => setTimeout(() => {
    // For demonstration, let's say a new project starts with 0 messages.
    // After some time, it might increment.
    const messageCount = Math.floor(Math.random() * 5);
    resolve(messageCount > 0 ? messageCount : 0); // Ensure it returns 0 occasionally for the prompt
  }, 500));
}

// Function to check if the chat prompt should be shown
export async function checkAndTriggerChatPrompt(projectId: string) {
  const messageCount = await fetchChatMessageCount(projectId);
  const { setChatPromptVisibility } = useRetentionPromptStore.getState();

  if (messageCount === 0) {
    setChatPromptVisibility(true);
  } else {
    setChatPromptVisibility(false);
  }
}
