import { useState } from 'react';
import { Settings } from '../../hooks/useSettings';
import { apiClient } from '../../src/services/apiClient';

export const useAdminSave = (settings: Settings, saveSettings: (newSettings: Settings) => void) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');

  const handleSave = async (localConfig: Settings) => {
    try {
      setSaveStatus('loading');

      // 1. Save to Local Storage (frontend state)
      saveSettings(localConfig);

      // 2. Save to Backend via API (vincula chaves à conta do usuário logado)
      try {
          await apiClient.saveUserSettings(localConfig as any);
      } catch (backendError) {
          console.error("Warning: Failed to save to backend, but saved locally.", backendError);
          // Não falhamos totalmente se o backend falhar, pois o app pode funcionar offline/local
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      setSaveStatus('error');
      console.error("Failed to save settings:", error);
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  return { saveStatus, handleSave };
};
