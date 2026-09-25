import { parseDeckCode } from './deckRenderer.js';
import { allCards } from './cardData.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const factionNames = {
  soviet: "苏联", usa: "美国", poland: "波兰", neutral: "中立", japan: "日本",
  italy: "意大利", france: "法国", britain: "英国", finland: "芬兰", germany: "德国", anzac: "澳新军团"
};

// 精简卡牌字段，避免返回过多冗余数据
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

  // 与游戏内排序一致：按花费升序，其次按 cardId
  cards.sort((a, b) => {
    if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
    return a.card.cardId.localeCompare(b.card.cardId, undefined, { numeric: true, sensitivity: 'base' });
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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // 支持 GET ?deckCode=... 和 POST { deckCode }
  let deckCode = null;
  if (event.httpMethod === 'GET') {
    deckCode = event.queryStringParameters?.deckCode;
  } else if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      deckCode = body.deckCode;
    } catch {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }
  } else {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  if (!deckCode) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing deckCode' })
    };
  }

  try {
    const result = buildDeckJson(deckCode);
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('解析卡组失败:', err);
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};