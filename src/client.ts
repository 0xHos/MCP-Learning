import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { callGeminiLLM, initTool } from "./llm";
import * as readline from "readline";

async function run() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"],
  });

  const client = new Client(
    { name: "mcp-client", version: "1.0" },
    {
      capabilities: {
        resources: {},
        prompts: {},
        tools: {},
      },
    }
  );

  await client.connect(transport);
  console.log("🔗 Connected to MCP server");

  // Get available tools
  const tools = await client.listTools();
  console.log(
    "📋 Available tools:",
    tools.tools?.map((t) => t.name).join(", ")
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n💬 Type your prompt or 'exit' to quit.");
  console.log("Example: 'Show me the list of products'\n");

  for await (const line of rl) {
    const userPrompt = line.trim();

    if (userPrompt.toLowerCase() === "exit") {
      console.log("👋 Bye!");
      rl.close();
      process.exit(0);
    }

    if (!userPrompt) continue;

    try {
      // Create system prompt with available tools
      const systemPrompt = `You are an AI assistant that can answer questions and call tools to get information.

Available tools:
${tools.tools?.map((tool) => `- ${tool.name}: ${tool.description}`).join("\n")}

When you need to use a tool, respond with exactly this format:
CALL_TOOL: tool_name

If you don't need to call a tool, just answer the question directly.

User question: ${userPrompt}`;

      console.log("🤔 Thinking...");
      const llmResponse = await callGeminiLLM(systemPrompt);

      // Check if LLM wants to call a tool
      if (llmResponse.includes("CALL_TOOL:")) {
        const toolName = llmResponse.split("CALL_TOOL:")[1]?.trim();

        if (toolName && tools.tools?.some((t) => t.name === toolName)) {
          console.log(`🔧 Calling tool: ${toolName}`);

          // Call the tool
          const toolResult = await client.callTool({
            name: toolName,
            arguments: {},
          });

          // Format and display the result
          console.log("📊 Tool Result:");
          if (toolResult.content) {
            toolResult.content.forEach((content) => {
              if (content.type === "text") {
                try {
                  // Try to parse and format JSON nicely
                  const parsed = JSON.parse(content.text);
                  if (Array.isArray(parsed)) {
                    console.log(`Found ${parsed.length} items:`);
                    parsed.slice(0, 3).forEach((item, index) => {
                      console.log(
                        `\n${index + 1}. ${item.title || item.name || "Item"}`
                      );
                      if (item.price) console.log(`   Price: $${item.price}`);
                      if (item.description)
                        console.log(
                          `   Description: ${item.description.substring(
                            0,
                            100
                          )}...`
                        );
                    });
                    if (parsed.length > 3) {
                      console.log(`\n... and ${parsed.length - 3} more items`);
                    }
                  } else {
                    console.log(JSON.stringify(parsed, null, 2));
                  }
                } catch {
                  console.log(content.text);
                }
              }
            });
          }

          // Get LLM to summarize the results
          const summaryPrompt = `Based on this tool result, provide a helpful summary for the user.
User asked: ${userPrompt}
Tool result: ${JSON.stringify(toolResult.content)}

Provide a natural, helpful response:`;

          const summary = await callGeminiLLM(summaryPrompt);
          console.log("\n🤖 Summary:", summary);
        } else {
          console.log(`❌ Tool '${toolName}' not found`);
        }
      } else {
        // LLM provided direct answer
        console.log("🤖 Response:", llmResponse);
      }
    } catch (error) {
      console.error("❌ Error:", error);
    }

    console.log("\n" + "=".repeat(50));
    console.log("💬 Enter your next prompt:");
  }
}

await run();
