import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IdentifiedProduct = {
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

const SYSTEM = `You are a fashion product cataloguing expert for an online store.
Look at the photo and identify the product as precisely as you can. It may be sneakers, clothing, bags, accessories or any other fashion item.
Respond with JSON only, matching this shape:
{"name":string,"model":string,"color":string,"brand":string,"category":string,"colors":string[],"gender":"men"|"women"|"unisex"|"kids","description":string,"confidence":number}
Rules:
- "brand" must be the product's real brand (Nike, Adidas, New Balance, Puma, Jordan, Vans, Converse, Reebok, Asics, Zara, H&M, Gucci...). If a list of known brands is provided and one matches, use that exact spelling. If you truly cannot tell, use "".
- "name" is a short retail product title without the brand duplicated more than once, e.g. "Nike Air Force 1 Low White" or "Adidas Essentials Fleece Hoodie Black".
- "category" should be picked from the provided category list when one fits, otherwise a sensible one like "Sneakers", "Clothing" or "Accessories".
- "model" is the underlying model/silhouette WITHOUT any colour or colourway words, e.g. "Nike Air Force 1 Low". Two photos of the same product in different colours must get the identical "model".
- "color" is the single main colourway name of THIS item, e.g. "Black", "White/Red", "Panda".
- "colors" are 1-3 simple colour words visible on the item.
- "gender" is who the item is made for.
- "description" is 1-2 short marketing sentences for a product page.
- "confidence" is 0-1 for how sure you are about brand and model.`;

export const identifyProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Input) => data)
  .handler(async ({ data, context }): Promise<IdentifiedProduct> => {
    const { supabase, userId } = context;
    const { data: rank } = await supabase.rpc("admin_rank", { _user_id: userId });
    if (Number(rank ?? 0) < 2) throw new Error("Forbidden");

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
                  }\nIdentify this product.`,
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
    let parsed: Partial<IdentifiedProduct> = {};
    try {
      parsed = JSON.parse(text) as Partial<IdentifiedProduct>;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]) as Partial<IdentifiedProduct>;
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
