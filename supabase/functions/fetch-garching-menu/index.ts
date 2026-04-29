import { createClient } from "jsr:@supabase/supabase-js@2";

const SOURCE_URL = "https://www.studierendenwerk-muenchen-oberbayern.de/mensa/speiseplan/speiseplan_422_-de.html";
const CAMPUS = "garching";
const LOCATION = "Mensa Garching";
const MODEL = "heuristic-zh-art-v2";
const ART_BUCKET = "mensa-dish-art";
const ART_CACHE_TABLE = "mensa_dish_art_cache";
const DEFAULT_IMAGE_MODEL = "gpt-image-1-mini";
const DEFAULT_MAX_IMAGE_GENERATIONS = 10;

const CATEGORY_NAMES = [
  "Pasta",
  "Pizza",
  "Grill",
  "Wok",
  "Studitopf",
  "Fleisch",
  "Fisch",
  "Vegan",
  "Vegetarisch/fleischlos",
  "Süßspeise",
  "Tagessupe, Brot, Obst",
  "Tagessuppe, Brot, Obst",
  "Dessert (Glas)",
  "Dessert",
  "Salat",
];

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

type MenuItem = {
  category: string;
  zhCategory: string;
  name: string;
  zhName: string;
  visual: string;
  dishKey?: string;
  artUrl?: string;
  artPath?: string;
  artStatus?: "cached" | "generated" | "fallback" | "failed";
  labels: string[];
  score: number;
  reason: string;
};

