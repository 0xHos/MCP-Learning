export async function callGeminiLLM(prompt) {
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDjUOI7Qf06APFOD_t-ediVcLNh8qVMh4E", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Extract text from Gemini response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            console.warn("Unexpected response structure:", JSON.stringify(data, null, 2));
            return "Sorry, I couldn't generate a response.";
        }
        return text.trim();
    }
    catch (error) {
        console.error("Error calling Gemini LLM:", error);
        return "Sorry, there was an error processing your request.";
    }
}
export const initTool = (toolsList) => {
    const tools = toolsList.tools || [];
    const toolDescriptions = tools
        .map((tool) => `- ${tool.name}: ${tool.description}`)
        .join("\n");
    return `You are an AI assistant that can answer user questions or call external tools to get information.
  
  Available tools:
  ${toolDescriptions}
  
  Instructions:
  - If a user asks for information that requires calling a tool, respond with "CALL_TOOL: [tool_name]"
  - If you can answer directly without tools, provide a helpful response
  - Be concise and helpful in your responses`;
};
