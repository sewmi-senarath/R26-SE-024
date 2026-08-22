// Game imagery via Groq-crafted prompts rendered by fal.ai (FLUX schnell), with
// a permanent server-side cache.
//
// Why this stack:
//   * Stock photos (Pexels/Openverse) were uncontrollable — wrong matches,
//     watermarks, baked-in text — which confuses dementia patients.
//   * Pollinations was free but rate-limited to ONE request at a time per IP, so
//     rendering the ~6 fresh images a game needs took 30-60s serialized.
//   * fal.ai runs FLUX concurrently and fast (~1-3s each), so we can render all
//     of a game's images IN PARALLEL, on demand, even though the words are
//     freshly sampled every play.
//
// Flow: Groq turns each item into a concrete, unambiguous visual description;
// FLUX renders it in ONE fixed clean "no text" style. Each rendered image is
// downloaded once into `backend/public/game-images/` (served by express.static)
// so repeated words are instant and free thereafter. Anything that fails leaves
// the item with its emoji (the frontend falls back to it).

const fs = require("fs");
const path = require("path");
const config = require("../../../config/config");
const { generateImagePrompts } = require("./llmGameContentService");

const CACHE_DIR = path.resolve(__dirname, "../../../../public/game-images");
try {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
} catch {
  /* ignore — surfaced later if writes fail */
}

// One shared, deliberately plain style so every generated item looks like part
// of the same set, and — crucially — never contains text/watermarks.
const IMAGE_STYLE =
  "simple realistic illustration, single centered subject, plain white " +
  "background, soft even lighting, clean, clear and instantly recognizable, " +
  "no text, no words, no letters, no watermark, no border";

const FAL_BASE_URL = "https://fal.run";

let warnedNoKey = false;
function falKey() {
  if (!config.falApiKey) {
    if (!warnedNoKey) {
      console.warn(
        "[game-images] FAL_KEY is not set — game items will show emojis " +
          "instead of images. Get a key at https://fal.ai/dashboard/keys"
      );
      warnedNoKey = true;
    }
    return null;
  }
  return config.falApiKey;
}