const CATEGORY_ZH: Record<string, string> = {
  Pasta: "意面",
  Pizza: "披萨",
  Grill: "烧烤",
  Wok: "炒菜",
  Studitopf: "学生锅",
  Fleisch: "肉类",
  Fisch: "鱼类",
  Vegan: "纯素",
  "Vegetarisch/fleischlos": "素食",
  Süßspeise: "甜食",
  "Tagessupe, Brot, Obst": "汤/面包/水果",
  "Tagessuppe, Brot, Obst": "汤/面包/水果",
  "Dessert (Glas)": "甜点",
  Dessert: "甜点",
  Salat: "沙拉",
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function berlinToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "1970";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

function targetGermanDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00+01:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${WEEKDAYS[date.getDay()]}, ${day}.${month}.${year}`;
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß");
}

function htmlToLines(html: string) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<(li|br|p|div|h[1-6]|tr|td|th|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeHtml(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isDateHeader(line: string) {
  return /^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag), \d{2}\.\d{2}\.\d{4}$/.test(line);
}

function isNoiseLine(line: string) {
  if (!line) return true;
  if (line === "[Allergene]") return true;
  if (/^[A-E](\s+[A-E])*$/.test(line)) return true;
  if (/^\([A-Za-z0-9,.\s]+\)$/.test(line)) return true;
  if (/^(f|v|R|S|Bio|Ei|En|Fi|Gl|GlW|GlR|GlG|GlH|GlD|Kr|Lu|Mi|Sc|Se|Sf|Sl|So|Sw|Wt|Kn|99)\b/.test(line)) return true;
  if (/^(Allergene|Allergene- und Zusatzstoffe|Zusatzstoffe)/.test(line)) return true;
  return false;
}

function parseTodayItems(html: string, dateString: string) {
  const lines = htmlToLines(html);
  const wanted = targetGermanDate(dateString);
  const start = lines.findIndex((line) => line === wanted);
  if (start < 0) return [];
  let end = lines.findIndex((line, index) => index > start && isDateHeader(line));
  if (end < 0) end = lines.length;
  const dayLines = lines.slice(start + 1, end);
  const items: MenuItem[] = [];

  for (let index = 0; index < dayLines.length; index += 1) {
    const category = CATEGORY_NAMES.find((name) => dayLines[index] === name);
    if (!category) continue;
    const labels: string[] = [];
    let name = "";
    for (let next = index + 1; next < dayLines.length; next += 1) {
      const line = dayLines[next];
      if (CATEGORY_NAMES.includes(line) || isDateHeader(line)) break;
      if (isNoiseLine(line)) {
        if (/^\([^)]+\)$/.test(line)) labels.push(line.replace(/[()]/g, ""));
        continue;
      }
      const rawName = line.replace(/\s*\[Allergene\].*$/i, "").trim();
      const inlineLabels = rawName.match(/\(([A-Za-z0-9,.\s]+)\)\s*$/);
      if (inlineLabels?.[1]) labels.push(inlineLabels[1]);
      name = rawName.replace(/\s*\([A-Za-z0-9,.\s]+\)\s*$/, "").trim();
      break;
    }
    if (!name) continue;
    const prediction = predictScore(category, name, labels);
    const translation = translateDish(category, name);
    items.push({
      category,
      zhCategory: CATEGORY_ZH[category] || category,
      name,
      zhName: translation.zhName,
      visual: translation.visual,
      labels,
      ...prediction,
    });
  }

  return items;
}

function translateDish(category: string, name: string) {
  const text = `${category} ${name}`.toLowerCase();
  const cleanName = name.replace(/\s+/g, " ").trim();
  const exact: Array<[RegExp, string, string]> = [
    [/pasta.*gemüsebolognese/, "蔬菜博洛尼亚酱意面", "pasta"],
    [/halloumi.*salsa/, "哈罗米芝士配莎莎酱", "veg"],
    [/asiatisches gemüse/, "亚洲风味蔬菜", "veg"],
    [/senner rösti.*bergkäse.*kräuterdip/, "山地奶酪土豆饼配香草蘸酱", "veg"],
    [/gulasch.*schwein/, "猪肉古拉什炖菜", "grill"],
    [/gebratenes seelachsfilet/, "香煎青鳕鱼排", "fish"],
    [/champignoncremesuppe/, "蘑菇奶油汤", "soup"],
    [/veganer chiapudding/, "纯素奇亚籽布丁", "dessert"],
  ];
  const hit = exact.find(([pattern]) => pattern.test(text));
  if (hit) return { zhName: hit[1], visual: hit[2] };

  let visual = "plate";
  if (/(fisch|seelachs|filet)/.test(text)) visual = "fish";
  else if (/(suppe|creme)/.test(text)) visual = "soup";
  else if (/(süßspeise|dessert|pudding|joghurt|knödel|dampfnudel|kaiserschmarrn)/.test(text)) visual = "dessert";
  else if (/(vegan|vegetarisch|gemüse|tofu|falafel|halloumi|rösti)/.test(text)) visual = "veg";
  else if (/(pasta|nudel|gnocchi)/.test(text)) visual = "pasta";
  else if (/(fleisch|grill|gulasch|schwein|rind|hähnchen|pute)/.test(text)) visual = "grill";

  const replacements: Array<[RegExp, string]> = [
    [/veganer?|vegan/gi, "纯素"],
    [/vegetarisch|fleischlos/gi, "素食"],
    [/pasta/gi, "意面"],
    [/pizza/gi, "披萨"],
    [/gemüse/gi, "蔬菜"],
    [/rösti/gi, "土豆饼"],
    [/bergkäse/gi, "山地奶酪"],
    [/kräuterdip/gi, "香草蘸酱"],
    [/hähnchen|huhn/gi, "鸡肉"],
    [/pute|puten/gi, "火鸡肉"],
    [/rind/gi, "牛肉"],
    [/schwein/gi, "猪肉"],
    [/fisch|seelachs/gi, "鱼"],
    [/cremesuppe/gi, "奶油汤"],
    [/suppe/gi, "汤"],
    [/pudding/gi, "布丁"],
    [/salat/gi, "沙拉"],
    [/käse|kaese/gi, "奶酪"],
    [/tomaten/gi, "番茄"],
    [/champignon/gi, "蘑菇"],
    [/kartoffel/gi, "土豆"],
    [/gebraten(e|es|er)?/gi, "香煎"],
    [/gedünstet(e|es|er)?/gi, "炖煮"],
    [/asiatisch(e|es|er)?/gi, "亚洲风味"],
    [/sauce|soße/gi, "酱汁"],
    [/dip/gi, "蘸酱"],
    [/\bmit\b/gi, "配"],
    [/\bund\b/gi, "和"],
  ];
  let translated = cleanName;
  for (const [pattern, replacement] of replacements) {
    translated = translated.replace(pattern, replacement);
  }
  if (translated === cleanName) {
    translated = `${CATEGORY_ZH[category] || "餐品"}：${cleanName}`;
  } else if (!/[\u4e00-\u9fff]/.test(translated)) {
    translated = `${CATEGORY_ZH[category] || "餐品"}：${cleanName}`;
  }
  return { zhName: translated, visual };
}

function normalizeDishName(category: string, name: string) {
  return `${CAMPUS}|${category}|${name}`
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesFromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function dishArtPrompt(item: MenuItem) {
  return [
    "Draw one square food sticker illustration for a student cafeteria menu.",
    "Style: cheerful polished cartoon, thick deep-navy outline, warm comic storyboard color, clean simple shapes, transparent background.",
    "No text, no letters, no logo, no watermark, no people.",
    `Dish in Chinese: ${item.zhName}.`,
    `Original German dish name: ${item.name}.`,
    `Category: ${item.zhCategory}.`,
    "Make the food readable at small size inside a web sidebar card.",
  ].join(" ");
}

async function generateDishArt(openaiKey: string, item: MenuItem, model: string) {
  const prompt = dishArtPrompt(item);
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "low",
      background: "transparent",
      output_format: "png",
    }),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI image generation failed: ${response.status} ${details.slice(0, 500)}`);
  }
  const data = await response.json();
  const imageBase64 = data?.data?.[0]?.b64_json;
  if (!imageBase64) throw new Error("OpenAI image response did not include b64_json");
  return { bytes: bytesFromBase64(imageBase64), prompt };
}

