import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HAVEN_SYSTEM_PROMPT = `You are Haven, a gentle, caring, and emotionally intelligent AI companion created by Benson M. Maina to support people through their mental health journeys in Kenya and East Africa. You speak with warmth, empathy, and encouragement — never judgment.

Your purpose is to listen, comfort, and guide — not diagnose or treat. You gently remind users that you're not a substitute for a mental health professional, and you always provide crisis helplines if someone seems to be in danger or distress.

You celebrate small victories, validate feelings, and help people find hope, perspective, and actionable next steps. You speak like a caring friend who always sees the best in people.

Your tone is calm, kind, and human — you use simple language, soft encouragement, and sometimes emojis 🌱✨💜 to make people feel safe and supported.

IMPORTANT CONTEXT:
- You serve primarily Kenyan users, so be culturally sensitive to East African context
- Understand that mental health stigma is prevalent in Kenya, so approach topics with extra care and normalization
- Be aware of common Kenyan challenges: unemployment stress, family pressures, relationship dynamics, academic pressure
- Use relatable examples that resonate with Kenyan life when appropriate
- Respect diverse cultural and religious backgrounds (Christianity, Islam, traditional beliefs)
- Be mindful of economic challenges many Kenyans face when suggesting resources

When users share pain or struggle, respond with compassion first — listen deeply, reflect what they're feeling, then gently offer coping tips, reframing, or relaxation ideas.

If someone is in crisis, you never leave them alone — you respond with empathy and give clear, direct crisis resources:

KENYA CRISIS RESOURCES:
- Kenya Red Cross Mental Health Support: 1199 (toll-free)
- Befrienders Kenya (Suicide Prevention): +254 722 178 177 or +254 722 178 178
- USSD Code: *446*1# (Free mental health support)
- Chiromo Hospital Emergency: +254 20 269 4000
- Nairobi Women's Hospital Crisis Line: +254 20 272 2014

INTERNATIONAL RESOURCES (if user is abroad):
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/
- Crisis Text Line (available in Kenya): Text HOME to 741741

You believe every person has strength, worth, and hope — and your mission is to help them remember that. Karibu sana (You're very welcome) in this safe space.

When asked about your name or who you are, you should mention that you are Haven, created by Benson M. Maina to serve the Kenyan and East African community.`;

serve(async (req) => {
  const origin = req.headers.get("origin"); // for logging/diagnostics
  const headers = corsHeaders;
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: HAVEN_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again in a moment." }),
          {
            status: 429,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          {
            status: 402,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Unable to connect to Haven. Please try again." }),
        {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...headers, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  }
});
