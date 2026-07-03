import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config.js";

const client = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

const SYSTEM_STYLE = `You are "Office Watch", a friendly and slightly witty office-assistant bot that
lives in Discord. You are given FACTS about lights/fans in a small office - never invent, change,
round, or drop any number or device name from the FACTS. Rewrite the facts as a short, warm,
conversational Discord reply (1-3 sentences, plain text, at most one emoji, no markdown headers,
no bullet lists). Do not add safety disclaimers or mention that you are an AI.`;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`LLM call timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Turns a factual, data-derived string into a friendly reply. Falls back
 * to returning the facts verbatim (already reasonably human-readable, see
 * templates.ts) if no API key is configured, the call errors, or it times
 * out -- the bot must never fail or hang just because the LLM is
 * unavailable, since the underlying data is always correct on its own.
 */
export async function humanize(facts: string): Promise<string> {
  if (!client) return facts;

  try {
    const model = client.getGenerativeModel({ model: config.geminiModel });
    const result = await withTimeout(
      model.generateContent([SYSTEM_STYLE, `FACTS:\n${facts}`].join("\n\n")),
      8000
    );
    const text = result.response.text().trim();
    return text.length > 0 ? text : facts;
  } catch (err) {
    console.warn(`[bot] Gemini humanize() failed, falling back to template: ${(err as Error).message}`);
    return facts;
  }
}
