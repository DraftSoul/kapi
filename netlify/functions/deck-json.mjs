import { parseDeckCode } from './deckRenderer.mjs';

export default async function handler(req, context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  if (!deckCode) {
    return new Response(JSON.stringify({ error: 'Missing deckCode' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const parsed = parseDeckCode(deckCode);
    const { mainFaction, allyFaction, cardEntries } = parsed;
    const factionNames = {
      soviet: "苏联", usa: "美国", poland: "波兰", neutral: "中立", japan: "日本",
      italy: "意大利", france: "法国", britain: "英国", finland: "芬兰",
      germany: "德国", anzac: "澳新军团"
    };

    const cards = cardEntries.map(({ card, count }) => ({
      count,
      card: {
        id: card.id, cardId: card.cardId, importId: card.importId,
        titleZh: card.titleZh, titleEn: card.titleEn, text_zh: card.text_zh,
        textMap: card.textMap, titleMap: card.titleMap,
        faction: card.faction, type: card.type, rarity: card.rarity,
        cost: card.cost, attack: card.attack, defense: card.defense,
        operationCost: card.operationCost, attributes: card.attributes,
        setName: card.setName, image: card.image, reserved: card.reserved,
        isSpawn: card.isSpawn, isVeteranSet: card.isVeteranSet,
        canCreate: card.canCreate, isCustom: card.isCustom
      }
    }));

    return new Response(JSON.stringify({
      mainFaction, allyFaction,
      mainFactionName: factionNames[mainFaction] || mainFaction,
      allyFactionName: factionNames[allyFaction] || allyFaction,
      totalCards: cards.reduce((s, e) => s + e.count, 0),
      uniqueCards: cards.length,
      cards
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export const config = {
  path: "/deck-json"
};