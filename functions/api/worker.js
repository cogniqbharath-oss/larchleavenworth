export default {
  async fetch(request, env) {
    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Only POST requests are allowed", {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      const { message, systemPrompt } = await request.json();

      // Configuration
      const apiKey = env.API_KEY_larch;
      const modelId = "gemma-3-27b-it";

      // Default generic prompt if none provided
      const effectivePrompt = systemPrompt || "You are a helpful AI assistant.";

      // Construct the payload for Gemini API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: effectivePrompt + "\n\nUser: " + message + "\nAssistant:" }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.7
        }
      };

      const aiResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`Gemini API Error: ${aiResponse.status} - ${errText}`);
      }

      const aiData = await aiResponse.json();
      const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

      return new Response(JSON.stringify({ response: text }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
};
