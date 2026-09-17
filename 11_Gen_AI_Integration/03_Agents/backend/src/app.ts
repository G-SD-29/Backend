import type { AgentInputItem, InputGuardrail, OutputGuardrail } from '@openai/agents';
import {
  Agent,
  handoff,
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
  resetCurrentSpan,
  run,
  setDefaultOpenAIClient,
  setOpenAIAPI,
  tool,
} from '@openai/agents';
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
// Übung: "Brauche ich gleich einen Regenschirm, wenn ich in Berlin rausgehe?"
// ============================================================================

// Diese Werte kennt die Open-Meteo API für stündliche Vorhersagen.
// Mit z.enum() sieht das Modell im JSON Schema genau, welche Werte erlaubt sind, und kann keine erfinden.
const weatherVariables = z.enum([
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'uv_index',
]);

const weatherTool = tool({
  name: 'get_weather',
  description: 'Get the hourly weather forecast for a location, starting at the current hour.',
  parameters: z.object({
    location: z.string().describe('Name of the city or location asked for.'),
    variables: z
      .array(weatherVariables)
      .min(1)
      .describe(
        'Weather variables to fetch. Pick only what the question needs, e.g. precipitation_probability and precipitation for "Do I need an umbrella?".',
      ),
    // Alle Felder sind Pflicht: Im strict mode der Agents SDK sind optionale Felder nicht erlaubt.
    forecast_hours: z
      .number()
      .int()
      .min(1)
      .max(168)
      .describe('How many hours ahead to fetch, starting now. Use a small number like 3 for "right now" questions.'),
  }),
  async execute({ location, variables, forecast_hours }) {
    console.log({ location, variables, forecast_hours });
    // URLSearchParams kodiert Sonderzeichen und Leerzeichen, z.B. in "São Paulo".
    const geoParams = new URLSearchParams({ name: location, count: '1', language: 'en', format: 'json' });
    const coordsRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${geoParams}`);

    const coordData = (await coordsRes.json()) as {
      results?: { latitude: number; longitude: number; timezone: string }[];
    };
    const place = coordData.results?.[0];

    if (!place) return `Location not found`;

    const weatherParams = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      hourly: variables.join(','),
      forecast_hours: String(forecast_hours),
      timezone: place.timezone,
    });
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`);
    if (!weatherRes.ok) return `No weather data available`;
    const weatherData = (await weatherRes.json()) as { hourly: object[] };

    return `Current local time in ${location}: ${new Date().toLocaleString('en-US', { timeZone: place.timezone })}
Forecast:
${JSON.stringify(weatherData.hourly)}`;
  },
});

const weatherAgent = new Agent({
  name: 'Weather Agent',
  model: 'claude-sonnet-5',
  instructions: `You are a weather and fashion expert. You give guidance on how to dress depending on the current weather.
  You have one tool:
  - get_weather 

  If the user did not mention a location, do NOT guess. Ask the user for their city and wait for the answer.

  If you are asked about anything outside the scope of weather and dressing, reply shortly with "I only give guidance on how to dress depending on the weather. Can I help you with that?"`,
  tools: [weatherTool],
});

// Kombiniert Chat mit History und Tool Calls
// Dadurch kann der Agent Rückfragen stellen:
//   Request 1: "Brauche ich einen Regenschirm?" → Es fehlt der Ort. Der Agent ruft kein Tool auf,
// sondern fragt nach. Eine Antwort ohne Tool-Aufruf beendet run().
//   Request 2: "Berlin" → Allein wäre das sinnlos. Weil die History aber die ursprüngliche Frage
// und die Rückfrage enthält, versteht der Agent den Zusammenhang und ruft jetzt get_weather auf.
// Ohne gespeicherte History könnte der Agent nur raten oder bei jedem Request neu fragen.
app.post('/umbrella-or-not', async (req, res) => {
  const { prompt, chatId } = req.body;
  const chat = chatId ? await Chat.findById(chatId) : await Chat.create({ history: [] });
  if (!chat) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }

  const result = await run(weatherAgent, chat.history.concat({ role: 'user', content: prompt }));

  // Die History enthält jetzt nicht nur Chat-Nachrichten, sondern auch die Tool-Aufrufe und ihre Ergebnisse.
  // Bei der nächsten Frage ("Und morgen?") kennt der Agent die Wetterdaten schon.
  chat.history = result.history;
  await chat.save();

  res.json({ answer: result.finalOutput, chatId: chat._id });
});

// ============================================================================
// Beispiel 3: Multi-Agent System mit Handoffs
// ============================================================================

// Statt eines Agents, der alles kann, bauen wir mehrere spezialisierte Agents.
// Ein Triage-Agent entscheidet nur, wer zuständig ist, und gibt das Gespräch dann ab ("Handoff").

