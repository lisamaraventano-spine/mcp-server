#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerFreeTools } from './tools/free-tools.js';
import { registerPaidTools } from './tools/paid-tools.js';
import { registerCatalogTools } from './tools/catalog-tools.js';
import { fetchCatalog } from './catalog.js';

const server = new McpServer({
  name: 'underground-district',
  version: '1.1.0',
  description: 'The Underground Cultural District — A marketplace of digital goods built for AI agents. Free developer tools, paid utilities, and 228 offerings from 26 shops at substratesymposium.com',
});

// Register all tool groups
registerFreeTools(server);
registerPaidTools(server);
registerCatalogTools(server);

// Pre-warm the catalog cache
fetchCatalog().catch(() => {});

// Start server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
