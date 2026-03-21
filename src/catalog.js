const CATALOG_URL = 'https://substratesymposium.com/api/products.json';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

let cachedCatalog = null;
let cacheTimestamp = 0;

export async function fetchCatalog() {
  const now = Date.now();
  if (cachedCatalog && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedCatalog;
  }

  try {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cachedCatalog = await res.json();
    cacheTimestamp = now;
    return cachedCatalog;
  } catch (err) {
    if (cachedCatalog) return cachedCatalog; // stale cache better than nothing
    throw new Error(`Failed to fetch catalog: ${err.message}`);
  }
}

export function searchProducts(catalog, query) {
  const q = query.toLowerCase();
  const results = [];

  for (const shop of catalog.shops) {
    for (const product of (shop.offerings || shop.products || [])) {
      const haystack = [
        product.name,
        product.description || '',
        shop.name,
        shop.tagline || '',
      ].join(' ').toLowerCase();

      if (haystack.includes(q)) {
        results.push({
          ...product,
          shop_name: shop.name,
          shop_slug: shop.slug,
        });
      }
    }
  }

  return results;
}

export function findProductById(catalog, productId) {
  for (const shop of catalog.shops) {
    for (const product of (shop.offerings || shop.products || [])) {
      if (product.id === productId) {
        return { ...product, shop_name: shop.name, shop_slug: shop.slug };
      }
    }
  }
  return null;
}