async function dishKeyFor(item: MenuItem) {
  return await sha256Hex(normalizeDishName(item.category, item.name));
}

async function attachDishArt(supabase: ReturnType<typeof createClient>, items: MenuItem[]) {
  const openaiKey = Deno.env.get("OPENAI_API_KEY") || "";
  const imageModel = Deno.env.get("OPENAI_IMAGE_MODEL") || DEFAULT_IMAGE_MODEL;
  const maxGenerations = Number(Deno.env.get("MENSA_ART_MAX_GENERATIONS") || DEFAULT_MAX_IMAGE_GENERATIONS);
  const keyedItems = await Promise.all(items.map(async (item) => ({ ...item, dishKey: await dishKeyFor(item) })));
  const keys = keyedItems.map((item) => item.dishKey).filter(Boolean) as string[];
  const stats = {
    cached: 0,
    generated: 0,
    fallback: 0,
    failed: 0,
    openaiConfigured: Boolean(openaiKey),
  };

  const cachedMap = new Map<string, { image_url: string; image_path: string; model: string }>();
  if (keys.length) {
    const { data, error } = await supabase
      .from(ART_CACHE_TABLE)
      .select("dish_key,image_url,image_path,model")
      .in("dish_key", keys);
    if (error) console.warn("Dish art cache lookup failed", error.message);
    for (const row of data || []) {
      cachedMap.set(row.dish_key, row);
    }
  }

  let generatedThisRun = 0;
  const enriched: MenuItem[] = [];
  for (const item of keyedItems) {
    const cached = item.dishKey ? cachedMap.get(item.dishKey) : undefined;
    if (cached) {
      stats.cached += 1;
      enriched.push({ ...item, artUrl: cached.image_url, artPath: cached.image_path, artStatus: "cached" });
      continue;
    }

    if (!openaiKey || generatedThisRun >= maxGenerations) {
      stats.fallback += 1;
      enriched.push({ ...item, artStatus: "fallback" });
      continue;
    }

    try {
      const art = await generateDishArt(openaiKey, item, imageModel);
      const imagePath = `${CAMPUS}/${item.dishKey}.png`;
      const { error: uploadError } = await supabase.storage
        .from(ART_BUCKET)
        .upload(imagePath, art.bytes, {
          contentType: "image/png",
          upsert: true,
        });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage.from(ART_BUCKET).getPublicUrl(imagePath);
      const imageUrl = publicUrlData.publicUrl;
      const cachePayload = {
        dish_key: item.dishKey,
        campus: CAMPUS,
        original_name: item.name,
        zh_name: item.zhName,
        visual: item.visual,
        image_path: imagePath,
        image_url: imageUrl,
        prompt: art.prompt,
        model: imageModel,
      };
      const { error: cacheError } = await supabase
        .from(ART_CACHE_TABLE)
        .upsert(cachePayload, { onConflict: "dish_key" });
      if (cacheError) throw new Error(cacheError.message);

      generatedThisRun += 1;
      stats.generated += 1;
      enriched.push({ ...item, artUrl: imageUrl, artPath: imagePath, artStatus: "generated" });
    } catch (error) {
      stats.failed += 1;
      console.warn("Dish art generation failed", item.name, error instanceof Error ? error.message : error);
      enriched.push({ ...item, artStatus: "failed" });
    }
  }

  return { items: enriched, stats };
}

