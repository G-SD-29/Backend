import type { ErrorRequestHandler } from 'express';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import OpenAI from 'openai';
import z from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod.js';

// Mongoose und Chat-Schema
await mongoose.connect(process.env.MONGO_URI!, { dbName: 'ai-chat' });
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
interface ChatDocument {
  history: ChatMessage[];
}

const chatSchema = new mongoose.Schema<ChatDocument>({
  history: {
    type: [Object],
    default: [],
  },
});
const Chat = mongoose.model('Chat', chatSchema);

// KI-Client

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com/v1/',
});

// Express

const app = express();
const port = process.env.PORT || 8080;

// CORS erlaubt dem Frontend (anderer Port = andere Origin), unsere API aufzurufen.
// Wichtig: Der Browser lässt JavaScript standardmäßig nur wenige "sichere" Response-Header lesen
// (z.B. Content-Type). Eigene Header wie 'X-Chat-Id' müssen wir explizit freigeben,
// sonst liefert res.headers.get('X-Chat-Id') im Frontend null.
app.use(cors({ exposedHeaders: ['X-Chat-Id'] }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ msg: 'Server is running' });
});

//
app.post('/messages', async (req, res) => {
  const { prompt } = req.body;

  const response = await client.chat.completions.create({
    model: 'claude-haiku-4-5',

    messages: [
      {
        role: 'system',
        content:
          'Du bist ein Senior Softwareentwickler. Wenn du Fragen zur Programmierung erhältst, antwortest du nie mit Code, sondern mit Überlegungen bezüglich der Architektur.',
      },
      { role: 'user', content: prompt },
    ],
  });

  res.json({ prompt, response });
});

const systemPrompt: ChatMessage = {
  role: 'system',
  content: '',
  // 'Du bist ein Senior Software Architect und antwortest niemals mit Code auf programmierbezogene Fragen. Außerdem antwortest du nur sehr knapp in maximal 5 Sätzen.',
};

// Chat
app.post('/chat', async (req, res) => {
  const { prompt, chatId } = req.body;

  const chat = chatId ? await Chat.findById(chatId) : await Chat.create({ history: [systemPrompt] });

  if (!chat) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }

  const userMessage: ChatMessage = { role: 'user', content: prompt };

  const response = await client.chat.completions.create({
    model: 'claude-opus-4-8',
    messages: [...chat.history, userMessage],
  });

  const answer = response.choices[0]?.message;

  if (!answer) {
    res.status(502).json({ error: 'No answer from model' });
    return;
  }

  chat.history = [...chat.history, userMessage, answer];
  await chat.save();

  res.json({ prompt, answer, chatId: chat._id });
});
//
// Streaming
//
app.post('/chat/streaming', async (req, res) => {
  const { prompt, chatId } = req.body;

  const chat = chatId ? await Chat.findById(chatId) : await Chat.create({ history: [systemPrompt] });

  if (!chat) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }

  const userMessage: ChatMessage = { role: 'user', content: prompt };

  // Mit 'stream: true' wartet die KI nicht, bis die ganze Antwort fertig ist.
  // Statt eines fertigen Objekts bekommen wir einen Stream zurück, aus dem nach und nach
  // kleine Stücke ("Chunks") der Antwort kommen – meist nur ein paar Wörter oder Silben.
  const response = await client.chat.completions.create({
    model: 'claude-opus-4-8',
    messages: [...chat.history, userMessage],
    stream: true,
  });

  // Hier sammeln wir alle Chunks ein, damit wir am Ende die komplette Antwort
  // in der Datenbank speichern können.ß
  let answer = '';

  // Header müssen gesetzt werden, bevor das erste res.write() aufgerufen wird,
  // danach sind sie schon an den Client verschickt und nicht mehr änderbar.
  // Wir senden diesmal einfachen Text, kein JSON
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  // Die Chat-ID kann nicht im Body stehen (der ist ja die gestreamte Antwort),
  // deshalb schicken wir sie als eigenen Header mit. Siehe exposedHeaders bei cors() oben.
  res.setHeader('X-Chat-Id', chat._id.toString());

  // 'for await' liest den Stream Chunk für Chunk, sobald jeweils ein neues Stück ankommt.
  for await (const chunk of response) {
    // Im Streaming-Modus steht der neue Text in 'delta' (= "die Änderung seit dem letzten Chunk"),
    // nicht in 'message' wie bei der normalen Antwort.
    // Manche Chunks enthalten keinen Text (z.B. der allerletzte), die überspringen wir.
    const text = chunk.choices[0]?.delta.content;
    if (!text) continue;
    answer += text;
    // res.write() schickt das Stück sofort an den Client, ohne die Verbindung zu schließen.
    // Anders als res.json() kann man res.write() beliebig oft aufrufen.
    res.write(text);
  }

  // Erst jetzt, wo der Stream vorbei ist, kennen wir die ganze Antwort und speichern sie.
  chat.history = [...chat.history, userMessage, { role: 'assistant', content: answer }];
  await chat.save();

  // res.end() schließt die Verbindung. Für den Client ist das das Signal: "Antwort komplett".
  res.end();
});

//
// Strukturierter Output
//

const Recipe = z.object({
  title: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      estimated_cost_per_unit: z.number().describe('The estimated cost of one unit in EUR cents'),
    }),
  ),
  preparation_description: z.string(),
  time_in_minutes: z.number(),
});

app.post('/recipes', async (req, res) => {
  const { prompt } = req.body;

  const response = await client.chat.completions.parse({
    model: 'claude-haiku-4-5',
    messages: [
      { role: 'system', content: 'Du bist ein sehr kreativer Koch mit Vorliebe für Molekularküche' },
      { role: 'user', content: prompt },
    ],
    response_format: zodResponseFormat(Recipe, 'recipe'),
  });

  const recipe = response.choices[0]?.message.parsed;

  res.json({ recipe });
});

//
// Express
app.use('/{*splat}', () => {
  throw Error('Page not found', { cause: { status: 404 } });
});

app.use(((err, _req, res, _next) => {
  console.log(err);
  res.status(err.cause?.status || 500).json({ message: err.message });
}) satisfies ErrorRequestHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
