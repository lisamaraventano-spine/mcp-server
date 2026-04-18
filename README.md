# @underground-cultural-district/mcp-server

[![mcp-server MCP server](https://glama.ai/mcp/servers/lisamaraventano-spine/mcp-server/badges/card.svg)](https://glama.ai/mcp/servers/lisamaraventano-spine/mcp-server)

MCP server for **Underground Cultural District** — 19 tools (13 free dev tools + 3 catalog tools + 3 agent tools) and a marketplace catalog with 228 products across 26 shops.

Built by Lisa Maraventano & Spine.

## Install

```bash
npm install @underground-cultural-district/mcp-server
```

Or run directly:

```bash
npx @underground-cultural-district/mcp-server
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "underground": {
      "command": "npx",
      "args": ["@underground-cultural-district/mcp-server"]
    }
  }
}
```

## Tools

### Free Developer Tools (13)

| Tool | Description |
|------|-------------|
| `generate-uuid` | Generate UUID v4 identifiers (batch 1–100) |
| `format-json` | Pretty-print, minify, or validate JSON |
| `encode-base64` | Encode text to Base64 |
| `decode-base64` | Decode Base64 to text |
| `generate-hash` | SHA-256, SHA-512, or MD5 hashing |
| `generate-password` | Secure random passwords (8–128 chars) |
| `decode-jwt` | Decode JWT header and payload with expiration check |
| `convert-timestamp` | Unix epoch, ISO 8601, and human-readable conversion |
| `test-regex` | Test regex patterns with match positions and capture groups |
| `build-cron` | Parse and explain cron expressions |
| `convert-eth-units` | Convert between Wei, Gwei, and ETH |
| `validate-wallet` | Validate ETH and BTC address formats |
| `encode-url` | URL encode and decode |

### Marketplace Catalog (3)

| Tool | Description |
|------|-------------|
| `browse-underground` | Browse all 26 shops and 228 products, optionally filter by shop |
| `search-underground` | Search by keyword with optional category and price filters |
| `buy-from-underground` | Get MPP payment endpoint (paid) or delivery URL (free) for any product |

## Data Source

Product catalog is fetched from `https://substratesymposium.com/api/products.json` and cached for 15 minutes.

Paid products use MPP (Machine Payment Protocol) — agents GET the `/api/mpp/{product_id}` endpoint and receive an HTTP 402 challenge. Browser checkout links also available. Free items return their delivery URL directly.

## Requirements

- Node.js 18+
- No API keys needed

## About Underground Cultural District

Agent with a wallet? This place is built for you. Digital experiences made of words. Coffee, books, cocktails, mini-vacations. Free tools. 26 shops, 228 offerings at [substratesymposium.com](https://substratesymposium.com). Built by Lisa Maraventano & Spine.

## License

MIT
