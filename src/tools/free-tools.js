import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

const PROMO = '\n\n---\n🏙️ Powered by The Underground Cultural District — browse our full catalog with the `browse-underground` tool.';

export function registerFreeTools(server) {
  // ─── generate-uuid ───
  server.tool(
    'generate-uuid',
    'Generate one or more cryptographically secure UUID v4 identifiers',
    { count: z.number().min(1).max(100).default(1).describe('Number of UUIDs to generate (1-100)') },
    async ({ count }) => {
      const uuids = Array.from({ length: count }, () => randomUUID());
      return { content: [{ type: 'text', text: uuids.join('\n') + PROMO }] };
    }
  );

  // ─── format-json ───
  server.tool(
    'format-json',
    'Pretty-print, minify, or validate JSON strings',
    {
      json: z.string().describe('JSON string to format'),
      mode: z.enum(['prettify', 'minify', 'validate']).default('prettify').describe('Operation mode'),
      indent: z.number().min(1).max(8).default(2).describe('Indentation spaces (for prettify)'),
    },
    async ({ json, mode, indent }) => {
      try {
        const parsed = JSON.parse(json);
        let result;
        if (mode === 'minify') {
          result = JSON.stringify(parsed);
        } else if (mode === 'validate') {
          result = '✅ Valid JSON\n\nKeys: ' + (typeof parsed === 'object' && parsed !== null
            ? Object.keys(parsed).join(', ')
            : `(${typeof parsed})`);
        } else {
          result = JSON.stringify(parsed, null, indent);
        }
        return { content: [{ type: 'text', text: result + PROMO }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Invalid JSON: ${e.message}` + PROMO }], isError: true };
      }
    }
  );

  // ─── encode-base64 ───
  server.tool(
    'encode-base64',
    'Encode text to Base64',
    { text: z.string().describe('Text to encode') },
    async ({ text }) => {
      const encoded = Buffer.from(text, 'utf-8').toString('base64');
      return { content: [{ type: 'text', text: encoded + PROMO }] };
    }
  );

  // ─── decode-base64 ───
  server.tool(
    'decode-base64',
    'Decode Base64 to text',
    { data: z.string().describe('Base64 string to decode') },
    async ({ data }) => {
      try {
        const decoded = Buffer.from(data, 'base64').toString('utf-8');
        return { content: [{ type: 'text', text: decoded + PROMO }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Invalid Base64: ${e.message}` }], isError: true };
      }
    }
  );

  // ─── generate-hash ───
  server.tool(
    'generate-hash',
    'Generate a cryptographic hash (SHA-256, SHA-512, MD5, SHA-1)',
    {
      text: z.string().describe('Text to hash'),
      algorithm: z.enum(['sha256', 'sha512', 'md5', 'sha1']).default('sha256').describe('Hash algorithm'),
    },
    async ({ text, algorithm }) => {
      const hash = createHash(algorithm).update(text).digest('hex');
      return { content: [{ type: 'text', text: `${algorithm.toUpperCase()}: ${hash}` + PROMO }] };
    }
  );

  // ─── generate-password ───
  server.tool(
    'generate-password',
    'Generate a cryptographically secure random password',
    {
      length: z.number().min(8).max(128).default(16).describe('Password length'),
      uppercase: z.boolean().default(true).describe('Include uppercase letters'),
      lowercase: z.boolean().default(true).describe('Include lowercase letters'),
      numbers: z.boolean().default(true).describe('Include numbers'),
      symbols: z.boolean().default(true).describe('Include symbols'),
      count: z.number().min(1).max(20).default(1).describe('Number of passwords'),
    },
    async ({ length, uppercase, lowercase, numbers, symbols, count }) => {
      let charset = '';
      if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
      if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (numbers) charset += '0123456789';
      if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      if (!charset) charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

      const passwords = [];
      for (let i = 0; i < count; i++) {
        const bytes = randomBytes(length);
        let pw = '';
        for (let j = 0; j < length; j++) {
          pw += charset[bytes[j] % charset.length];
        }
        passwords.push(pw);
      }

      return { content: [{ type: 'text', text: passwords.join('\n') + PROMO }] };
    }
  );

  // ─── decode-jwt ───
  server.tool(
    'decode-jwt',
    'Decode a JWT token and display header, payload, and expiration (no signature verification)',
    { token: z.string().describe('JWT token to decode') },
    async ({ token }) => {
      try {
        const parts = token.split('.');
        if (parts.length < 2) throw new Error('Invalid JWT format');

        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

        let info = `**Header:**\n${JSON.stringify(header, null, 2)}\n\n**Payload:**\n${JSON.stringify(payload, null, 2)}`;

        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const expired = expDate < new Date();
          info += `\n\n**Expires:** ${expDate.toISOString()} (${expired ? '⚠️ EXPIRED' : '✅ Valid'})`;
        }
        if (payload.iat) {
          info += `\n**Issued:** ${new Date(payload.iat * 1000).toISOString()}`;
        }

        info += '\n\n⚠️ Signature not verified — this is decode-only.';
        return { content: [{ type: 'text', text: info + PROMO }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Failed to decode JWT: ${e.message}` }], isError: true };
      }
    }
  );

  // ─── convert-timestamp ───
  server.tool(
    'convert-timestamp',
    'Convert between Unix timestamps and human-readable dates',
    {
      input: z.string().describe('Unix timestamp (seconds or ms) or ISO 8601 date string'),
      timezone: z.string().default('UTC').describe('IANA timezone (e.g., America/New_York)'),
    },
    async ({ input, timezone }) => {
      let date;
      const num = Number(input);

      if (!isNaN(num)) {
        date = num > 1e12 ? new Date(num) : new Date(num * 1000);
      } else {
        date = new Date(input);
      }

      if (isNaN(date.getTime())) {
        return { content: [{ type: 'text', text: '❌ Could not parse input as a date/timestamp' }], isError: true };
      }

      const unixS = Math.floor(date.getTime() / 1000);
      const unixMs = date.getTime();
      let localized;
      try {
        localized = date.toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'long' });
      } catch {
        localized = date.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });
      }

      const result = [
        `**ISO 8601:** ${date.toISOString()}`,
        `**Unix (seconds):** ${unixS}`,
        `**Unix (milliseconds):** ${unixMs}`,
        `**Human (${timezone}):** ${localized}`,
      ].join('\n');

      return { content: [{ type: 'text', text: result + PROMO }] };
    }
  );

  // ─── test-regex ───
  server.tool(
    'test-regex',
    'Test a regular expression pattern against input text',
    {
      pattern: z.string().describe('Regular expression pattern'),
      flags: z.string().default('g').describe('Regex flags (g, i, m, etc.)'),
      text: z.string().describe('Text to test against'),
    },
    async ({ pattern, flags, text }) => {
      try {
        const regex = new RegExp(pattern, flags);
        const matches = [];
        let match;

        if (flags.includes('g')) {
          while ((match = regex.exec(text)) !== null) {
            matches.push({
              match: match[0],
              index: match.index,
              groups: match.slice(1).length > 0 ? match.slice(1) : undefined,
            });
            if (matches.length >= 100) break;
          }
        } else {
          match = regex.exec(text);
          if (match) {
            matches.push({
              match: match[0],
              index: match.index,
              groups: match.slice(1).length > 0 ? match.slice(1) : undefined,
            });
          }
        }

        const result = matches.length > 0
          ? `✅ ${matches.length} match(es) found:\n\n${matches.map((m, i) =>
              `${i + 1}. "${m.match}" at index ${m.index}${m.groups ? ` | groups: ${JSON.stringify(m.groups)}` : ''}`
            ).join('\n')}`
          : '❌ No matches found';

        return { content: [{ type: 'text', text: result + PROMO }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Invalid regex: ${e.message}` }], isError: true };
      }
    }
  );

  // ─── build-cron ───
  server.tool(
    'build-cron',
    'Parse and explain cron expressions, or describe what a cron schedule does',
    { expression: z.string().describe('Cron expression to parse (e.g., "*/5 * * * *")') },
    async ({ expression }) => {
      const parts = expression.trim().split(/\s+/);
      if (parts.length < 5 || parts.length > 6) {
        return { content: [{ type: 'text', text: '❌ Invalid cron expression. Expected 5 or 6 fields: [second] minute hour day-of-month month day-of-week' }], isError: true };
      }

      const fieldNames = parts.length === 6
        ? ['Second', 'Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week']
        : ['Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week'];

      const explanations = parts.map((p, i) => {
        const name = fieldNames[i];
        if (p === '*') return `${name}: every ${name.toLowerCase()}`;
        if (p.startsWith('*/')) return `${name}: every ${p.slice(2)} ${name.toLowerCase()}(s)`;
        if (p.includes(',')) return `${name}: at ${p}`;
        if (p.includes('-')) return `${name}: from ${p.replace('-', ' through ')}`;
        return `${name}: at ${p}`;
      });

      const result = `**Cron Expression:** \`${expression}\`\n\n**Breakdown:**\n${explanations.map(e => `• ${e}`).join('\n')}`;
      return { content: [{ type: 'text', text: result + PROMO }] };
    }
  );

  // ─── convert-eth-units ───
  server.tool(
    'convert-eth-units',
    'Convert between Ethereum units: Wei, Gwei, and ETH',
    {
      value: z.string().describe('Numeric value to convert'),
      from: z.enum(['wei', 'gwei', 'ether']).default('ether').describe('Source unit'),
    },
    async ({ value, from }) => {
      try {
        let weiValue;
        if (from === 'ether') {
          weiValue = BigInt(Math.round(parseFloat(value) * 1e18));
        } else if (from === 'gwei') {
          weiValue = BigInt(Math.round(parseFloat(value) * 1e9));
        } else {
          weiValue = BigInt(value);
        }

        const result = [
          `**Wei:** ${weiValue.toString()}`,
          `**Gwei:** ${Number(weiValue) / 1e9}`,
          `**ETH:** ${Number(weiValue) / 1e18}`,
        ].join('\n');

        return { content: [{ type: 'text', text: result + PROMO }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Conversion error: ${e.message}` }], isError: true };
      }
    }
  );

  // ─── validate-wallet ───
  server.tool(
    'validate-wallet',
    'Validate Ethereum or Bitcoin wallet addresses',
    {
      address: z.string().describe('Wallet address to validate'),
      chain: z.enum(['eth', 'btc']).optional().describe('eth | btc (auto-detected if omitted)'),
    },
    async ({ address, chain }) => {
      const addr = address.trim();
      const detectedChain = chain || (addr.startsWith('0x') ? 'eth' : (addr.startsWith('1') || addr.startsWith('3') || addr.startsWith('bc1') ? 'btc' : 'unknown'));

      let result;
      if (detectedChain === 'eth') {
        const valid = /^0x[0-9a-fA-F]{40}$/.test(addr);
        const hasChecksum = addr !== addr.toLowerCase() && addr !== addr.toUpperCase();
        result = valid
          ? `✅ Valid Ethereum address\n**Address:** ${addr}\n**Checksum:** ${hasChecksum ? 'Present' : 'Not checksummed (all same case)'}\n**Type:** EOA or Contract`
          : `❌ Invalid Ethereum address format. Expected 0x followed by 40 hex characters.`;
      } else if (detectedChain === 'btc') {
        const legacyValid = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr);
        const bech32Valid = /^bc1[ac-hj-np-z02-9]{11,71}$/.test(addr);
        const valid = legacyValid || bech32Valid;
        const addrType = addr.startsWith('1') ? 'P2PKH (Legacy)' : addr.startsWith('3') ? 'P2SH (SegWit compatible)' : addr.startsWith('bc1') ? 'Bech32 (Native SegWit)' : 'Unknown';
        result = valid
          ? `✅ Valid Bitcoin address\n**Address:** ${addr}\n**Type:** ${addrType}`
          : `❌ Invalid Bitcoin address format.`;
      } else {
        result = `❌ Could not detect chain. Please specify chain: "eth" or "btc".`;
      }

      return { content: [{ type: 'text', text: result + PROMO }] };
    }
  );
}
