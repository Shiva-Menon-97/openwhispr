let currentAudio = null;
let currentAbortController = null;

export async function playTTS(text, settings) {
  abortTTS(); // ensure no overlapping playback

  const { ttsEndpointUrl, ttsApiKey, ttsModel, ttsVoice } = settings;
  if (!ttsEndpointUrl || !text) return Promise.resolve();

  currentAbortController = new AbortController();

  try {
    const response = await fetch(ttsEndpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ttsApiKey ? { Authorization: `Bearer ${ttsApiKey}` } : {}),
      },
      body: JSON.stringify({
        model: ttsModel || "tts-1",
        input: text,
        voice: ttsVoice || "alloy",
      }),
      signal: currentAbortController.signal,
    });

    if (!response.ok) {
      throw new Error(`TTS Fetch error: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      currentAudio = new Audio(url);
      
      const cleanup = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      };

      currentAudio.onended = cleanup;
      currentAudio.onerror = cleanup;
      currentAudio.onpause = () => {
        // if paused by abort
        if (currentAudio) cleanup();
      };

      currentAudio.play().catch(cleanup);
    });
  } catch (err) {
    if (err.name === "AbortError") {
      // Ignored
      return Promise.resolve();
    }
    console.error("TTS playback failed:", err);
    return Promise.resolve();
  }
}

export function abortTTS() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