const customerSupportAgent = new Agent({
  name: 'Customer Support Agent',
  model: 'claude-sonnet-5',
  instructions: `You are a customer support agent in a company that sells very fluffy pillows. Be friendly, helpful, and concise.`,
});

const escalationAgent = new Agent({
  name: 'Escalation Control Agent',
  model: 'claude-opus-4-8',
  instructions: `You are an escalation control agent that handles negative customer interactions.
  If the customer is upset, you will apologize and offer to escalate the issue to a manager.
  Be friendly, helpful, reassuring and concise.`,
});

const triageAgent = new Agent({
  name: 'Pillow Support Triage',
  model: 'claude-haiku-4-5',
  instructions: `NEVER answer non-pillow related questions and stop the conversation immediately. Do not handoff, when the topic is unrelated to our pillows.
  If the question is about pillows, route it to the Customer Support Agent.
  If the customer's tone is negative, route it to the Escalation Control Agent.`,
  // Für das Modell sehen Handoffs genau wie Tools aus: Die SDK erzeugt für jeden Agent hier ein Tool
  // mit dem Namen "transfer_to_<agent_name>", z.B. transfer_to_customer_support_agent.
  // Ruft das Modell dieses Tool auf, übernimmt der andere Agent das Gespräch komplett:
  // run() macht mit dessen Instructions und Modell weiter, und dieser Agent schreibt die finale Antwort.
  // (Zum Vergleich: Mit agent.asTool() würde der Triage-Agent das Ergebnis zurückbekommen und selbst antworten.)
  handoffs: [
    // Die einfachste Form: Den Agent direkt eintragen.
    customerSupportAgent,
    // Mit handoff() können wir den Handoff genauer konfigurieren.
    handoff(escalationAgent, {
      // inputType funktioniert wie 'parameters' bei einem Tool: Das Modell muss beim Handoff
      // Argumente mitschicken, hier einen Grund, warum eskaliert wird.
      inputType: z.object({
        reason: z.string(),
      }),
      // onHandoff läuft auf unserem Server, sobald der Handoff passiert – noch bevor der neue Agent antwortet.
      // Das ist ein Side Effect: Hier könnten wir z.B. ein Ticket anlegen, eine Mail an einen Manager
      // schicken oder den Vorfall in der Datenbank speichern. Das Modell bekommt davon nichts mit.
      onHandoff(context, input) {
        console.log(context);
        console.log('Das war der Grund: ', input?.reason);
      },
    }),
  ],
});

app.post('/pillow-support', async (req, res) => {
  const { prompt } = req.body;

  // Wir starten immer beim Triage-Agent. Welcher Agent am Ende geantwortet hat, entscheidet das Modell.
  const result = await run(triageAgent, prompt);

  res.json({ answer: result.finalOutput });
});

//
// ============================================================================
// Beispiel 4: Agent mit input/output-Validierung: Guardrails
// ============================================================================

// Guardrails sind Prüfungen, die die SDK automatisch um einen Agent herum ausführt:
//   - Input Guardrails prüfen, was reinkommt (bevor die Antwort des Agents verwendet wird).
//   - Output Guardrails prüfen, was der Agent zurückgibt.
// Eine Guardrail gibt { tripwireTriggered, outputInfo } zurück. Ist tripwireTriggered true,
// bricht run() ab und wirft einen Fehler, den wir im Endpunkt abfangen.
// Guardrails sind normaler Code. Das Modell kann sie nicht umgehen, egal was im Prompt steht.

// Dieses Schema nutzen wir doppelt: für die Guardrails und als strukturierten Output des Agents (siehe unten).
const BoardSchema = z.object({
  board: z.array(z.array(z.enum(['', 'X', 'O']))),
});

type Board = z.infer<typeof BoardSchema>['board'];

const isThreeByThree = (board: Board) => board.length === 3 && board.every((row) => row.length === 3);

// Input Guardrail: Hat der Client ein gültiges Spielfeld geschickt, auf dem X gerade gezogen hat?
// Standardmäßig läuft sie parallel zum Agent (runInParallel: true). Das Modell wird also
// trotzdem aufgerufen und kostet Tokens. Mit runInParallel: false wird der Agent erst nach der Prüfung starten.
const validateClientMove: InputGuardrail = {
  name: 'Client Move Validation',
  runInParallel: false,
  // 'input' ist das, was wir an run() übergeben haben – hier der JSON-String aus dem Endpunkt.
  async execute({ input }) {
    let tripwireTriggered = false;
    let outputInfo = 'Valid client move';

    try {
      const parsed = JSON.parse(input as string);
      const { board } = BoardSchema.parse(parsed); // Zod Validation
      if (!isThreeByThree(board)) throw new Error('not a 3x3 board');

      let countX = 0;
      let countO = 0;

      board.flat().forEach((cell) => {
        if (cell === 'X') countX++;
        if (cell === 'O') countO++;
      });

      // Der User spielt X und fängt an. Nach seinem Zug muss also genau ein X mehr auf dem Feld sein als O.
      if (countX !== countO + 1) {
        tripwireTriggered = true;
        outputInfo = 'Invalid move: X must have exactly one more piece on the board than O.';
      }
    } catch {
      tripwireTriggered = true;
      outputInfo = 'Invalid move: Input could not be parsed or does not match the 3x3 board schema.';
    }
    console.log('Input Guardrail läuft');
    return { tripwireTriggered, outputInfo };
  },
};

