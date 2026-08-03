const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_BASE_URL = rawUrl.replace(/\/+$/, '').trim();

export const pingBackend = async () => {
  try {
    await fetch(`${API_BASE_URL}/`, { method: 'GET' });
  } catch (e) {
    // Silent warm-up ping
  }
};

const fetchWithRetry = async (url: string, options: RequestInit, retries: number = 2, delayMs: number = 2500): Promise<Response> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err: any) {
      if (attempt === retries) throw err;
      console.warn(`Fetch attempt ${attempt + 1} failed (${err?.message || 'Network Error'}). Retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Network request failed after retries");
};

export const analyzeClips = async (files: File[], prompt: string, mood?: string, language?: string) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('prompt', prompt);
  if (mood) formData.append('mood', mood);
  if (language) formData.append('language', language);

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/analyze`, {
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
    const response = await fetchWithRetry(`${API_BASE_URL}/api/process`, {
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
    const response = await fetchWithRetry(`${API_BASE_URL}/api/reedit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, instruction })
    });
    if (!response.ok) throw new Error('Storyboard revision failed');
    return await response.json();
  } catch (error) {
    console.error("API Reedit Error:", error);
    throw error;
  }
};

export const getKeysStatus = async () => {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/keys/status`, { method: 'GET' }, 1, 1000);
    if (!response.ok) throw new Error('Status check failed');
    return await response.json();
  } catch (error) {
    return { gemini: 'error', elevenlabs: 'error' };
  }
};

export const getTrends = async () => {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/trends`, { method: 'GET' }, 1, 1000);
    if (!response.ok) throw new Error('Trends fetch failed');
    return await response.json();
  } catch (error) {
    return { status: 'fallback', timestamp: new Date().toISOString(), trendingStyles: [] };
  }
};
