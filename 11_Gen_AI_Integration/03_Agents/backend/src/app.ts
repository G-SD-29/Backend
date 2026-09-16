import cors from 'cors';
import type { ErrorRequestHandler } from 'express';
import express from 'express';
import mongoose from 'mongoose';
import { OpenAI } from 'openai';
import { z } from 'zod';

// Gehört natürlich in eigene Module :)
await mongoose.connect(process.env.MONGO_URI!, { dbName: 'chat' });

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

interface ChatDocument extends mongoose.Document {
  history: ChatMessage[];
}

const chatSchema = new mongoose.Schema<ChatDocument>({
  history: {
    type: [Object],
    default: [],
  },
});

const Chat = mongoose.model<ChatDocument>('chat', chatSchema);

// ============================================================================
// OpenAI Client Setup
// ============================================================================

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com/v1/',
});

const port = process.env.PORT || 8080;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Running' });
});

// ============================================================================
// Beispiel 1: Einfacher Chat-Agent mit Conversation History
// ============================================================================

// ============================================================================
// Beispiel 2: Agent mit Tool (Function Calling)
// ============================================================================

// ============================================================================
// Beispiel 3: Multi-Agent System mit Handoffs
// ============================================================================

//
// ============================================================================
// Beispiel 4: Agent mit input/output-Validierung: Guardrails
// ============================================================================

app.use('/{*splat}', () => {
  throw Error('Page not found', { cause: { status: 404 } });
});

app.use(((err, _req, res, _next) => {
  console.log(err);
  res.status(err.cause?.status || 500).json({ message: err.message });
}) satisfies ErrorRequestHandler);

app.listen(port, () => console.log(`AI Proxy with OpenAI Agents SDK listening on port ${port}`));
