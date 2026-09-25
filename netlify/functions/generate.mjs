import { generateDeckImage, preloadIcons } from './deckRenderer.mjs';

let iconsReady = false;
let iconsPromise = null;

async function ensureIcons() {
  if (iconsReady) return;
  if (!iconsPromise) {
    iconsPromise = preloadIcons()
      .then(() => { iconsReady = true; })
      .catch((e) => {
        console.warn('图标预加载失败:', e.message);
        iconsReady = true;
      });
  }
  return iconsPromise;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, context) {
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  const { deckCode, ...options } = body;
  if (!deckCode) {
    return new Response(JSON.stringify({ error: 'Missing deckCode' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  try {
    await ensureIcons();
    const result = await generateDeckImage(deckCode, options);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  } catch (err) {
    console.error('生成失败:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
}

export const config = {
  path: "/generate"
};