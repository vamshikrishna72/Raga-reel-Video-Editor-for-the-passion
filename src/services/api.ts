const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_BASE_URL = rawUrl.replace(/\/+$/, '').trim();

export const pingBackend = async () => {
  try {
    await fetch(`${API_BASE_URL}/`, { method: 'GET' });
  } catch (e) {
    // Silent warm-up ping
  }
};

const fetchWithRetry = async (url: string, options: RequestInit, retries: number = 3, delayMs: number = 3000): Promise<Response> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err: any) {
      if (attempt === retries) throw err;
      console.warn(`[Network Retry] Attempt ${attempt + 1} to ${url} failed (${err?.message || 'Server waking up'}). Retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Backend connection timed out while waking up. Please retry in a moment.");
};



export const createJob = async (
  files: File[], 
  prompt: string, 
  mood?: string, 
  language?: string,
  song?: { id?: string; title?: string; artist?: string; previewUrl?: string; mood?: string; language?: string } | null,
  customAudio?: File | null
) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('prompt', prompt);
  if (mood) formData.append('mood', mood);
  if (language) formData.append('language', language);
  if (song?.title) formData.append('songTitle', song.title);
  if (song?.artist) formData.append('songArtist', song.artist);
  if (song?.previewUrl) formData.append('previewUrl', song.previewUrl);
  if (song?.id) formData.append('songId', song.id);
  if (customAudio) formData.append('customAudio', customAudio);

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create background video job');
    return await response.json();
  } catch (error) {
    console.error("API Create Job Error:", error);
    throw error;
  }
};

export const getJobStatus = async (jobId: string) => {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/jobs/${jobId}`, { method: 'GET' }, 1, 1000);
    if (!response.ok) throw new Error('Failed to fetch job status');
    return await response.json();
  } catch (error) {
    console.error("API Get Job Status Error:", error);
    throw error;
  }
};

export const cancelJob = async (jobId: string) => {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/jobs/${jobId}/cancel`, { method: 'POST' });
    return await response.json();
  } catch (error) {
    console.error("API Cancel Job Error:", error);
    throw error;
  }
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
    const response = await fetchWithRetry(`${API_BASE_URL}/api/health`, { method: 'GET' }, 1, 1000);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("Keys status check failed:", error);
  }
  return { gemini: 'error', elevenlabs: 'error' };
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
