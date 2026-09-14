import express from 'express';
import mongoose from 'mongoose';

// Das OpenAI-SDK hat sich als Quasi-Standard etabliert: Viele Anbieter (Anthropic, Google, ...)
// bieten eine OpenAI-kompatible Schnittstelle an. So können wir mit demselben Code verschiedene Modelle nutzen.
import OpenAI from 'openai';

await mongoose.connect(process.env.MONGO_URI!, { dbName: 'ai-chat' });

// Der Client kapselt die HTTP-Aufrufe an die KI-API.
// Um den Provider zu wechseln, tauschen wir nur API-Key und baseURL aus.
// Der API-Key gehört in die .env
const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com/v1/',
  // apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  // baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ msg: 'Server is running' });
});

// einzelne Messages
// Jede Anfrage ist unabhängig: Das Modell "erinnert" sich nicht an frühere Requests.
app.post('/messages', async (req, res) => {
  const { prompt } = req.body;
  console.log(prompt);

  // Chat Completion: Wir schicken eine Liste von Nachrichten, das Modell ergänzt die nächste Antwort.
  const response = await client.chat.completions.create({
    // Welches Modell antworten soll (bestimmt Qualität, Geschwindigkeit und Kosten)
    model: 'claude-haiku-4-5',
    // Das messages-Array ist das Gespräch. Jede Nachricht hat eine role und einen content:
    // - system:    Anweisungen an das Modell (Rolle, Stil, Regeln) – steht ganz am Anfang
    // - user:      Nachrichten des Menschen
    // - assistant: frühere Antworten des Modells
    messages: [
      {
        role: 'system',
        content:
          'Du bist ein Senior Softwareentwickler. Wenn du Fragen zur Programmierung erhältst, antwortest du nie mit Code, sondern mit Überlegungen bezüglich der Architektur.',
      },
      // Auskommentiertes Beispiel: Ein früheres user/assistant-Paar mitzuschicken simuliert einen Gesprächsverlauf.
      // Das Modell sieht dann, was "vorher gesagt wurde" – obwohl es selbst nichts gespeichert hat.
      // { role: 'user', content: 'Wie kann ich eine Fibonacci Funtion in TypeSpript schreiben?' },
      // {
      //   role: 'assistant',
      //   content:
      //     '# Fibonacci Funktion in TypeScript\n\nHier sind mehrere Möglichkeiten:\n\n## 1. **Rekursive Lösung** (einfach, aber langsam)\n\n```typescript\nfunction fibonacci(n: number): number {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10)); // 55\n```\n\n## 2. **Iterative Lösung** (schneller und effizienter)\n\n```typescript\nfunction fibonacci(n: number): number {\n  if (n <= 1) return n;\n  \n  let prev = 0, curr = 1;\n  \n  for (let i = 2; i <= n; i++) {\n    [prev, curr] = [curr, prev + curr];\n  }\n  \n  return curr;\n}\n\nconsole.log(fibonacci(10)); // 55\n```\n\n## 3. **Mit Memoization** (rekursiv + schnell)\n\n```typescript\nfunction fibonacci(n: number, memo: Map<number, number> = new Map()): number {\n  if (n <= 1) return n;\n  if (memo.has(n)) return memo.get(n)!;\n  \n  const result = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);\n  memo.set(n, result);\n  \n  return result;\n}\n\nconsole.log(fibonacci(10)); // 55\n```\n\n## 4. **Generator Funktion** (für Sequenzen)\n\n```typescript\nfunction* fibonacciGenerator(): Generator<number> {\n  let [prev, curr] = [0, 1];\n  \n  while (true) {\n    yield prev;\n    [prev, curr] = [curr, prev + curr];\n  }\n}\n\nconst fib = fibonacciGenerator();\nconsole.log(fib.next().value); // 0\nconsole.log(fib.next().value); // 1\nconsole.log(fib.next().value); // 1\nconsole.log(fib.next().value); // 2\n```\n\n## Vergleich der Performance\n\n| Methode | Geschwindigkeit | Speicher | Einsatz |\n|---------|-----------------|----------|---------|\n| Rekursiv | ❌ Sehr langsam | Niedrig | Kleine Zahlen |\n| Iterativ | ✅ Sehr schnell | Niedrig | **Empfohlen** |\n| Memoization | ✅ Schnell | Mittel | Mehrfache Aufrufe |\n| Generator | ✅ Schnell | Mittel | Sequenzen |\n\n**Für die meisten Fälle ist die iterative Lösung die beste Wahl!**',
      // },
      // Die aktuelle Frage steht immer am Ende des Arrays
      { role: 'user', content: prompt },
    ],
  });

  // Die eigentliche Antwort steckt in response.choices[0].message.content
  console.log(response);

  res.json({ prompt, response });
});

// Das SDK liefert den Typ für eine einzelne Nachricht ({ role, content })
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

// Ein Chat in der Datenbank ist im Kern nur sein Verlauf, das messages-Array
interface ChatDocument {
  history: ChatMessage[];
}

// Da das Modell zustandslos ist, müssen wir den Verlauf speichern – hier in MongoDB
const chatSchema = new mongoose.Schema<ChatDocument>({
  history: {
    type: [Object],
    default: [],
  },
});
const Chat = mongoose.model('Chat', chatSchema);

// Der System-Prompt wird einmal beim Anlegen eines Chats an den Anfang des Verlaufs gesetzt
const systemPrompt: ChatMessage = {
  role: 'system',
  content:
    'Du bist ein Senior Software Architect und antwortest niemals mit Code auf programmierbezogene Fragen. Außerdem antwortest du nur sehr knapp in maximal 5 Sätzen.',
};

// Chat
app.post('/chat', async (req, res) => {
  const { prompt, chatId } = req.body;

  // Mit chatId: bestehenden Chat samt Verlauf laden.
  // Ohne chatId: neuen Chat anlegen, dessen Verlauf nur aus dem System-Prompt besteht.
  const chat = chatId ? await Chat.findById(chatId) : await Chat.create({ history: [systemPrompt] });

  if (!chat) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }

  const userMessage: ChatMessage = { role: 'user', content: prompt };
  // Kern des Chats: Wir schicken bei JEDER Anfrage den gesamten bisherigen Verlauf plus die neue Frage mit.
  // Nur so kann das Modell auf frühere Nachrichten Bezug nehmen.
  // Achtung: Der Verlauf wächst mit jeder Runde – mehr Tokens bedeuten höhere Kosten und längere Antwortzeiten.
  const response = await client.chat.completions.create({
    model: 'claude-opus-4-8',
    messages: [...chat.history, userMessage],
  });
  // choices ist ein Array, weil man mehrere Antwortvarianten anfordern kann; standardmäßig gibt es eine.
  // message hat bereits die Form { role: 'assistant', content: ... } und passt so direkt in den Verlauf.
  const answer = response.choices[0]?.message;

  if (!answer) {
    res.status(502).json({ error: 'No answer from model' });
    return;
  }

  // Frage UND Antwort an den Verlauf anhängen und speichern, damit sie beim nächsten Request mitgeschickt werden
  chat.history = [...chat.history, userMessage, answer];
  await chat.save();

  // Die chatId geht an den Client zurück – er schickt sie bei der nächsten Nachricht mit, um das Gespräch fortzusetzen
  res.json({ prompt, answer, chatId: chat._id });
});

app.listen(3000, () => {
  console.log('Server läuft');
});
