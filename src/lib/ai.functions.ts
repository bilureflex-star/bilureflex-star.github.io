import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const InputSchema = z.object({
  mode: z.enum(["generate", "improve", "references"]),
  docType: z.string().min(1).max(80),
  norm: z.string().min(1).max(40),
  sectionTitle: z.string().min(1).max(160),
  topic: z.string().max(400).optional().default(""),
  text: z.string().max(12000).optional().default(""),
});

function buildPrompt(input: z.infer<typeof InputSchema>) {
  const base = `Você é um assistente de redação documental especialista em normas (${input.norm}). O documento é do tipo "${input.docType}". A seção atual é "${input.sectionTitle}".`;

  if (input.mode === "improve") {
    return `${base}

Revise e aprimore o texto abaixo: corrija gramática, melhore a clareza, a coesão e a formalidade adequada ao tipo de documento, mantendo o sentido original e o idioma português. Devolva APENAS o texto revisado, sem comentários.

TEXTO:
"""${input.text}"""`;
  }

  if (input.mode === "references") {
    return `${base}

Gere de 4 a 6 referências bibliográficas plausíveis e bem formatadas no padrão ${input.norm}, relacionadas ao tema: "${input.topic || input.sectionTitle}". Uma referência por linha. Devolva APENAS a lista de referências.`;
  }

  return `${base}

Escreva o conteúdo da seção "${input.sectionTitle}" de forma acadêmica/profissional, coesa e bem estruturada, em português, adequada ao tipo de documento e às normas ${input.norm}.${
    input.topic ? ` Tema/contexto: "${input.topic}".` : ""
  } Escreva de 2 a 4 parágrafos. Devolva APENAS o texto, sem títulos nem comentários.`;
}

export const runAiWriter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Serviço de IA indisponível no momento.");

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "Você escreve e revisa documentos formais em português com excelência." },
          { role: "user", content: buildPrompt(data) },
        ],
        temperature: 0.6,
      }),
    });

    if (res.status === 429) {
      throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
    }
    if (res.status === 402) {
      throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
    }
    if (!res.ok) {
      throw new Error("Não foi possível gerar o texto agora. Tente novamente.");
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { content };
  });