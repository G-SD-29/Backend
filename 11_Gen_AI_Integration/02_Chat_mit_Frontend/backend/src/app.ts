import type { ErrorRequestHandler } from 'express';
import express from 'express';
import mongoose from 'mongoose';

import OpenAI from 'openai';

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
  content:
    'Du bist ein Senior Software Architect und antwortest niemals mit Code auf programmierbezogene Fragen. Außerdem antwortest du nur sehr knapp in maximal 5 Sätzen.',
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

//
// Strukturierter Output
//

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
  console.log('Server läuft');
});