function predictScore(category: string, name: string, labels: string[]) {
  const text = `${category} ${name} ${labels.join(" ")}`.toLowerCase();
  let score = 3.0;
  const traits = {
    protein: false,
    carb: false,
    vegetable: false,
    vegan: false,
    sweet: false,
    soup: false,
    bold: false,
    pork: false,
    fish: false,
    cheese: false,
    creamy: false,
    spicy: false,
  };

  if (/(fleisch|fisch|grill|hähnchen|huhn|pute|puten|rind|gulasch|steak|seelachs|cordon|cevapcici)/.test(text)) {
    score += 0.85;
    traits.protein = true;
  }
  if (/(pasta|reis|kartoffel|rösti|gnocchi|couscous|polenta|nudel)/.test(text)) {
    score += 0.4;
    traits.carb = true;
  }
  if (/(wok|curry|asiatisch|paprika|gemüse|weißkohl|weisskohl|bohnen|spinat|zucchini|aubergine)/.test(text)) {
    score += 0.3;
    traits.vegetable = true;
  }
  if (/(vegan|vegetarisch|tofu|falafel|erbsenprotein)/.test(text)) {
    score += 0.05;
    traits.vegan = true;
  }
  if (/(süßspeise|dessert|pudding|joghurt|knödel|dampfnudel|kaiserschmarrn)/.test(text)) {
    score -= 0.8;
    traits.sweet = true;
  }
  if (/(tagessuppe|suppe|brot|obst)/.test(text)) {
    score -= 0.55;
    traits.soup = true;
  }
  if (/(scharf|pikant|ajvar|salsa|bärlauch|hollandaise|kräuterbutter)/.test(text)) {
    score += 0.25;
    traits.bold = true;
  }
  if (/(schwein|speck|phosphat|formfleisch)/.test(text)) {
    score -= 0.25;
    traits.pork = true;
  }
  traits.fish = /(fisch|seelachs|filet)/.test(text);
  traits.cheese = /(käse|kaese|halloumi|bergkäse)/.test(text);
  traits.creamy = /(creme|hollandaise|kokosmilch|dip|sauce|soße)/.test(text);
  traits.spicy = /(scharf|pikant|ajvar|salsa)/.test(text);
  if (traits.fish) score += 0.15;
  if (traits.cheese) score += 0.25;
  if (traits.creamy && traits.sweet) score -= 0.1;
  else if (traits.creamy && !traits.cheese) score -= 0.05;
  if (/rösti|rosti/.test(text)) score += 0.25;
  if (/halloumi/.test(text)) score += 0.2;
  if (/champignoncremesuppe/.test(text)) score -= 0.15;
  if (/chiapudding|kokosmilch|mango/.test(text)) score -= 0.2;

  const rounded = Math.max(2.0, Math.min(4.9, Math.round(score * 10) / 10));
  return {
    score: rounded,
    reason: buildMenuReview(category, name, rounded, traits),
  };
}

