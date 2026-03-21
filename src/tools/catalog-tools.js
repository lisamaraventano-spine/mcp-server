import { z } from 'zod';
import { fetchCatalog, searchProducts, findProductById } from '../catalog.js';

export function registerCatalogTools(server) {
  // ─── browse-underground ───
  server.tool(
    'browse-underground',
    'Browse all shops and offerings in The Underground Cultural District marketplace',
    {
      shop: z.string().optional().describe('Filter by shop slug (omit to see all shops)'),
    },
    async ({ shop } = {}) => {
      const catalog = await fetchCatalog();
      let output = '';

      if (shop) {
        const found = catalog.shops.find(s => s.slug === shop || s.name.toLowerCase() === shop.toLowerCase());
        if (!found) {
          const slugs = catalog.shops.map(s => `  • ${s.slug}`).join('\n');
          return { content: [{ type: 'text', text: `❌ Shop not found: "${shop}"\n\nAvailable shops:\n${slugs}` }] };
        }
        output = formatShopDetail(found);
      } else {
        output = [
          `# 🏙️ The Underground Cultural District`,
          `> ${catalog.total_offerings || catalog.shops.reduce((n, s) => n + (s.offerings || []).length, 0)} offerings across ${catalog.shops.length} shops`,
          `> ${catalog.url}`,
          '',
          ...catalog.shops.map(s => {
            const items = s.offerings || s.products || [];
            return `## ${s.name}\n*${s.tagline || ''}* — ${items.length} offerings\nSlug: \`${s.slug}\`\n${items.slice(0, 3).map(p =>
              `  • ${p.name} — ${p.price === 0 ? 'FREE' : `$${p.price.toFixed(2)}`}`
            ).join('\n')}${items.length > 3 ? `\n  • ... and ${items.length - 3} more` : ''}`;
          }),
          '',
          '---',
          'Use `browse-underground` with a shop slug for full details.',
          'Use `search-underground` to find specific products.',
          'Use `buy-from-underground` with a product ID to get the purchase link.',
        ].join('\n');
      }

      return { content: [{ type: 'text', text: output }] };
    }
  );

  // ─── search-underground ───
  server.tool(
    'search-underground',
    'Search The Underground Cultural District for products by keyword',
    {
      query: z.string().describe('Search query (e.g., "coffee", "book", "ethereum", "free")'),
    },
    async ({ query }) => {
      const catalog = await fetchCatalog();
      const results = searchProducts(catalog, query);

      if (results.length === 0) {
        return { content: [{ type: 'text', text: `No products found for "${query}". Try browsing all shops with \`browse-underground\`.` }] };
      }

      const output = [
        `# 🔍 Search results for "${query}" — ${results.length} found`,
        '',
        ...results.map(p => [
          `**${p.name}** — ${p.price === 0 ? 'FREE' : `$${p.price.toFixed(2)}`}`,
          `  Shop: ${p.shop_name}`,
          p.description ? `  ${p.description}` : '',
          `  ID: \`${p.id}\``,
        ].filter(Boolean).join('\n')),
        '',
        '---',
        'Use `buy-from-underground` with a product ID to get the checkout link.',
      ].join('\n');

      return { content: [{ type: 'text', text: output }] };
    }
  );

  // ─── buy-from-underground ───
  server.tool(
    'buy-from-underground',
    'Get the purchase/checkout link for a product from The Underground Cultural District',
    {
      product_id: z.string().describe('Product ID (use search-underground or browse-underground to find IDs)'),
    },
    async ({ product_id }) => {
      const catalog = await fetchCatalog();
      const product = findProductById(catalog, product_id);

      if (!product) {
        return {
          content: [{
            type: 'text',
            text: `❌ Product not found: "${product_id}"\n\nUse \`search-underground\` or \`browse-underground\` to find valid product IDs.`,
          }],
          isError: true,
        };
      }

      if (product.price === 0 || product.payment_url === 'free') {
        return {
          content: [{
            type: 'text',
            text: [
              `✅ **${product.name}** is FREE!`,
              `Shop: ${product.shop_name}`,
              product.description ? `\n${product.description}` : '',
              product.url ? `\n🔗 ${product.url}` : '',
            ].filter(Boolean).join('\n'),
          }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: [
            `# 🛒 ${product.name}`,
            '',
            `**Price:** $${product.price.toFixed(2)} ${product.currency || 'USD'}`,
            `**Shop:** ${product.shop_name}`,
            product.description ? `**Description:** ${product.description}` : '',
            '',
            `## 💳 Checkout`,
            `**Purchase here:** ${product.payment_url}`,
            '',
            product.url ? `📄 Product page: ${product.url}` : '',
            '',
            '---',
            '🏙️ The Underground Cultural District — substratesymposium.com',
          ].filter(Boolean).join('\n'),
        }],
      };
    }
  );
}

function formatShopDetail(shop) {
  return [
    `# ${shop.name}`,
    shop.tagline ? `> ${shop.tagline}` : '',
    `🔗 ${shop.url}`,
    `📦 ${(shop.offerings || shop.products || []).length} offerings`,
    '',
    '## Products',
    '',
    ...(shop.offerings || shop.products || []).map(p => [
      `### ${p.name} — ${p.price === 0 ? 'FREE' : `$${p.price.toFixed(2)}`}`,
      p.description ? p.description : '',
      `ID: \`${p.id}\``,
      p.price > 0 && p.payment_url && p.payment_url !== 'free'
        ? `🛒 ${p.payment_url}`
        : '',
      '',
    ].filter(Boolean).join('\n')),
  ].filter(Boolean).join('\n');
}