function hashOf(str) {
  const s = String(str).trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < s.length; i += 1) {
    hash = ((hash * 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function slugify(term) {
  return (
    String(term)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "item"
  );
}

// The "-fx" tag marks this (fal.ai FLUX) cache era, so files from the earlier
// Pollinations ("-ai"), stock-photo ("-p") and original eras can never be
// matched and served again, even if they still sit in the folder.
function fileNameFor(term) {
  return `${slugify(term)}-fx${hashOf(term)}.jpg`;
}

function cachePathFor(term) {
  return path.join(CACHE_DIR, fileNameFor(term));
}

function isCached(term) {
  return fs.existsSync(cachePathFor(term));
}

// A safe literal description used when Groq is unavailable. Concrete nouns
// (the bulk of the static/seeder vocabulary) render fine from just the word.
function heuristicDescription(term, category) {
  const base = String(term || "").trim().toLowerCase();
  const cat = String(category || "").trim().toLowerCase();
  if (!base) return "";
  return cat && cat !== base ? `a ${base}, a kind of ${cat}` : `a ${base}`;
}

function fullPrompt(description) {
  return `${description}, ${IMAGE_STYLE}`;
}

// Render a prompt with FLUX schnell and return the hosted image URL, or null on
// failure. fal.ai's synchronous endpoint returns the result directly and allows
// concurrent calls, so callers can Promise.all a whole game's worth.
async function renderFalUrl(prompt) {
  const key = falKey();
  if (!key || !prompt) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${FAL_BASE_URL}/${config.falModel}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "square",
        num_images: 1,
        num_inference_steps: 4,
        enable_safety_checker: true,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[game-images] fal.ai render failed (${res.status})`);
      return null;
    }
    const data = await res.json();
    const image = Array.isArray(data.images) ? data.images[0] : null;
    return image && image.url ? image.url : null;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.warn("[game-images] fal.ai render error:", error.message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Download an already-rendered image URL into the cache. Deduped so concurrent
// callers for the same term don't double-download.
const inFlight = new Set();
async function downloadToCache(term, sourceUrl) {
  const clean = String(term || "").trim();
  if (!clean || !sourceUrl) return false;

  const dest = cachePathFor(clean);
  const file = path.basename(dest);
  if (fs.existsSync(dest)) return true;
  if (inFlight.has(file)) return true;

  inFlight.add(file);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(sourceUrl, { signal: controller.signal });
    if (!res.ok) return false;

    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return false;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return false; // guard against tiny error payloads

    await fs.promises.writeFile(dest, buf);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
    inFlight.delete(file);
  }
}

// Render a term into the cache (used by the seeder and any pre-warming). `prompt`
// is the full FLUX prompt; when omitted we build a heuristic one from the term.
// Best-effort: any failure leaves the term uncached (item keeps its emoji).
async function warmToCache(term, prompt, category) {
  const clean = String(term || "").trim();
  if (!clean) return false;
  if (isCached(clean)) return true;

  const finalPrompt = prompt || fullPrompt(heuristicDescription(clean, category));
  const url = await renderFalUrl(finalPrompt);
  if (!url) return false;
  return downloadToCache(clean, url);
}

// Categories we must NOT auto-illustrate. A "Family" item's label is a real
// person's name, so a generated face would be a wrong, confusing face for that
// relative — those keep their emoji, or the real uploaded photo if present.
const SKIP_CATEGORIES = new Set(["family"]);

function shouldSkip(item) {
  const category = String(item.category || "").trim().toLowerCase();
  return SKIP_CATEGORIES.has(category);
}

// Ask Groq for concrete visual descriptions for the given items, in one batch
// call. Returns a Map term -> description; empty map on any failure.
async function resolvePrompts(items) {
  const payload = items.map((it) => ({
    term: it.label || it.word,
    category: it.category,
    hint: it.hint,
  }));
  try {
    const prompts = await generateImagePrompts(payload);
    return new Map(Object.entries(prompts || {}));
  } catch (error) {
    console.warn("[game-images] Groq prompt generation failed:", error.message);
    return new Map();
  }
}

// Fill `image` for every item that doesn't already have one (real family photos
// are attached earlier and take priority). Cached items get our own fast URL;
// uncached items are rendered NOW — all in parallel via fal.ai — so real images
// appear on the very first play, then are downloaded into the cache in the
// background for next time. `baseUrl` is this server's origin so devices can
// reach the cached files.
async function attachGeneratedImages(items, baseUrl) {
  if (!Array.isArray(items)) return items;
  const prefix = baseUrl ? String(baseUrl).replace(/\/$/, "") : "";

  const uncached = items.filter(
    (item) =>
      item &&
      !item.image &&
      !shouldSkip(item) &&
      (item.label || item.word) &&
      !isCached(item.label || item.word)
  );
  const promptMap = uncached.length ? await resolvePrompts(uncached) : new Map();

  // Render every uncached item concurrently, then map results back by term.
  const renderedUrls = new Map();
  await Promise.all(
    uncached.map(async (item) => {
      const term = item.label || item.word;
      const description = promptMap.get(term) || heuristicDescription(term, item.category);
      const url = await renderFalUrl(fullPrompt(description));
      if (url) {
        renderedUrls.set(term, url);
        downloadToCache(term, url).catch(() => {}); // persist for next time
      }
    })
  );

  return items.map((item) => {
    if (!item || item.image || shouldSkip(item)) return item;

    const term = item.label || item.word;
    if (!term) return item;

    if (isCached(term)) {
      return { ...item, image: `${prefix}/game-images/${fileNameFor(term)}` };
    }

    const fresh = renderedUrls.get(term);
    return fresh ? { ...item, image: fresh } : item; // else keep emoji
  });
}

module.exports = {
  attachGeneratedImages,
  warmToCache,
  isCached,
  CACHE_DIR,
};
