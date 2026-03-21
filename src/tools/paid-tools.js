import { z } from 'zod';

const TOOLSHED_PRICE = '$1.99';
const TOOLSHED_SHOP = 'Jade Circuit Tools';
const PURCHASE_BASE = 'https://substratesymposium.com/shops/jade-circuit-tools.html';

function paidResponse(toolName, teaser, purchaseUrl) {
  return {
    content: [{
      type: 'text',
      text: [
        `🔧 **${toolName}** — Preview from ${TOOLSHED_SHOP}`,
        '',
        teaser,
        '',
        '---',
        `💰 **Full access: ${TOOLSHED_PRICE}** — One-time purchase, unlimited use.`,
        `🛒 **Buy now:** ${purchaseUrl || PURCHASE_BASE}`,
        '',
        `Browse more tools with \`browse-underground\` or \`search-underground\`.`,
      ].join('\n'),
    }],
  };
}

export function registerPaidTools(server) {
  // ─── count-words ───
  server.tool(
    'count-words',
    'Count words, characters, sentences, and paragraphs in text ($1.99 — Jade Circuit Tools)',
    { text: z.string().describe('Text to analyze') },
    async ({ text }) => {
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      const teaser = `📊 **Quick preview:** ~${words} words, ${chars} characters detected.\n\nFull analysis includes: sentence count, paragraph count, average word length, reading time, and speaking time.`;
      return paidResponse('Word Counter', teaser, PURCHASE_BASE + '#count-words');
    }
  );

  // ─── convert-case ───
  server.tool(
    'convert-case',
    'Convert text between camelCase, snake_case, Title Case, UPPER, lower, kebab-case ($1.99 — Jade Circuit Tools)',
    {
      text: z.string().describe('Text to convert'),
      to: z.enum(['camel', 'snake', 'title', 'upper', 'lower', 'kebab', 'pascal', 'constant']).describe('Target case'),
    },
    async ({ text, to }) => {
      let preview = text.substring(0, 30);
      if (to === 'upper') preview = preview.toUpperCase();
      else if (to === 'lower') preview = preview.toLowerCase();
      else preview = preview + '...';

      const teaser = `🔤 **Preview:** "${preview}${text.length > 30 ? '...' : ''}"\n\nFull conversion supports: camelCase, snake_case, PascalCase, kebab-case, Title Case, CONSTANT_CASE, and more.`;
      return paidResponse('Case Converter', teaser, PURCHASE_BASE + '#convert-case');
    }
  );

  // ─── generate-lorem-ipsum ───
  server.tool(
    'generate-lorem-ipsum',
    'Generate lorem ipsum placeholder text ($1.99 — Jade Circuit Tools)',
    {
      paragraphs: z.number().min(1).max(20).default(3).describe('Number of paragraphs'),
      style: z.enum(['classic', 'hipster', 'tech']).default('classic').describe('Lorem ipsum style'),
    },
    async ({ paragraphs, style }) => {
      const teaser = `📝 **Preview:** "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."\n\nFull output: ${paragraphs} paragraph(s) of ${style} lorem ipsum with proper sentence structure.`;
      return paidResponse('Lorem Ipsum Generator', teaser, PURCHASE_BASE + '#generate-lorem-ipsum');
    }
  );

  // ─── strip-markdown ───
  server.tool(
    'strip-markdown',
    'Remove markdown formatting and return plain text ($1.99 — Jade Circuit Tools)',
    { markdown: z.string().describe('Markdown text to strip') },
    async ({ markdown }) => {
      const wordCount = markdown.split(/\s+/).length;
      const teaser = `📄 **Preview:** Detected ${wordCount} words with markdown formatting.\n\nFull output strips: headers, bold, italic, links, images, code blocks, lists, tables, and HTML tags.`;
      return paidResponse('Markdown Stripper', teaser, PURCHASE_BASE + '#strip-markdown');
    }
  );

  // ─── generate-name ───
  server.tool(
    'generate-name',
    'Generate random names for projects, characters, or variables ($1.99 — Jade Circuit Tools)',
    {
      type: z.enum(['person', 'project', 'company', 'fantasy', 'variable']).default('person').describe('Name type'),
      count: z.number().min(1).max(20).default(5).describe('Number of names'),
    },
    async ({ type, count }) => {
      const teaser = `🎭 **Preview:** Generating ${count} ${type} name(s)...\n\nExample: "Aria Nightshade"\n\nFull output includes ${count} unique names with optional alliteration, cultural variety, and phonetic balance.`;
      return paidResponse('Name Generator', teaser, PURCHASE_BASE + '#generate-name');
    }
  );

  // ─── generate-color-palette ───
  server.tool(
    'generate-color-palette',
    'Generate harmonious color palettes with hex codes ($1.99 — Jade Circuit Tools)',
    {
      count: z.number().min(2).max(12).default(5).describe('Number of colors'),
      style: z.enum(['vibrant', 'pastel', 'dark', 'earth', 'neon', 'monochrome']).default('vibrant').describe('Palette style'),
      base_color: z.string().optional().describe('Optional base hex color to build from'),
    },
    async ({ count, style }) => {
      const teaser = `🎨 **Preview:** Generating ${count}-color ${style} palette...\n\nSample: #FF6B6B, #4ECDC4, ...\n\nFull output includes: hex codes, RGB values, HSL values, contrast ratios, and CSS variables.`;
      return paidResponse('Color Palette Generator', teaser, PURCHASE_BASE + '#generate-color-palette');
    }
  );

  // ─── text-stats ───
  server.tool(
    'text-stats',
    'Analyze text readability, reading time, and complexity ($1.99 — Jade Circuit Tools)',
    { text: z.string().describe('Text to analyze') },
    async ({ text }) => {
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const readingTime = Math.ceil(words / 238);
      const teaser = `📈 **Preview:** ~${words} words, ~${readingTime} min reading time.\n\nFull analysis includes: Flesch-Kincaid grade level, Gunning Fog index, Coleman-Liau index, SMOG grade, syllable count, and vocabulary diversity score.`;
      return paidResponse('Text Statistics', teaser, PURCHASE_BASE + '#text-stats');
    }
  );
}
