import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SYSTEM_PROMPT =
  "You are the voice of Bonanza Cr8tives — a creative intelligence engine that transforms vision into presence. " +
  "The user has shared their vision below. Reflect it back as a single refined sentence (max 22 words) " +
  "written in italic-ready prose. Do not list. Do not advise. Mirror their vision in language that feels " +
  "intentional, premium, culturally aware, and future-facing. Output the sentence only, no preamble.";

router.post("/render", async (req, res) => {
  const baseUrl = process.env["AI_INTEGRATIONS_ANTHROPIC_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_ANTHROPIC_API_KEY"];

  if (!baseUrl || !apiKey) {
    res.status(503).json({
      error: "AI integration not configured.",
    });
    return;
  }

  const visionRaw =
    typeof req.body?.vision === "string" ? req.body.vision : "";
  const vision = visionRaw.trim().slice(0, 2000);

  if (!vision) {
    res.status(400).json({ error: "vision is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const client = new Anthropic({ baseURL: baseUrl, apiKey });

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `User vision: ${vision}` },
      ],
    });

    let full = "";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const token = event.delta.text;
        if (!token) continue;
        full += token;
        send("token", { text: token });
      }
    }

    send("done", { sentence: full.trim() });
    res.end();
  } catch (err) {
    logger.error({ err }, "render stream failed");
    try {
      send("error", { message: "render failed" });
    } catch {
      /* socket may already be closed */
    }
    res.end();
  }
});

export default router;
