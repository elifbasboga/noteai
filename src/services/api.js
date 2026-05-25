const BASE_URL = 'http://192.168.1.105:3000/api';
const DEFAULT_REQUEST_TIMEOUT_MS = 60000;
const OCR_REQUEST_TIMEOUT_MS = 300000;

function getFileName(fileUri, fileType) {
  const cleanUri = fileUri.split('?')[0];
  const uriName = cleanUri.split('/').pop();

  if (uriName) {
    return uriName;
  }

  return fileType === 'pdf' ? 'note.pdf' : 'note-image.jpg';
}

function getMimeType(fileUri, fileType) {
  if (fileType === 'pdf') {
    return 'application/pdf';
  }

  const lowerUri = fileUri.toLowerCase();

  if (lowerUri.endsWith('.png')) {
    return 'image/png';
  }

  if (lowerUri.endsWith('.webp')) {
    return 'image/webp';
  }

  if (lowerUri.endsWith('.gif')) {
    return 'image/gif';
  }

  return 'image/jpeg';
}

async function request(path, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Backend sunucusunu kontrol et.');
    }

    throw new Error(error.message || 'Backend bağlantısı kurulamadı.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export const ApiService = {
  extractText: async (fileUri, fileType) => {
    const formData = new FormData();

    formData.append('file', {
      uri: fileUri,
      name: getFileName(fileUri, fileType),
      type: getMimeType(fileUri, fileType),
    });

    const data = await request('/ocr/extract', {
      method: 'POST',
      body: formData,
      timeoutMs: OCR_REQUEST_TIMEOUT_MS,
    });

    return data.text;
  },

  summarize: async (text, subject) => {
    const data = await request('/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, subject }),
    });

    return data.summary;
  },

  generateQuestions: async (text, subject) => {
    const data = await request('/ai/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, subject }),
    });

    return data.questions;
  },

  generateFlashcards: async (text, subject) => {
    const data = await request('/ai/generate-flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, subject }),
    });

    return data.flashcards;
  },
};
