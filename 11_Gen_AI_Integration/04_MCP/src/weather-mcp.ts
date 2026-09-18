// ============================================================================
// Der Wetter-Agent als MCP-Server: "Brauche ich gleich einen Regenschirm?"
// ============================================================================
//
// Beim Agent aus der Agents SDK lag alles in unserem Backend: Tool, Instructions und die Agent-Schleife.
// Ein MCP-Server liefert nur die Bausteine. Den Agenten (Modell, Chat-History, Tool-Schleife)
// bringt der Client mit, z.B. Claude Desktop oder VS Code.
//
//   Agents SDK                 →  MCP
//   tool({ ... })              →  server.registerTool()      (das Modell ruft es selbst auf)
//   Agent({ instructions })    →  server.registerPrompt()    (die Nutzerin wählt es im Client aus)
//   Wissen im Tool-Ergebnis    →  server.registerResource()  (lesbarer Kontext, z.B. eine Tabelle)
//   run() + Chat-History       →  macht der Client
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

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

// WMO-Wettercodes, wie Open-Meteo sie in weather_code liefert.
// Das Modell bekommt nur Zahlen wie 61 zurück. Über die Resource kann es nachschlagen, was sie bedeuten.
const weatherCodes: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function createServer() {
  const server = new McpServer({
    name: 'Weather Server',
    version: '0.0.1',
  });

  // --- TOOL ---
  // Fast unverändert aus der Agents SDK übernommen: parameters heißt hier inputSchema,
  // execute ist der Handler, und das Ergebnis steckt in einem content-Array statt in einem String.
  server.registerTool(
    'get_weather',
    {
      title: 'Weather Forecast',
      description: 'Get the hourly weather forecast for a location, starting at the current hour.',
      inputSchema: z.object({
        location: z.string().describe('Name of the city or location asked for.'),
        variables: z
          .array(weatherVariables)
          .min(1)
          .describe(
            'Weather variables to fetch. Pick only what the question needs, e.g. precipitation_probability and precipitation for "Do I need an umbrella?".',
          ),
        // Optionale Felder und Defaults sind hier erlaubt.
        forecast_hours: z
          .number()
          .int()
          .min(1)
          .max(168)
          .default(3)
          .describe(
            'How many hours ahead to fetch, starting now. Use a small number like 3 for "right now" questions.',
          ),
      }),
    },
    async ({ location, variables, forecast_hours }) => {
      // URLSearchParams kodiert Sonderzeichen und Leerzeichen, z.B. in "São Paulo".
      const geoParams = new URLSearchParams({ name: location, count: '1', language: 'en', format: 'json' });
      const coordsRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${geoParams}`);
      const coordData = (await coordsRes.json()) as {
        results?: { latitude: number; longitude: number; timezone: string }[];
      };
      const place = coordData.results?.[0];

      // isError: true sagt dem Client, dass der Aufruf fehlgeschlagen ist.
      // Das Modell liest die Meldung trotzdem und kann z.B. nach einem anderen Ort fragen.
      if (!place) return { isError: true, content: [{ type: 'text', text: 'Location not found' }] };

      const weatherParams = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        hourly: variables.join(','),
        forecast_hours: String(forecast_hours),
        timezone: place.timezone,
      });
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`);
      if (!weatherRes.ok) return { isError: true, content: [{ type: 'text', text: 'No weather data available' }] };
      const weatherData = (await weatherRes.json()) as { hourly: object };

      const localTime = new Date().toLocaleString('en-US', { timeZone: place.timezone });
      return {
        content: [
          {
            type: 'text',
            text: `Current local time in ${location}: ${localTime}\nForecast:\n${JSON.stringify(weatherData.hourly)}`,
          },
        ],
      };
    },
  );

  // --- RESOURCE ---
  // Eine feste Tabelle, die sich nie ändert. Dafür lohnt sich kein Tool-Aufruf:
  // Der Client kann sie einmal als Kontext laden.
  server.registerResource(
    'weather-codes',
    'weather://wmo-codes',
    {
      title: 'WMO Weather Codes',
      description: 'Meaning of the numeric weather_code values returned by get_weather.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(weatherCodes, null, 2) }],
    }),
  );

  // --- PROMPT ---
  // Die instructions des Agents werden zu einer Prompt-Vorlage.
  // Anders als Tools ruft das Modell Prompts nicht selbst auf: Die Nutzerin wählt sie im Client aus
  // (in VS Code z.B. mit "/"), füllt die Argumente aus, und der Client schickt die Nachrichten ans Modell.
  server.registerPrompt(
    'weather-stylist',
    {
      title: 'Weather Stylist',
      description: 'Get advice on how to dress for the upcoming weather.',
      // Prompt-Argumente sind im MCP-Protokoll immer Strings.
      argsSchema: z.object({
        question: z.string().describe('Your question, e.g. "Do I need an umbrella in Berlin?"'),
      }),
    },
    ({ question }) => ({
      // Prompts kennen nur die Rollen "user" und "assistant", es gibt keine system-Nachricht.
      // Die Instructions stehen deshalb in der ersten user-Nachricht.
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a weather and fashion expert. You give guidance on how to dress depending on the current weather.
Use the get_weather tool to look up the forecast. Look up weather codes in the resource weather://wmo-codes.

If the user did not mention a location, do NOT guess. Ask the user for their city and wait for the answer.

If you are asked about anything outside the scope of weather and dressing, reply shortly with "I only give guidance on how to dress depending on the weather. Can I help you with that?"

Question: ${question}`,
          },
        },
      ],
    }),
  );

  return server;
}

// Die Chat-History aus der Express-Route brauchen wir hier nicht mehr.
// Rückfragen wie "In welcher Stadt?" und die Antwort "Berlin" verwaltet der Client im eigenen Chat.
serveStdio(createServer);
console.error('Weather MCP server running on stdio');

// Testen mit dem MCP Inspector:
// npx @modelcontextprotocol/inspector node --conditions development src/weather-mcp.ts
