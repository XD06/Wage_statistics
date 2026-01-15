import { AppState } from '../types';

// The API endpoint is relative because the React app is served by the same server
const API_URL = '/api/data';

export const saveToServer = async (data: AppState): Promise<boolean> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to save to server:', error);
    return false;
  }
};

export const loadFromServer = async (): Promise<AppState | null> => {
  try {
    const response = await fetch(API_URL);
    if (response.status === 404) return null; // File doesn't exist yet
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    
    return await response.json();
  } catch (error) {
    console.error('Failed to load from server:', error);
    return null;
  }
};