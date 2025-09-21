import { useState, useEffect, useCallback } from 'react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  icon: React.ElementType;
  reward: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const usePersistentMilestones = (userId?: string) => {
  const [reachedMilestones, setReachedMilestones] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Create a unique key for localStorage based on user ID or fallback to generic key
  const storageKey = userId ? `milestones_${userId}` : 'collection_milestones';

  // Load milestones from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedMilestones = JSON.parse(stored);
        if (Array.isArray(parsedMilestones)) {
          setReachedMilestones(parsedMilestones);
        }
      }
    } catch (error) {
      console.warn('Failed to load milestones from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, [storageKey]);

  // Save milestones to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(reachedMilestones));
    } catch (error) {
      console.warn('Failed to save milestones to localStorage:', error);
    }
  }, [reachedMilestones, storageKey, isInitialized]);

  const addReachedMilestone = useCallback((milestoneId: string) => {
    setReachedMilestones(prev => 
      prev.includes(milestoneId) ? prev : [...prev, milestoneId]
    );
  }, []);

  const addMultipleMilestones = useCallback((milestoneIds: string[]) => {
    setReachedMilestones(prev => {
      const newIds = milestoneIds.filter(id => !prev.includes(id));
      return newIds.length > 0 ? [...prev, ...newIds] : prev;
    });
  }, []);

  const resetMilestones = useCallback(() => {
    setReachedMilestones([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear milestones from localStorage:', error);
    }
  }, [storageKey]);

  const isMilestoneReached = useCallback((milestoneId: string) => {
    return reachedMilestones.includes(milestoneId);
  }, [reachedMilestones]);

  return {
    reachedMilestones,
    addReachedMilestone,
    addMultipleMilestones,
    resetMilestones,
    isMilestoneReached,
    isInitialized
  };
};