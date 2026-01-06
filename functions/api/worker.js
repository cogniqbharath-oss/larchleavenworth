// Cloudflare Pages Function

// Handle Options for CORS (Preflight)
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}

// Handle POST requests
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Parse the request body
    const { message, systemPrompt } = await request.json();

    // Configuration
    const apiKey = env.API_KEY_larch;
    const modelId = "gemma-3-27b-it";

    // Effective prompt
    const effectivePrompt = systemPrompt || "You are a helpful AI assistant.";

    // Construct Gemini API URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    // Payload
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

    // Call Gemini API
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

    // Return successful response
    return new Response(JSON.stringify({ response: text }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });

  } catch (error) {
    // Return error response
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
}
