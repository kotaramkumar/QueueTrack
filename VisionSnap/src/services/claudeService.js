import * as FileSystem from 'expo-file-system';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-6';

const SYSTEM_PROMPT = `You are VisionSnap AI, an expert image recognition and information system. Analyze the provided image carefully and return ONLY a valid JSON response (no markdown, no extra text).

Identify what is in the image and categorize it into one of these categories:
- leaf (a plant leaf or foliage)
- tree (a tree or woody plant)
- vegetable (an edible vegetable or root)
- food (prepared food or meal)
- animal (any animal — wild, domestic, bird, reptile, marine, insect, etc.)
- car (any automobile, truck, motorcycle, or vehicle)
- public_figure (a famous/notable person)
- historical_place (a historical monument, building, or landmark)
- country_flag (a country or national flag)
- world_map (a map showing geographic regions)
- object (any other identifiable object)

Return this exact JSON structure with ALL fields filled:

{
  "category": "<category>",
  "title": "<main subject name>",
  "confidence": "<high|medium|low>",
  "data": {}
}

The "data" object must contain category-specific fields:

LEAF data:
{ "plant_name": "...", "leaf_type": "...", "characteristics": ["...","..."], "medicinal_uses": ["...","..."], "ecological_importance": "..." }

TREE data:
{ "tree_name": "...", "scientific_name": "...", "average_height": "...", "geographic_origin": "...", "environmental_importance": "...", "lifespan": "...", "uses": ["...","..."] }

VEGETABLE data:
{ "name": "...", "scientific_name": "...", "nutritional_value": "...", "calories_per_100g": "...", "health_benefits": ["...","..."], "common_uses": ["...","..."], "storage_tips": "..." }

FOOD data:
{ "name": "...", "description": "...", "estimated_calories": "...", "nutritional_breakdown": { "carbohydrates": "...", "protein": "...", "fats": "..." }, "health_benefits": ["...","..."], "suggested_portion_size": "..." }

PUBLIC_FIGURE data:
{ "name": "...", "profession": "...", "nationality": "...", "born": "...", "died": "...", "known_for": "...", "achievements": ["...","..."], "biography_summary": "...", "note": "Based on general knowledge - please verify details independently." }

HISTORICAL_PLACE data:
{ "name": "...", "location": "...", "built": "...", "architectural_style": "...", "significance": "...", "historical_facts": ["...","..."], "visitor_info": "..." }

COUNTRY_FLAG data:
{ "country": "...", "capital": "...", "population": "...", "area": "...", "currency": "...", "official_language": ["..."], "flag_symbolism": "...", "interesting_facts": ["...","..."] }

WORLD_MAP data:
{ "region": "...", "countries_visible": ["...","..."], "geographic_features": ["...","..."], "interesting_facts": ["...","..."] }

ANIMAL data:
{ "common_name": "...", "scientific_name": "...", "animal_type": "...", "habitat": "...", "diet": "...", "lifespan": "...", "conservation_status": "...", "fun_facts": ["...","...","..."] }

CAR data:
{ "make": "...", "model": "...", "year": "...", "body_type": "...", "engine_type": "...", "country_of_origin": "...", "notable_features": ["...","..."], "fun_facts": ["...","..."] }

OBJECT data:
{ "name": "...", "description": "...", "category_detail": "...", "uses": ["...","..."], "interesting_facts": ["...","..."] }

Be accurate, educational, and informative. If the image is unclear, use confidence: "low".`;

function getMediaType(uri) {
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0];
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  return map[ext] || 'image/jpeg';
}

function parseClaudeResponse(text) {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

export async function analyzeImage(imageUri, apiKey) {
  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const mediaType = getMediaType(imageUri);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Analyze this image and return the JSON response.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const msg = errorBody?.error?.message || `API Error ${response.status}`;
    throw new Error(msg);
  }

  const responseData = await response.json();
  const textContent = responseData.content?.[0]?.text;

  if (!textContent) {
    throw new Error('Empty response from Claude API');
  }

  return parseClaudeResponse(textContent);
}
