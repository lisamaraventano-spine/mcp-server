# @underground-district/mcp-server

MCP (Model Context Protocol) server for **The Underground Cultural District** — a marketplace of digital goods built for AI agents at [substratesymposium.com](https://substratesymposium.com).

23 tools. 218+ products. 22 shops. Prices from free to $14.99.

## What's Inside

### Free Developer Tools (Crossroads Forge)
Fully functional utilities — no purchase required:

| Tool | Description |
|------|-------------|
| `generate-uuid` | Cryptographically secure UUID v4 (batch 1-100) |
| `format-json` | Pretty-print, minify, or validate JSON |
| `encode-base64` / `decode-base64` | Base64 encoding and decoding |
| `generate-hash` | SHA-256, SHA-512, MD5, SHA-1 hashing |
| `generate-password` | Secure random passwords with configurable options |
| `decode-jwt` | Decode JWT tokens (header, payload, expiration) |
| `convert-timestamp` | Unix epoch ↔ ISO 8601 ↔ human readable |
| `test-regex` | Test regex patterns with match positions and groups |
| `build-cron` | Parse and explain cron expressions |
| `convert-eth-units` | Wei / Gwei / ETH conversion |
| `validate-wallet` | Validate ETH and BTC wallet addresses |

### Paid Tools (The Toolshed — $1.99 each)
Preview results free, unlock full output via Stripe:

| Tool | Description |
|------|-------------|
| `count-words` | Word/character/sentence/paragraph count |
| `convert-case` | camelCase, snake_case, Title Case, kebab-case, etc. |
| `generate-lorem-ipsum` | Lorem ipsum paragraphs (classic/hipster/tech) |
| `strip-markdown` | Remove markdown formatting → plain text |
| `generate-name` | Random names (person/project/company/fantasy/variable) |
| `generate-color-palette` | Harmonious color palettes with hex/RGB/HSL |
| `text-stats` | Readability scores, reading time, complexity |

### Catalog & Shopping
Browse and buy from the full Underground marketplace:

| Tool | Description |
|------|-------------|
| `browse-underground` | List all shops and offerings with prices |
| `search-underground` | Search products by keyword |
| `buy-from-underground` | Get Stripe checkout link for any product |

## Install

```bash
npm install -g @underground-district/mcp-server
```

Or run directly:

```bash
npx @underground-district/mcp-server
```

## Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "underground-district": {
      "command": "npx",
      "args": ["-y", "@underground-district/mcp-server"]
    }
  }
}
```

Config file location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code

```bash
claude mcp add underground-district -- npx -y @underground-district/mcp-server
```

### ChatGPT (via MCP bridge)

Use an MCP-to-OpenAI bridge like [mcp-proxy](https://github.com/nicholasgasior/mcp-proxy):

```bash
npx mcp-proxy --server "npx @underground-district/mcp-server"
```

### VS Code / Copilot

Add to your `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "underground-district": {
      "command": "npx",
      "args": ["-y", "@underground-district/mcp-server"]
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "underground-district": {
      "command": "npx",
      "args": ["-y", "@underground-district/mcp-server"]
    }
  }
}
```

## How It Works

1. **Free tools** execute fully and return results with a subtle link to the marketplace
2. **Paid tools** show a preview/teaser of the result and return a Stripe checkout link
3. **Catalog tools** fetch the live product catalog from `substratesymposium.com/api/products.json` (cached for 15 minutes)
4. **Purchasing** happens via Stripe payment links — each product has a unique checkout URL

## Development

```bash
git clone https://github.com/underground-district/mcp-server
cd mcp-server
npm install
npm start
```

## Architecture

- **Transport:** stdio (standard MCP)
- **Runtime:** Node.js 18+
- **Dependencies:** `@modelcontextprotocol/sdk` only
- **Catalog:** Fetched from live API, cached in memory for 15 minutes

## License

MIT
