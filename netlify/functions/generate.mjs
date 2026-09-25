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
        iconsReady = true;
      });
  }
  return iconsPromise;
}

export default async function handler(req, context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const { deckCode, ...options } = body;
  if (!deckCode) {
    return new Response(JSON.stringify({ error: 'Missing deckCode' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    await ensureIcons();
    const result = await generateDeckImage(deckCode, options);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (err) {
    console.error('生成失败:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export const config = {
  path: "/generate"
};