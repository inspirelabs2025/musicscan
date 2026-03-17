import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { useProject } from './ProjectContext';

type Setting = {
  id: string;
  user_id: string;
  key: string;
  value: any;
};

type SettingsContextType = {
  settings: Record<string, any>;
  getSetting: (key: string) => any;
  setSetting: (key: string, value: any) => Promise<void>;
  loadingSettings: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const navigate = useNavigate();

  const fetchSettings = useCallback(async () => {
    if (!user?.id) {
      setLoadingSettings(false);
      return;
    }
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const newSettings: Record<string, any> = {};
      data.forEach((setting: Setting) => {
        newSettings[setting.key] = setting.value;
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Optionally handle error, e.g., show a toast notification
    } finally {
      setLoadingSettings(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback((key: string) => {
    return settings[key];
  }, [settings]);

  const setSetting = useCallback(async (key: string, value: any) => {
    if (!user?.id) {
      console.warn('Cannot set setting: User not authenticated.');
      return;
    }

    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          { user_id: user.id, key, value },
          { onConflict: 'user_id,key' }
        );

      if (error) {
        throw error;
      }

      setSettings(prevSettings => ({ ...prevSettings, [key]: value }));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      // Optionally handle error
    }
  }, [user?.id]);

  return (
    <SettingsContext.Provider value={{ settings, getSetting, setSetting, loadingSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
