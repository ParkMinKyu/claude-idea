// Print-on-Demand auto-register MVP.
// Translates a design + preset into a list of Printful sync products
// and (optionally) publishes them via the Printful API.

export const PRESETS = {
  "apparel-pack": {
    items: [
      { catalog_product_id: 71, name: "Unisex T-Shirt", base_cost: 9.5 }, // Bella+Canvas 3001
      { catalog_product_id: 146, name: "Pullover Hoodie", base_cost: 22.0 },
      { catalog_product_id: 84, name: "Tank Top", base_cost: 10.5 },
    ],
    colors: ["white", "black", "navy"],
    sizes: ["S", "M", "L", "XL"],
  },
  "drinkware-pack": {
    items: [
      { catalog_product_id: 19, name: "White Ceramic Mug 11oz", base_cost: 5.95 },
      { catalog_product_id: 327, name: "Stainless Tumbler 20oz", base_cost: 14.0 },
    ],
    colors: ["white"],
    sizes: ["one"],
  },
  "wall-art": {
    items: [
      { catalog_product_id: 1, name: "Enhanced Matte Poster", base_cost: 8.0 },
      { catalog_product_id: 162, name: "Canvas 12x16", base_cost: 18.5 },
    ],
    colors: ["white"],
    sizes: ["12x16", "18x24"],
  },
};

export function priceFromMargin(baseCost, marginPercent) {
  if (marginPercent < 0 || marginPercent >= 100) {
    throw new Error("marginPercent must be in [0, 100)");
  }
  // price * (1 - margin) = cost => price = cost / (1 - margin)
  const price = baseCost / (1 - marginPercent / 100);
  return Math.round(price * 100) / 100;
}

export function expandPreset(design, presetId, marginPercent = 40) {
  const preset = PRESETS[presetId];
  if (!preset) throw new Error(`Unknown preset: ${presetId}`);
  const variants = [];
  for (const item of preset.items) {
    for (const color of preset.colors) {
      for (const size of preset.sizes) {
        variants.push({
          catalog_product_id: item.catalog_product_id,
          product_name: item.name,
          color,
          size,
          retail_price: priceFromMargin(item.base_cost, marginPercent),
          design_url: design.url,
          design_name: design.name,
        });
      }
    }
  }
  return variants;
}

export function buildPrintfulSyncProducts(design, variants) {
  // Group variants per catalog product into one sync product each.
  const groups = new Map();
  for (const v of variants) {
    if (!groups.has(v.catalog_product_id)) {
      groups.set(v.catalog_product_id, { product: v, variants: [] });
    }
    groups.get(v.catalog_product_id).variants.push(v);
  }
  return [...groups.values()].map(({ product, variants: vs }) => ({
    sync_product: {
      name: `${design.name} — ${product.product_name}`,
      thumbnail: design.url,
    },
    sync_variants: vs.map((v) => ({
      retail_price: v.retail_price.toFixed(2),
      variant_id: hashVariantId(v),
      files: [{ type: "default", url: v.design_url }],
      options: [{ id: "color", value: v.color }, { id: "size", value: v.size }],
    })),
  }));
}

function hashVariantId(v) {
  // Deterministic pseudo-id for testing without Printful catalog lookups.
  const s = `${v.catalog_product_id}-${v.color}-${v.size}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function publishToPrintful(syncProduct, opts = {}) {
  const apiKey = opts.apiKey ?? process.env.PRINTFUL_API_KEY;
  const fetchImpl = opts.fetch ?? fetch;
  if (!apiKey) throw new Error("Missing PRINTFUL_API_KEY");
  const res = await fetchImpl("https://api.printful.com/store/products", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(syncProduct),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printful error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function registerDesign(design, presetId, opts = {}) {
  const margin = opts.marginPercent ?? 40;
  const variants = expandPreset(design, presetId, margin);
  const syncProducts = buildPrintfulSyncProducts(design, variants);
  const results = [];
  for (const sp of syncProducts) {
    if (opts.dryRun) {
      results.push({ ok: true, dryRun: true, product: sp.sync_product.name });
    } else {
      try {
        const r = await publishToPrintful(sp, opts);
        results.push({ ok: true, product: sp.sync_product.name, response: r });
      } catch (err) {
        results.push({ ok: false, product: sp.sync_product.name, error: err.message });
      }
    }
  }
  return { variants: variants.length, syncProducts: syncProducts.length, results };
}
