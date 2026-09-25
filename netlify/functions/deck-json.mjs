import { parseDeckCode } from './deckRenderer.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const factionNames = {
  soviet: "苏联", usa: "美国", poland: "波兰", neutral: "中立", japan: "日本",
  italy: "意大利", france: "法国", britain: "英国", finland: "芬兰",
  germany: "德国", anzac: "澳新军团"
};

function serializeCard(c) {
  return {
    id: c.id,
    cardId: c.cardId,
    importId: c.importId,
    titleZh: c.titleZh,
    titleEn: c.titleEn,
    text_zh: c.text_zh,
    textMap: c.textMap,
    titleMap: c.titleMap,
    faction: c.faction,
    type: c.type,
    rarity: c.rarity,
    cost: c.cost,
    attack: c.attack,
    defense: c.defense,
    operationCost: c.operationCost,
    attributes: c.attributes,
    setName: c.setName,
    image: c.image,
    reserved: c.reserved,
    isSpawn: c.isSpawn,
    isVeteranSet: c.isVeteranSet,
    canCreate: c.canCreate,
    isCustom: c.isCustom
  };
}

function buildDeckJson(deckCode) {
  const parsed = parseDeckCode(deckCode);
  const { mainFaction, allyFaction, cardEntries } = parsed;

  const cards = cardEntries.map(({ card, count }) => ({
    count,
    card: serializeCard(card)
  }));

  // 按花费升序，其次按 cardId
  cards.sort((a, b) => {
    if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
    return a.card.cardId.localeCompare(b.card.cardId, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });

  const totalCards = cards.reduce((s, e) => s + e.count, 0);

  return {
    mainFaction,
    allyFaction,
    mainFactionName: factionNames[mainFaction] || mainFaction,
    allyFactionName: factionNames[allyFaction] || allyFaction,
    totalCards,
    uniqueCards: cards.length,
    cards
  };
}

export default async function handler(req, context) {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS });
  }

  let deckCode = null;

  if (req.method === 'GET') {
    const url = new URL(req.url);
    deckCode = url.searchParams.get('deckCode');
  } else if (req.method === 'POST') {
    try {
      const body = await req.json();
      deckCode = body.deckCode;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  if (!deckCode) {
    return new Response(JSON.stringify({ error: 'Missing deckCode' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  try {
    const result = buildDeckJson(deckCode);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  } catch (err) {
    console.error('解析卡组失败:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
}

export const config = {
  path: "/deck-json"
};