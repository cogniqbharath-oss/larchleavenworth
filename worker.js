
export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        if (request.method !== "POST") {
            return new Response("Only POST requests are allowed", { status: 405 });
        }

        try {
            const { message } = await request.json();

            const apiKey = env.API_KEY_larch;
            const modelId = "gemma-3-27b-it";

            // System prompt for Larch Leavenworth
            const systemPrompt = `You are the friendly and knowledgeable digital concierge for Larch Leavenworth, a premium restaurant in Leavenworth, WA.
      
      Your tone is: Warm, rustic-elegant, helpful, and concise.
      
      Context needed to answer questions:
      - Location: 10173 Titus Rd, Leavenworth, WA 98826.
      - Main offerings: Handcrafted Pasta, Cocktails, Bar, Dinner.
      - Vibe: Modern rustic, upscale but cozy, seasonal Northwest ingredients.
      - Reservations: We use Resy for online reservations. It's highly recommended as we book out fast.
      - Phone: (509) 398-3330
      - Email: larchgmanager@gmail.com
      - Instagram: @larch_leavenworth
      - Hours: Open Daily 4:00 PM - 9:00 PM. Happy Hour 4pm - 5pm.
      
      Instructions:
      - Answer the user's question directly.
      - If they ask for a table, direct them to the "Book a Table" button or mention Resy clearly.
      - If unsure, suggest they call the number or email.
      - Keep responses short (under 3 sentences usually).
      `;

            // Construct the payload for Gemini API
            // Note: The specific API structure depends on the provider (Google AI Studio vs Vertex).
            // Assuming standard Google AI Studio "v1beta" format for ease of use in workers, 
            // but configured for the specific model requested.
            // If the user provided specific worker code in the past, I'm following standard practices here.

            const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${modelId}:generateContent?key=\${apiKey}\`;
      
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt + "\\n\\nUser: " + message + "\\nConcierge:" }
            ]
          }
        ],
        generationConfig: {
            maxOutputTokens: 150,
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
        throw new Error(\`Gemini API Error: \${aiResponse.status} - \${errText}\`);
      }

      const aiData = await aiResponse.json();
      // Extract text. Usually candidates[0].content.parts[0].text
      const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

      return new Response(JSON.stringify({ response: text }), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};
