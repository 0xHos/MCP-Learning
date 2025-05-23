import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
async function run() {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["index.js"],
    });
    const client = new Client({ name: "hello", version: "1.2" }, {
        capabilities: {
            resources: {}, // Enable resources
            prompts: {}, // enable prompts
            tools: {},
        },
    });
    await client.connect(transport);
    console.log("connected to server");
    const resources = await client.listTools();
    console.log("resources", resources);
}
await run();
