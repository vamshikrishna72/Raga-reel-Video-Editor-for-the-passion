const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const analyzeClips = async (files: File[], prompt: string, mood?: string, language?: string) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('prompt', prompt);
  if (mood) formData.append('mood', mood);
  if (language) formData.append('language', language);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Video analysis failed');
    return await response.json();
  } catch (error) {
    console.error("API Analyze Error:", error);
    throw error;
  }
};

export const renderVideo = async (
  projectId: string,
  storyboard: any[],
  previewUrl?: string,
  customAudio?: File,
  useProxy: boolean = false,
  songTitle?: string,
  songArtist?: string
) => {
  const formData = new FormData();
  formData.append('projectId', projectId);
  formData.append('storyboard', JSON.stringify(storyboard));
  formData.append('useProxy', String(useProxy));
  if (previewUrl) formData.append('previewUrl', previewUrl);
  if (customAudio) formData.append('customAudio', customAudio);
  if (songTitle) formData.append('songTitle', songTitle);
  if (songArtist) formData.append('songArtist', songArtist);

  try {
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errRes = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      throw new Error(errRes.error || `HTTP ${response.status} Error`);
    }
    return await response.json();
  } catch (error) {
    console.error("API Process Error:", error);
    throw error;
  }
};

export const reviseStoryboard = async (projectId: string, instruction: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reedit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, instruction })
    });
    if (!response.ok) throw new Error('Storyboard revision failed');
    return await response.json();
  } catch (error) {
    console.error("API Re-edit Error:", error);
    throw error;
  }
};

export const getKeysStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/keys/status`);
    if (!response.ok) throw new Error('Failed to fetch API keys status');
    return await response.json();
  } catch (error) {
    console.error("API status check error:", error);
    return { gemini: 'error', elevenlabs: 'error' };
  }
};

export const getTrends = async () => {
  return {
    trends: [
      { type: 'style', name: 'Cyberpunk transitions', score: 98 },
      { type: 'music', name: 'Synthwave beats', score: 95 },
      { type: 'timing', name: 'Best time to post: 6:00 PM', score: 90 }
    ]
  };
};
