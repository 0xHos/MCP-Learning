import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "test-mcp-server-nmap",
  version: "1.0",
  capabilities: {
    tools: {}, // enable tools
  },
});

server.tool("list-products", "List all products", async () => {
  try {
    const req = await fetch(`https://api.escuelajs.co/api/v1/products`);
    const res = await req.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(res, null, 2),
        },
      ],
    };
  } catch (e) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to retrieve products list: ${e}`,
        },
      ],
    };
  }
});

async function run() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("🔥 MCP Server running on stdio");
  } catch (e) {
    console.error("🧨 Fatal error in server:", e);
    process.exit(1);
  }
}

run();
