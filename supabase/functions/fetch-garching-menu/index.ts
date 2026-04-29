import { createClient } from "jsr:@supabase/supabase-js@2";

const SOURCE_URL = "https://www.studierendenwerk-muenchen-oberbayern.de/mensa/speiseplan/speiseplan_422_-de.html";
const CAMPUS = "garching";
const LOCATION = "Mensa Garching";
const MODEL = "heuristic-v1";

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
  name: string;
  labels: string[];
  score: number;
  reason: string;
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
      name = line.replace(/\s*\[Allergene\].*$/i, "").trim();
      break;
    }
    if (!name) continue;
    const prediction = predictScore(category, name, labels);
    items.push({ category, name, labels, ...prediction });
  }

  return items;
}

function predictScore(category: string, name: string, labels: string[]) {
  const text = `${category} ${name} ${labels.join(" ")}`.toLowerCase();
  let score = 3.2;
  const reasons: string[] = [];

  if (/(fleisch|fisch|grill|hähnchen|huhn|pute|puten|rind|gulasch|steak|seelachs|cordon|cevapcici)/.test(text)) {
    score += 0.55;
    reasons.push("蛋白质较足");
  }
  if (/(pasta|reis|kartoffel|rösti|gnocchi|couscous|polenta|nudel)/.test(text)) {
    score += 0.25;
    reasons.push("主食明确");
  }
  if (/(wok|curry|asiatisch|kokos|paprika|gemüse|bohnen|spinat|zucchini|aubergine)/.test(text)) {
    score += 0.25;
    reasons.push("配菜存在感强");
  }
  if (/(vegan|vegetarisch|tofu|falafel|erbsenprotein)/.test(text)) {
    score += 0.1;
    reasons.push("素食友好");
  }
  if (/(süßspeise|dessert|pudding|creme|joghurt|knödel|dampfnudel|kaiserschmarrn)/.test(text)) {
    score -= 0.45;
    reasons.push("更像甜点/轻食");
  }
  if (/(tagessuppe|suppe|brot|obst)/.test(text)) {
    score -= 0.25;
    reasons.push("饱腹感可能一般");
  }
  if (/(scharf|pikant|ajvar|salsa|bärlauch|hollandaise|kräuterbutter)/.test(text)) {
    score += 0.15;
    reasons.push("风味辨识度高");
  }
  if (/(schwein|speck|phosphat|formfleisch)/.test(text)) {
    score -= 0.1;
    reasons.push("口味可能更挑人");
  }

  const rounded = Math.max(2.2, Math.min(4.8, Math.round(score * 10) / 10));
  return {
    score: rounded,
    reason: reasons.slice(0, 2).join("，") || "基础款，风险较低",
  };
}

function summarize(items: MenuItem[]) {
  if (!items.length) return "今日食谱暂未同步。";
  const best = [...items].sort((a, b) => b.score - a.score)[0];
  return `今日推荐：${best.name}（${best.score.toFixed(1)}/5）`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase Edge Function environment" }, 500);
  }

  const dateString = berlinToday();
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Seat-Happens/1.0 menu cache" },
  });
  if (!response.ok) {
    return jsonResponse({ error: `Menu source failed: ${response.status}` }, 502);
  }

  const html = await response.text();
  const items = parseTodayItems(html, dateString);
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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { error } = await supabase
    .from("mensa_menu_daily")
    .upsert(payload, { onConflict: "campus,menu_date" });
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({
    ok: true,
    campus: CAMPUS,
    menu_date: dateString,
    count: items.length,
    summary: payload.summary,
  });
});