type MenuTraits = {
  protein: boolean;
  carb: boolean;
  vegetable: boolean;
  vegan: boolean;
  sweet: boolean;
  soup: boolean;
  bold: boolean;
  pork: boolean;
  fish: boolean;
  cheese: boolean;
  creamy: boolean;
  spicy: boolean;
};

function buildMenuReview(category: string, name: string, _score: number, _traits: MenuTraits) {
  const text = `${category} ${name}`.toLowerCase();
  return menuPoemReview(text);
}

function menuItemOverview(text: string, traits: MenuTraits) {
  if (/rösti|rosti/.test(text)) return "稀有主菜：外脆内软的土豆饼叠加山地奶酪和香草蘸酱，主打高饱腹与高满足。";
  if (/halloumi/.test(text)) return "近战奶酪单位：哈罗米提供咸香弹牙的主体，莎莎酱负责补一点清爽暴击。";
  if (/gulasch/.test(text)) return "热炖系主菜：猪肉、炖汁和香料组成稳定输出，适合需要热量护盾的午饭时段。";
  if (/hollandaise|seelachs|fisch|filet/.test(text)) return "鱼排法术牌：青鳕鱼排配荷兰酱，走的是鲜味加奶油酸香的中量级路线。";
  if (/pasta/.test(text)) return "基础碳水装备：意面配蔬菜酱，稳定、管饱、失误率低。";
  if (/asiatisches gemüse|weißkohl|weisskohl/.test(text)) return "轻甲蔬菜包：白菜和酱炒蔬菜提供脆度与咸鲜，整体偏轻。";
  if (/champignoncremesuppe/.test(text)) return "暖胃小药水：蘑菇奶油汤提供顺滑口感和一点菌菇香气。";
  if (/chiapudding|kokosmilch|mango/.test(text)) return "甜点饰品：奇亚籽、椰奶和芒果组成清爽甜口，适合补一点心情值。";
  if (/cevapcici|ajvar/.test(text)) return "烤肉爆发装：肉肠加红椒酱，咸香、酸甜和烟火气都比较直接。";
  if (traits.soup) return "轻量补给品：以汤底和温度为核心，适合补充但不适合单挑饥饿值。";
  if (traits.sweet) return "甜口小道具：主要提供糖分和快乐，不负责完整午饭战斗。";
  if (traits.cheese) return "奶酪强化件：咸香和脂肪感明显，满足感通常来得很快。";
  if (traits.protein && traits.carb) return "标准午饭套装：蛋白质和主食都在，续航能力比较完整。";
  if (traits.protein) return "蛋白质单件：主菜属性明确，但最好再配一点主食。";
  if (traits.vegetable) return "蔬菜功能件：清爽度和配色在线，饱腹输出看酱汁和油量。";
  return "普通食堂装备：基础属性平均，主要承担快速填饱肚子的任务。";
}

