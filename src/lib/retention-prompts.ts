// Retention prompts - localStorage based (no zustand dependency)

interface RetentionPromptState {
  showChatPrompt: boolean;
}

let state: RetentionPromptState = { showChatPrompt: false };
const listeners = new Set<() => void>();

export const useRetentionPromptStore = {
  getState: () => state,
  setState: (partial: Partial<RetentionPromptState>) => {
    state = { ...state, ...partial };
    listeners.forEach(l => l());
  },
};

export const setChatPromptVisibility = (visible: boolean) => {
  useRetentionPromptStore.setState({ showChatPrompt: visible });
};

export async function fetchChatMessageCount(_projectId: string): Promise<number> {
  return 0;
}

export async function checkAndTriggerChatPrompt(projectId: string) {
  const messageCount = await fetchChatMessageCount(projectId);
  setChatPromptVisibility(messageCount === 0);
}
