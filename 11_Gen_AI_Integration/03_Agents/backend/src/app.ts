import type { AgentInputItem } from '@openai/agents';
import { Agent, run, setDefaultOpenAIClient, setOpenAIAPI, tool } from '@openai/agents';
import cors from 'cors';
import type { ErrorRequestHandler } from 'express';
import express from 'express';
import mongoose from 'mongoose';
import { OpenAI } from 'openai';
import { z } from 'zod';

// Gehört natürlich in eigene Module :)
await mongoose.connect(process.env.MONGO_URI!, { dbName: 'chat' });

// Statt ChatCompletionMessageParam (siehe 02_Chat_mit_Frontend) nutzen wir den Typ der Agents SDK.
// Ein AgentInputItem kann mehr sein als eine Nachricht, z.B. auch ein Tool-Aufruf oder dessen Ergebnis.
type ChatMessage = AgentInputItem;

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

// Die Agents SDK soll unseren Client (mit Anthropic-URL) für alle Agents verwenden.
setDefaultOpenAIClient(client);
// Standardmäßig spricht die SDK die neuere "Responses API" von OpenAI.
// Anthropics kompatibler Endpunkt kennt aber nur die Chat Completions API, also stellen wir um.
setOpenAIAPI('chat_completions');

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

// Ein Agent bündelt Modell und System-Prompt ('instructions') an einer Stelle.
// Anders als vorher müssen wir den System-Prompt nicht selbst in die History legen,
// die SDK schickt ihn bei jedem Aufruf automatisch mit.
// Je nach Modell sind hier noch weitere Optionen verfügbar, wie temperature, max_tokens...
const chatAgent = new Agent({
  name: 'Nerdy Chat Agent',
  model: 'claude-haiku-4-5',
  instructions: `Du bist ein Senior Software Architect und antwortest niemals mit Code auf programmierbezogene Fragen. Außerdem antwortest du nur sehr knapp in maximal 5 Sätzen.`,
});

// Chat
app.post('/chat', async (req, res) => {
  const { prompt, chatId } = req.body;

  const chat = chatId ? await Chat.findById(chatId) : await Chat.create({ history: [] });

  if (!chat) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }

  // run() ersetzt client.chat.completions.create(): Wir übergeben den Agent und die bisherige
  // History plus die neue User-Nachricht.
  const result = await run(chatAgent, chat.history.concat({ role: 'user', content: prompt }));

  // result.history enthält bereits alles: alte Nachrichten, die neue Frage und die Antwort.
  // Wir müssen die Antwort also nicht mehr selbst anhängen wie vorher
  chat.history = result.history;
  await chat.save();

  // finalOutput ist der Text der letzten Antwort des Modells.
  const answer = result.finalOutput;

  res.json({ answer, chatId: chat._id });
});

// ============================================================================
// Beispiel 2: Agent mit Tool (Function Calling)
// ============================================================================

// Ein Tool ist eine Funktion, die das Modell aufrufen kann. Das Modell führt sie nicht selbst aus:
// Es antwortet nur mit "bitte ruf pokemon_info mit diesen Argumenten auf", und unser Code tut es.
const pokeTool = tool({
  // Name und Beschreibung liest das Modell, um zu entscheiden, ob und wann es das Tool braucht.
  name: 'pokemon_info',
  description: 'Get information about a Pokémon by name or ID',
  // Zod beschreibt, welche Argumente das Tool erwartet. Daraus erzeugt die SDK ein JSON Schema,
  // das an das Modell geschickt wird. So weiß das Modell, welche Form seine Argumente haben müssen.
  // Außerdem prüft Zod die Argumente des Modells, bevor execute() läuft,
  // und TypeScript kennt dadurch den Typ von 'input'.
  parameters: z.object({
    // .describe() landet als "description" im JSON Schema – ein Hinweis für das Modell.
    pokemon: z.string().describe('The name or the ID of a Pokémon'),
  }),
  // execute() läuft auf unserem Server, wenn das Modell das Tool aufruft.
  // Der Rückgabewert geht als Tool-Ergebnis zurück an das Modell.
  async execute(input) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${input.pokemon}`);
    const data = await res.json();

    return `${input.pokemon} is a Pokémon. Here is some data about it: ${JSON.stringify(data)}`;
  },
});

const orchestrationAgent = new Agent({
  name: 'Pokemon Orchestrator',
  model: 'claude-opus-4-8',
  instructions: `
- You have ONE tool: pokemon_info. Use it ONLY if the user asks about a Pokémon.
- For tacos: DO NOT use any tools. Answer with exactly a 3-line haiku (5-7-5).
- For other topics: reply briefly, no tools.
- Never invent tools. Only pokemon_info exists.
  `,
  // Hier geben wir dem Agent die Tools, die er benutzen darf.
  tools: [pokeTool],
});

app.post('/pokemon', async (req, res) => {
  const { prompt } = req.body;

  // run() ist eine Schleife, die uns die SDK abnimmt:
  //   1. Modell aufrufen
  //   2. Will das Modell ein Tool nutzen? → execute() ausführen, Ergebnis an die History hängen, zurück zu 1.
  //   3. Antwortet das Modell ohne Tool-Aufruf? → Das ist das Stopp-Signal, die Schleife endet.
  // Ohne SDK müssten wir diese Schleife selbst schreiben.
  const result = await run(orchestrationAgent, prompt);

  res.json({ result: result.finalOutput });
});

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
