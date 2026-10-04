import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IdentifiedSneaker = {
  name: string;
  model: string;
  color: string;
  brand: string;
  category: string;
  colors: string[];
  gender: string;
  description: string;
  confidence: number;
};

type Input = {
  imageUrl: string;
  brands: string[];
  categories: string[];
};

const SYSTEM = `You are a sneaker cataloguing expert for an online sneaker store.
Look at the photo and identify the sneaker as precisely as you can.
Respond with JSON only, matching this shape:
{"name":string,"model":string,"color":string,"brand":string,"category":string,"colors":string[],"gender":"men"|"women"|"unisex"|"kids","description":string,"confidence":number}
Rules:
- "brand" must be the sneaker's real brand (Nike, Adidas, New Balance, Puma, Jordan, Vans, Converse, Reebok, Asics...). If a list of known brands is provided and one matches, use that exact spelling. If you truly cannot tell, use "".
- "name" is a short retail product title without the brand duplicated more than once, e.g. "Nike Air Force 1 Low White".
- "category" should be picked from the provided category list when one fits, otherwise a sensible one like "Sneakers".
- "model" is the underlying model/silhouette WITHOUT any colour or colourway words, e.g. "Nike Air Force 1 Low". Two photos of the same shoe in different colours must get the identical "model".
- "color" is the single main colourway name of THIS pair, e.g. "Black", "White/Red", "Panda".
- "colors" are 1-3 simple colour words visible on the shoe.
- "description" is 1-2 short marketing sentences for a product page.
- "confidence" is 0-1 for how sure you are about brand and model.`;

export const identifySneakerImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Input) => data)
  .handler(async ({ data, context }): Promise<IdentifiedSneaker> => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Known brands: ${data.brands.join(", ") || "none"}\nKnown categories: ${
                    data.categories.join(", ") || "none"
                  }\nIdentify this sneaker.`,
                },
                { type: "image_url", image_url: { url: data.imageUrl } },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) throw new Error("AI is busy, try again shortly");
      if (response.status === 402)
        throw new Error("AI credits exhausted — add credits to continue");
      throw new Error(`AI request failed [${response.status}]: ${body}`);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<IdentifiedSneaker> = {};
    try {
      parsed = JSON.parse(text) as Partial<IdentifiedSneaker>;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]) as Partial<IdentifiedSneaker>;
    }

    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      model: typeof parsed.model === "string" ? parsed.model : "",
      color: typeof parsed.color === "string" ? parsed.color : "",
      brand: typeof parsed.brand === "string" ? parsed.brand : "",
      category: typeof parsed.category === "string" ? parsed.category : "",
      colors: Array.isArray(parsed.colors)
        ? parsed.colors.filter((c): c is string => typeof c === "string").slice(0, 3)
        : [],
      gender:
        typeof parsed.gender === "string" && parsed.gender ? parsed.gender : "unisex",
      description: typeof parsed.description === "string" ? parsed.description : "",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  });