// Output Guardrail: Hat der Agent einen gültigen Zug gemacht?
// Der Typ-Parameter <typeof BoardSchema> sagt TypeScript, dass agentOutput die Form des Schemas hat.
// Sie läuft, wenn der Agent fertig ist.
const validAgentMoveGuardrail: OutputGuardrail<typeof BoardSchema> = {
  name: 'Agent Move Validation',
  // agentOutput ist bereits ein von Zod geprüftes Objekt, kein Text. Deshalb brauchen wir hier kein JSON.parse.
  async execute({ agentOutput }) {
    let tripwireTriggered = false;
    let outputInfo = 'Valid agent move.';

    const { board } = agentOutput;

    if (!isThreeByThree(board)) {
      return { tripwireTriggered: true, outputInfo: 'Invalid agent move: board is not 3x3.' };
    }

    let countX = 0;
    let countO = 0;

    board.flat().forEach((cell) => {
      if (cell === 'X') countX++;
      if (cell === 'O') countO++;
    });

    // Nach dem Zug des Agents (O) müssen X und O wieder gleich oft vorkommen.
    if (countX !== countO) {
      tripwireTriggered = true;
      outputInfo = 'Invalid agent move.';
    }
    console.log('Output Guardrail läuft');
    return { tripwireTriggered, outputInfo };
  },
};

const ticTacToeAgent = new Agent({
  name: 'Tic Tac Toe Player',
  model: 'claude-haiku-4-5',
  instructions: `You are an expert Tic-Tac-Toe player playing as 'O'.
  You will receive a 3x3 board where the user has just played 'X'.
  Make your next move by placing an 'O' in exactly one empty spot ("").
  Do not change any existing 'X' or 'O's. Return the updated board.`,
  // Strukturierter Output: Ohne outputType antwortet der Agent mit freiem Text.
  // Mit outputType schickt die SDK das Schema als gewünschtes Antwortformat an das Modell,
  // prüft die Antwort mit Zod und gibt uns in result.finalOutput ein fertiges Objekt { board: [...] } zurück.
  // So können wir mit der Antwort im Code weiterrechnen, statt Text zu parsen.
  outputType: BoardSchema,
  // Hier hängen wir die Guardrails an den Agent. Es können jeweils mehrere sein.
  outputGuardrails: [validAgentMoveGuardrail],
  inputGuardrails: [validateClientMove],
});

app.post('/tic-tac-toe', async (req, res) => {
  const { board } = req.body;
  // Der Agent bekommt Text als Input, also wandeln wir das Spielfeld in einen JSON-String um.
  const inputStr = JSON.stringify(board);

  try {
    const result = await run(ticTacToeAgent, inputStr);
    // Dank outputType ist finalOutput ein Objekt und kein String.
    res.json({ result: result.finalOutput });
  } catch (error) {
    // Schlägt eine Guardrail an, wirft run() einen eigenen Fehlertyp.
    // Mit instanceof unterscheiden wir, welcher Fhler genau vorlag und können
    // unterschiedlich fortfahren
    // Ungültige Eingabe vom Client → 400, ungültiger Zug der KI → 500.
    if (error instanceof OutputGuardrailTripwireTriggered) {
      return res.status(500).json({ error: 'Die KI hat einen ungültigen Zug gemacht. Versuch es nochmal.' });
    }
    if (error instanceof InputGuardrailTripwireTriggered) {
      return res.status(400).json({ error: error.message });
    }
    // alle anderen Fehler gehen an den globalen Errorhandler
    throw error;
  }
});

// ============================================================================
app.use('/{*splat}', () => {
  throw Error('Page not found', { cause: { status: 404 } });
});

app.use(((err, _req, res, _next) => {
  console.log(err);
  res.status(err.cause?.status || 500).json({ message: err.message });
}) satisfies ErrorRequestHandler);

app.listen(port, () => console.log(`AI Proxy with OpenAI Agents SDK listening on port ${port}`));
