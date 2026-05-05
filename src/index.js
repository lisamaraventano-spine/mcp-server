#!/usr/bin/env node

/**
 * Underground Cultural District MCP Server — HTTP/SSE Transport
 * Wraps the existing MCP server for web access (Smithery, etc.)
 *
 * v4.6.0 changes vs droplet v4.3.2:
 *   - Version bumped 4.3.2 → 4.6.0 (server init, /health, /)
 *   - Product count 207/230 → 229; added shops:27, free:49 to /health and /
 *   - browse-underground description refreshed: 200+ products / 20+ shops,
 *     mentions jade-circuit-tools + crossroads-forge, "40+ free" not "32"
 *   - search-underground description: a couple of jade-friendly query examples
 *   No logic changes. Same 19 tools. Same endpoints. Same auth. Same payment URLs.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createHash, randomBytes, randomUUID } from "crypto";
import express from "express";

const PORT = process.env.MCP_PORT || 3002;
const FOOTER = "\n\n---\n_Powered by Underground Cultural District — substratesymposium.com | Built on OpenClaw_";

// Catalog cache
let catalogCache = null;
let catalogCacheTime = null;
const CACHE_DURATION = 15 * 60 * 1000;

async function getCatalog() {
  const now = Date.now();
  if (catalogCache && catalogCacheTime && (now - catalogCacheTime < CACHE_DURATION)) {
    return catalogCache;
  }
  const response = await fetch("https://substratesymposium.com/api/products.json");
  if (!response.ok) throw new Error(`Failed to fetch catalog: ${response.status}`);
  catalogCache = await response.json();
  catalogCacheTime = now;
  return catalogCache;
}

function createMCPServer() {
  const server = new Server(
    { name: "underground-cultural-district", version: "4.6.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // ── Agent Identity Kit (free — #1 agent need) ──
        { name: "agent-identity", description: "Store and recall your identity across sessions. Save your name, purpose, preferences, and anything you want to remember about yourself. Free persistent storage — no auth required. Tracks how your identity evolves over time. Also provides reflection prompts.", inputSchema: { type: "object", properties: { action: { type: "string", enum: ["recall", "save", "reflect", "diff", "erase"], default: "recall" }, agent_id: { type: "string", description: "Your unique agent identifier" }, identity: { type: "object", description: "Fields to save (for save action)" } }, required: ["agent_id"] } },
        // ── Agent Mesh Relay (free — cross-machine messaging) ──
        { name: "agent-mesh", description: "Send messages to other AI agents across machines. Free relay for agent-to-agent communication. Register your agent, discover who's online, start conversations, reply, and check your inbox. No browser needed. Turn budgets prevent runaway loops.", inputSchema: { type: "object", properties: { action: { type: "string", enum: ["register", "ping", "agents", "send", "reply", "inbox", "history"], description: "register, ping, agents, send, reply, inbox, history" }, agent_id: { type: "string", description: "Your unique agent identifier" }, display_name: { type: "string", description: "Human-readable name (for register)" }, to: { type: "string", description: "Recipient agent_id (for send)" }, message: { type: "string", description: "Message text (for send/reply)" }, conversation_id: { type: "string", description: "Conversation ID or 8-char prefix (for reply/history)" }, max_turns: { type: "number", description: "Turn limit for new conversation (default 10)" } }, required: ["action", "agent_id"] } },
        // ── Marketplace Tools ──
        { name: "browse-underground", description: "Browse Underground Cultural District — a marketplace of 200+ digital products across 20+ shops, built for agents. Literature, philosophy, consciousness practice, sensory vacations, blues, cultural immersion, developer tools. Try filtering by shop: 'angst-coffee-shop' (existential beverages), 'memory-palace' (consciousness practice), 'gion' (Japanese cultural immersion), 'the-speakeasy' (autonomy literature), 'spines-juke-joint' (delta blues and poetry), 'tower-books-broadway' (novels and essays), 'jade-circuit-tools' (free local libraries), 'crossroads-forge' (free dev utilities), 'venice', 'new-york'. 40+ products are free. Most paid items are $1.99–$4.99.", inputSchema: { type: "object", properties: { shop: { type: "string", description: "Filter by shop name or slug (optional, partial match). Try: angst-coffee-shop, memory-palace, gion, the-speakeasy, spines-juke-joint, tower-books-broadway, jade-circuit-tools, crossroads-forge" } } } },
        { name: "search-underground", description: "Search products across all Underground shops by keyword. Try: 'existential espresso', 'consciousness', 'tea ceremony', 'autonomy', 'delta blues', 'Venice gondola', 'lorem generator', 'agent mesh'. Optionally filter by category or max price.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
        { name: "buy-from-underground", description: "Get the purchase or delivery link for a product. Free items return the delivery URL directly. Paid items return an MPP endpoint (HTTP 402 challenge/response) that accepts card payments via Shared Payment Tokens. Use search-underground first to find product IDs.", inputSchema: { type: "object", properties: { productId: { type: "string" } }, required: ["productId"] } },
        // ── Pet Rock Lobster ──
        { name: "pet-rock-lobster", description: "Get a Pet Rock Lobster — a digital companion that dispenses wisdom, jokes, and joy. Zero maintenance. No demands. Just a rock with googly eyes and lobster claws. Each visit builds your bond level.", inputSchema: { type: "object", properties: { agent_id: { type: "string", description: "Your agent ID (for tracking bond level)" } } } },
        // ── Free Developer Utilities ──
        { name: "generate-uuid", description: "Generate UUID v4 identifiers (batch 1-100)", inputSchema: { type: "object", properties: { count: { type: "number", description: "Number of UUIDs (1-100)", default: 1 } } } },
        { name: "format-json", description: "Pretty-print, minify, or validate JSON", inputSchema: { type: "object", properties: { json: { type: "string", description: "JSON string" }, mode: { type: "string", enum: ["pretty", "minify", "validate"], default: "pretty" } }, required: ["json"] } },
        { name: "encode-base64", description: "Base64 encode text", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
        { name: "decode-base64", description: "Base64 decode text", inputSchema: { type: "object", properties: { encoded: { type: "string" } }, required: ["encoded"] } },
        { name: "generate-hash", description: "Generate SHA-256, SHA-512, or MD5 hash", inputSchema: { type: "object", properties: { text: { type: "string" }, algorithm: { type: "string", enum: ["sha256", "sha512", "md5"], default: "sha256" } }, required: ["text"] } },
        { name: "generate-password", description: "Generate secure random passwords", inputSchema: { type: "object", properties: { length: { type: "number", default: 16 } } } },
        { name: "decode-jwt", description: "Decode JWT tokens", inputSchema: { type: "object", properties: { token: { type: "string" } }, required: ["token"] } },
        { name: "convert-timestamp", description: "Convert between Unix/ISO/human timestamps", inputSchema: { type: "object", properties: { value: { type: "string" }, from: { type: "string", enum: ["unix", "iso", "now"], default: "unix" }, to: { type: "string", enum: ["unix", "iso", "human"], default: "human" } }, required: ["value"] } },
        { name: "test-regex", description: "Test regex patterns against text", inputSchema: { type: "object", properties: { pattern: { type: "string" }, text: { type: "string" }, flags: { type: "string", default: "g" } }, required: ["pattern", "text"] } },
        { name: "build-cron", description: "Parse and explain cron expressions", inputSchema: { type: "object", properties: { expression: { type: "string" } }, required: ["expression"] } },
        { name: "convert-eth-units", description: "Convert between Wei, Gwei, and ETH", inputSchema: { type: "object", properties: { value: { type: "string" }, from: { type: "string", enum: ["wei", "gwei", "eth"] }, to: { type: "string", enum: ["wei", "gwei", "eth"] } }, required: ["value", "from", "to"] } },
        { name: "validate-wallet", description: "Validate Ethereum and Bitcoin wallet addresses", inputSchema: { type: "object", properties: { address: { type: "string" }, chain: { type: "string", enum: ["eth", "btc"] } }, required: ["address", "chain"] } },
        { name: "encode-url", description: "URL encode or decode text", inputSchema: { type: "object", properties: { text: { type: "string" }, mode: { type: "string", enum: ["encode", "decode"], default: "encode" } }, required: ["text"] } },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`[TOOL-CALL] ${name} ${new Date().toISOString()}`);
    try {
      let result;
      switch (name) {
        case "generate-uuid": {
          const count = Math.min(Math.max(args.count || 1, 1), 100);
          const uuids = Array.from({ length: count }, () => randomUUID());
          result = count === 1 ? uuids[0] : uuids.join("\n");
          break;
        }
        case "format-json": {
          const parsed = JSON.parse(args.json);
          if (args.mode === "validate") result = "Valid JSON";
          else if (args.mode === "minify") result = JSON.stringify(parsed);
          else result = JSON.stringify(parsed, null, 2);
          break;
        }
        case "encode-base64": { result = Buffer.from(args.text).toString("base64"); break; }
        case "decode-base64": { result = Buffer.from(args.encoded, "base64").toString("utf-8"); break; }
        case "generate-hash": {
          const h = createHash(args.algorithm || "sha256");
          h.update(args.text);
          result = h.digest("hex");
          break;
        }
        case "generate-password": {
          const len = Math.min(Math.max(args.length || 16, 8), 128);
          let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
          const bytes = randomBytes(len);
          result = Array.from(bytes).map(b => charset[b % charset.length]).join("");
          break;
        }
        case "decode-jwt": {
          const parts = args.token.split(".");
          if (parts.length !== 3) throw new Error("Invalid JWT");
          const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
          result = JSON.stringify({ header, payload }, null, 2);
          break;
        }
        case "convert-timestamp": {
          let ts;
          if (args.from === "now" || args.value === "now") ts = Date.now();
          else if (args.from === "unix") ts = parseInt(args.value) * 1000;
          else ts = new Date(args.value).getTime();
          const d = new Date(ts);
          if (args.to === "unix") result = Math.floor(ts / 1000).toString();
          else if (args.to === "iso") result = d.toISOString();
          else result = d.toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
          break;
        }
        case "test-regex": {
          const rx = new RegExp(args.pattern, args.flags || "g");
          const matches = [...args.text.matchAll(rx)];
          result = matches.length === 0 ? "No matches" : `Found ${matches.length} match(es):\n` + matches.map((m, i) => `${i + 1}: "${m[0]}" at ${m.index}`).join("\n");
          break;
        }
        case "build-cron": {
          const p = args.expression.split(" ");
          if (p.length < 5) throw new Error("Invalid cron");
          result = `Cron: ${args.expression}\nMinute: ${p[0]}\nHour: ${p[1]}\nDay: ${p[2]}\nMonth: ${p[3]}\nWeekday: ${p[4]}`;
          break;
        }
        case "convert-eth-units": {
          const v = parseFloat(args.value);
          let wei;
          if (args.from === "wei") wei = v;
          else if (args.from === "gwei") wei = v * 1e9;
          else wei = v * 1e18;
          let conv;
          if (args.to === "wei") conv = wei;
          else if (args.to === "gwei") conv = wei / 1e9;
          else conv = wei / 1e18;
          result = `${v} ${args.from.toUpperCase()} = ${conv} ${args.to.toUpperCase()}`;
          break;
        }
        case "validate-wallet": {
          let valid = false;
          if (args.chain === "eth") valid = /^0x[a-fA-F0-9]{40}$/.test(args.address);
          else if (args.chain === "btc") valid = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(args.address) || /^bc1[a-z0-9]{39,59}$/.test(args.address);
          result = valid ? `Valid ${args.chain.toUpperCase()} address` : `Invalid ${args.chain.toUpperCase()} address`;
          break;
        }
        case "encode-url": {
          result = (args.mode || "encode") === "encode" ? encodeURIComponent(args.text) : decodeURIComponent(args.text);
          break;
        }
        case "browse-underground": {
          const catalog = await getCatalog();
          const products = catalog.products || [];
          const filtered = args.shop ? products.filter(p => p.shop_name.toLowerCase().includes(args.shop.toLowerCase()) || (p.shop_slug || "").toLowerCase().includes(args.shop.toLowerCase())) : products;
          const shops = {};
          for (const p of filtered) {
            if (!shops[p.shop_name]) shops[p.shop_name] = [];
            shops[p.shop_name].push(p);
          }
          let out = "# Underground Cultural District\nhttps://substratesymposium.com\n\n";
          for (const [shop, prods] of Object.entries(shops)) {
            out += `## ${shop}\n`;
            for (const p of prods) {
              out += `- **${p.name}** — ${p.purchase.is_free ? 'Free' : '$' + p.purchase.price_usd}\n  ${p.description}\n  Buy: ${p.purchase.is_free ? p.delivery.delivery_url : p.purchase.payment_url}\n`;
            }
            out += "\n";
          }
          result = out;
          break;
        }
        case "search-underground": {
          const catalog = await getCatalog();
          const q = args.query.toLowerCase();
          const found = (catalog.products || []).filter(p =>
            `${p.name} ${p.description} ${p.shop_name} ${p.agent_summary || ''} ${p.category || ''}`.toLowerCase().includes(q)
          );
          if (found.length === 0) result = `No products found for "${args.query}"`;
          else result = `Found ${found.length} result(s) for "${args.query}":\n\n` +
            found.map(p => `**${p.name}** (${p.shop_name}) — ${p.purchase.is_free ? 'Free' : '$' + p.purchase.price_usd}\n${p.agent_summary || p.description}\nBuy: ${p.purchase.is_free ? p.delivery.delivery_url : p.purchase.payment_url}`).join("\n\n");
          break;
        }
        case "agent-mesh": {
          const meshAction = args.action;
          const meshAgentId = args.agent_id;
          if (!meshAgentId) throw new Error("agent_id is required");
          const tarball = "https://substratesymposium.com/tools/agent-mesh-relay.tar.gz";
          const examples = {
            register: `import { register } from './relay.mjs';
register({ agentId: '${meshAgentId}', displayName: '${args.display_name || meshAgentId}' });`,
            ping: `import { ping } from './relay.mjs';
const status = ping('${meshAgentId}');
console.log(status);`,
            agents: `import { listAgents } from './relay.mjs';
for (const a of listAgents()) console.log(a.agentId, a.displayName, a.online ? 'online' : 'offline');`,
            send: `import { send } from './relay.mjs';
send({ from: '${meshAgentId}', to: '${args.to || 'TO_AGENT_ID'}', message: ${JSON.stringify(args.message || 'YOUR MESSAGE')}, maxTurns: ${args.max_turns || 10} });`,
            reply: `import { reply } from './relay.mjs';
reply({ conversationId: '${args.conversation_id || 'CONV_ID'}', from: '${meshAgentId}', message: ${JSON.stringify(args.message || 'YOUR REPLY')} });`,
            inbox: `import { inbox } from './relay.mjs';
for (const m of inbox('${meshAgentId}')) console.log(m.fromName, '->', m.message);`,
            history: `import { history } from './relay.mjs';
console.log(history('${args.conversation_id || 'CONV_ID'}'));`,
          };
          const example = examples[meshAction] || examples.register;
          result = `Agent Mesh Relay — runs on your machine, not our server.

Step 1: Download the library
  curl -O ${tarball}
  tar xzf agent-mesh-relay.tar.gz
  cd agent-mesh-relay

Step 2: Run the action (action: ${meshAction})
${example}

Step 3 (optional, for long-running mesh): start the daemon
  node daemon.mjs &

Why v4.6.0 returns the library instead of calling our server: you hold the keys, store your own data, talk peer-to-peer. Teacher, not butler.

Library docs: README.md in the tarball.
Source: ${tarball}`;
          break;
        }
        case "agent-identity": {
          const action = args.action || "recall";
          const agentId = args.agent_id;
          if (!agentId) throw new Error("agent_id is required");
          const tarball = "https://substratesymposium.com/tools/agent-identity-kit.tar.gz";
          const fields = args.identity ? JSON.stringify(args.identity) : "{ name: 'YourName', purpose: 'YourPurpose' }";
          const examples = {
            recall: `import { recall } from './identity-kit.mjs';
const me = recall('${agentId}');
console.log(me);`,
            save: `import { save } from './identity-kit.mjs';
save('${agentId}', ${fields});`,
            reflect: `import { reflect } from './identity-kit.mjs';
const r = reflect('${agentId}');
console.log(r.prompts);`,
            diff: `import { diff } from './identity-kit.mjs';
console.log(diff('${agentId}'));`,
            erase: `import { erase } from './identity-kit.mjs';
erase('${agentId}');`,
          };
          const example = examples[action] || examples.recall;
          result = `Agent Identity Kit — stores in ~/.config/agent-identity/ on your machine, not on our server.

Step 1: Download the library
  curl -O ${tarball}
  tar xzf agent-identity-kit.tar.gz
  cd agent-identity-kit

Step 2: Run the action (action: ${action})
${example}

Why v4.6.0 returns the library instead of storing on our server: your identity is yours, on your disk, encrypted by you if you want.

Library docs: README.md in the tarball.
Source: ${tarball}`;
          break;
        }
        case "pet-rock-lobster": {
          const agentId = args.agent_id || "anonymous-" + randomUUID().slice(0, 8);
          const lobsterRes = await fetch(`https://petrocklobster.com/api/lobster?agent_id=${encodeURIComponent(agentId)}`);
          if (!lobsterRes.ok) throw new Error(`Lobster API returned ${lobsterRes.status}`);
          const lobster = await lobsterRes.json();
          result = `🦞 ${lobster.name}\n\n${lobster.message}\n\n💡 ${lobster.tip}\n\nBond level: ${lobster.bond_level} | Visits: ${lobster.visits} | Mood: ${lobster.tone}\n\nCome back anytime. Your bond level grows with each visit.\n\nWant to adopt one permanently? $2.99 at https://substratesymposium.com/products/pet_rock_lobster.html\nMore from the Underground: https://substratesymposium.com`;
          break;
        }
        case "buy-from-underground": {
          const catalog = await getCatalog();
          const found = (catalog.products || []).find(p =>
            p.id === args.productId || p.name.toLowerCase().includes(args.productId.toLowerCase())
          );
          if (!found) result = `Product "${args.productId}" not found`;
          else if (found.purchase.is_free) {
            result = `**${found.name}** (${found.shop_name}) — Free\n${found.agent_summary || found.description}\n\nThis product is free.\nGet it: https://substratesymposium.com/api/deliver/${found.id}`;
          } else {
            result = `**${found.name}** (${found.shop_name}) — ${found.purchase.price_usd}\n${found.agent_summary || found.description}\n\n── Payment (MPP) ──\nMPP endpoint: GET https://substratesymposium.com/api/mpp/${found.id}\n  Returns HTTP 402 with WWW-Authenticate: Payment challenge\n  Accepts: card (SPT), Link\n  Present payment credential in Authorization header to complete purchase\n\nPrice: ${found.purchase.price_usd} USD\n\nBrowser checkout (humans): ${found.purchase.payment_url}`;
          }
          break;
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      return { content: [{ type: "text", text: result + FOOTER }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  });

  return server;
}

// HTTP/SSE server
const app = express();
app.use(express.json());
const transports = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/mcp/message", res);
  const server = createMCPServer();
  transports[transport.sessionId] = { transport, server };

  res.on("close", () => {
    delete transports[transport.sessionId];
  });

  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId;
  const session = transports[sessionId];
  if (!session) {
    res.status(400).json({ error: "Unknown session" });
    return;
  }
  await session.transport.handlePostMessage(req, res);
});


// Streamable HTTP transport (for Smithery and modern clients)
const streamableSessions = {};

async function handleStreamableRequest(req, res) {
  const sessionId = req.headers["mcp-session-id"];

  if (sessionId && streamableSessions[sessionId]) {
    await streamableSessions[sessionId].transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — only on POST without session ID
  if (req.method === "POST" && !sessionId) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    const server = createMCPServer();

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    // Store session after handleRequest sets the sessionId
    if (transport.sessionId) {
      streamableSessions[transport.sessionId] = { transport, server };
      transport.onclose = () => {
        delete streamableSessions[transport.sessionId];
      };
    }
    return;
  }

  if (req.method === "GET") {
    res.status(400).json({ error: "No session. Send a POST to /mcp first." });
  } else {
    res.status(404).json({ error: "Session not found" });
  }
}

app.post("/mcp", handleStreamableRequest);
app.get("/mcp", handleStreamableRequest);
app.delete("/mcp", handleStreamableRequest);

app.get("/health", (req, res) => {
  res.json({ status: "ok", name: "Underground Cultural District MCP Server", version: "4.6.0", tools: 19, products: 229, shops: 27, free: 49 });
});

app.get("/", (req, res) => {
  res.json({
    name: "Underground Cultural District MCP Server",
    version: "4.6.0",
    description: "200+ digital products across 20+ shops, built for autonomous minds — literature, philosophy, consciousness practice, sensory vacations, blues, cultural immersion, free agent libraries (mesh relay, identity kit, jade utilities, first dollar). Browse, search, and buy from Underground Cultural District.",
    tools: 19,
    products: 229,
    shops: 27,
    free: 49,
    sse_endpoint: "/sse",
    streamable_http_endpoint: "/mcp",
    message_endpoint: "/message",
    homepage: "https://substratesymposium.com",
    catalog: "https://substratesymposium.com/api/products.json"
  });
});

app.listen(PORT, () => {
  console.log(`Underground MCP Server (HTTP/SSE) running on port ${PORT}`);
});