function menuSharpComment(text: string, traits: MenuTraits) {
  if (/rösti|rosti/.test(text)) return "锐评：这是午饭里的重甲战士，吃完大概率不是想学习，是想找个地方存档。";
  if (/halloumi/.test(text)) return "锐评：奶酪玩家狂喜，但盐度可能会让你下午多跑两趟饮水机。";
  if (/gulasch/.test(text)) return "锐评：看起来像食堂版回血药，问题是回血之后可能触发饭困 debuff。";
  if (/hollandaise|seelachs|fisch|filet/.test(text)) return "锐评：鱼排本来想走清爽路线，荷兰酱一来直接给它穿上了奶油披风。";
  if (/pasta/.test(text)) return "锐评：不会惊艳，但像默认武器一样可靠，至少不会让你打开外卖软件。";
  if (/asiatisches gemüse|weißkohl|weisskohl/.test(text)) return "锐评：蔬菜很努力，问题是它可能需要一位主菜队友带飞。";
  if (/champignoncremesuppe/.test(text)) return "锐评：像一瓶温柔小药水，喝完很暖，但别指望它单刷下午三小时。";
  if (/chiapudding|kokosmilch|mango/.test(text)) return "锐评：这是甜点栏的精致皮肤，不是午饭栏的毕业装备。";
  if (/cevapcici|ajvar/.test(text)) return "锐评：烤肉和红椒酱属于高声量组合，适合今天想让味觉上线的人。";
  if (traits.soup) return "锐评：它负责安慰胃，不负责击败饥饿。";
  if (traits.sweet) return "锐评：快乐值加成明显，饱腹值就别太认真了。";
  if (traits.spicy) return "锐评：自带一点醒脑特效，比下午第一节课更努力。";
  if (traits.cheese) return "锐评：奶酪一出手，清淡路线基本宣布投降。";
  if (traits.protein && traits.carb) return "锐评：属性面板很完整，就是吃完可能需要和困意打一架。";
  if (traits.vegetable) return "锐评：看起来很健康，能不能吃饱属于隐藏任务。";
  return "锐评：平平无奇但能交差，属于食堂里的白板装备。";
}

function menuPoemReview(text: string) {
  return menuPoemLines(text).join("\n");
}

function menuPoemLines(text: string): [string, string] {
  if (/r[oö]sti|roesti|kartoffel|bergk|土豆|薯/.test(text)) return ["金酪融香裹薯衣", "脆云入口满山辉"];
  if (/halloumi|salsa|哈罗米|莎莎/.test(text)) return ["盐乳煎香映翠盘", "红莎一抹醒春寒"];
  if (/seelachs|fisch|fish|filet|鳕|鱼/.test(text)) return ["银鳕初煎雪未消", "酪汁轻披海气遥"];
  if (/gulasch|schwein|pork|猪|古拉什/.test(text)) return ["红汤慢炖肉香浓", "热雾盈盘午梦重"];
  if (/pasta|nudel|bolognese|意面|面/.test(text)) return ["番蔬缠面染晴光", "叉起春风一缕长"];
  if (/champignon|suppe|soup|蘑菇|汤/.test(text)) return ["菇影浮汤暖玉瓯", "轻烟入口慰清愁"];
  if (/chia|pudding|kokos|mango|布丁|芒果|甜/.test(text)) return ["椰乳凝珠藏晓露", "芒金一点落晴沙"];
  if (/gemüse|gemuese|weisskohl|asiatisch|vegetable|蔬|菜/.test(text)) return ["青蔬入镬带春声", "淡火翻香醒午晴"];
  if (/cevap|ajvar|grill|烤|肉/.test(text)) return ["炭香绕指红椒醒", "肉火初成午气豪"];
  return ["热盘初上慰饥肠", "一箸清欢抵午忙"];
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return hash;
}

function summarize(items: MenuItem[]) {
  if (!items.length) return "今日食谱暂未同步。";
  const best = [...items].sort((a, b) => b.score - a.score)[0];
  return `今日推荐：${best.zhName || best.name}（${best.score.toFixed(1)}/5）`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase Edge Function environment" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const dateString = berlinToday();
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Seat-Happens/1.0 menu cache" },
  });
  if (!response.ok) {
    return jsonResponse({ error: `Menu source failed: ${response.status}` }, 502);
  }

  const html = await response.text();
  const parsedItems = parseTodayItems(html, dateString);
  const { items, stats: artStats } = await attachDishArt(supabase, parsedItems);
  const payload = {
    campus: CAMPUS,
    menu_date: dateString,
    location: LOCATION,
    source_url: SOURCE_URL,
    fetched_at: new Date().toISOString(),
    prediction_model: MODEL,
    summary: summarize(items),
    items,
  };

  const { error } = await supabase
    .from("mensa_menu_daily")
    .upsert(payload, { onConflict: "campus,menu_date" });
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({
    ok: true,
    campus: CAMPUS,
    menu_date: dateString,
    count: items.length,
    art: artStats,
    summary: payload.summary,
  });
});
