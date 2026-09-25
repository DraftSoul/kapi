import { generateDeckImage, preloadIcons } from './deckRenderer.js';

let iconsReady = false;
let iconsPromise = null;

async function ensureIcons() {
  if (iconsReady) return;
  if (!iconsPromise) {
    iconsPromise = preloadIcons()
      .then(() => { iconsReady = true; })
      .catch((e) => {
        console.warn('图标预加载失败:', e.message);
        iconsReady = true; // 避免重复尝试
      });
  }
  return iconsPromise;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { deckCode, ...options } = body;
  if (!deckCode) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing deckCode' })
    };
  }

  try {
    await ensureIcons();
    const result = await generateDeckImage(deckCode, options);
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('生成失败:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};