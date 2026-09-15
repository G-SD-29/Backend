import type { SubmitEvent } from 'react';
import { useState } from 'react';

import Markdown, { ReactRenderer } from 'marked-react';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/night-owl.css';
import Lowlight from 'react-lowlight';

Lowlight.registerLanguage('js', javascript);
Lowlight.registerLanguage('bash', bash);

// LLMs antworten gern mit strukturiertem Text - Markdown
// und darin kann Code sein. Der Renderer zerlegt Code für
// Syntaxhighlighting.
// Nicht jete App benötigt das, aber ihr solltet mit Markdown umgehen.
const renderer: Partial<ReactRenderer> = {
  code(snippet: string, lang?: string) {
    const usedLang = lang && Lowlight.hasLanguage(lang) ? lang : 'bash';
    return <Lowlight key={this.elementId} language={usedLang} value={snippet} markers={[]} />;
  },
};

import './App.css';

type Message = { role: 'user' | 'assistant'; content: string };

function App() {
  const [pending, setPending] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [chatId, setChatId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setPending(true);

      // Wir fügen die Nutzerfrage und schon eine leere Assistant-Nachricht hinzu.
      // Die leere Nachricht ist ein Platzhalter: Beim Streaming hängen wir die ankommenden
      // Textstücke immer an diese letzte Nachricht an, bis die Antwort komplett ist.
      setMessages((prev) => [...prev, { role: 'user', content: prompt }, { role: 'assistant', content: '' }]);

      // TODO: Post prompts

      // Einfache, nicht-gestreamte Variante
      // const res = await fetch('http://localhost:8080/chat', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ prompt, chatId }),
      // });
      // const data = await res.json();

      // const { chatId: c, answer } = data;
      // Die chatId merken wir uns, damit die nächste Frage im selben Chat landet.
      // setChatId(c);
      // slice(0, -1) entfernt den leeren Platzhalter und ersetzt ihn durch die fertige Antwort.
      // Nachteil: Der Nutzer sieht so lange nichts, bis die KI komplett fertig ist.
      // setMessages((prev) => [...prev.slice(0, -1), answer]);

      // Streaming
      // Der fetch-Aufruf sieht genauso aus wie oben – der Unterschied liegt darin,
      // wie wir die Antwort lesen: Statt await res.json() (wartet auf den ganzen Body)
      // lesen wir den Body Stück für Stück, während der Server noch schreibt.
      const res = await fetch('http://localhost:8080/chat/streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, chatId }),
      });

      // fetch() ist bereits fertig, sobald die Header da sind – der Body kann noch unterwegs sein.
      // Deshalb können wir die Chat-ID aus dem Header lesen, bevor die Antwort fertig gestreamt ist.
      // (Funktioniert nur, weil das Backend den Header per CORS 'exposedHeaders' freigibt.)
      if (!res.ok || !res.body) throw new Error('Request failed');
      setChatId(res.headers.get('X-Chat-Id') ?? '');

      // res.body ist ein ReadableStream aus rohen Bytes.
      // TextDecoderStream wandelt diese Bytes in Text um – auch wenn z.B.
      // ein Umlaut (der aus mehreren Bytes besteht) auf zwei Chunks verteilt ankommt.
      // getReader() gibt uns ein Objekt, mit dem wir den Stream selbst Stück für Stück auslesen.
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

      // Endlosschleife: Wir lesen so lange, bis der Server die Verbindung schließt (res.end()).
      while (true) {
        // reader.read() wartet auf den nächsten Chunk.
        // 'value' ist das neue Textstück, 'done' wird true, wenn der Stream zu Ende ist.
        const { done, value } = await reader.read();
        if (done) break;
        console.log(value);
        // Jedes neue Stück hängen wir an die letzte Nachricht (unseren Platzhalter) an.
        // Wir nutzen die Funktionsform von setMessages ('p' = aktueller State), weil sich der State
        // in dieser Schleife ständig ändert – ein direkter Zugriff auf 'messages' wäre veraltet.
        // Jedes setMessages löst ein Re-Render aus, deshalb "tippt" die Antwort live auf dem Bildschirm.
        setMessages((p) => [...p.slice(0, -1), { role: 'assistant', content: p.at(-1)!.content + value }]);
      }
    } catch (error) {
      console.error('Error ', error);
    } finally {
      setPending(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setChatId('');
    setPrompt('');
  };

  return (
    <main className='h-screen p-2 mx-auto w-5xl flex flex-col items-center'>
      <form onSubmit={handleSubmit} className='flex w-full gap-2 items-end' inert={pending}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={'State your question...'}
          className='textarea textarea-primary flex-10/12 h-40 resize-none'
        />
        <div className='flex-2/12 flex flex-col gap-2'>
          <button type='submit' className='btn btn-primary ' disabled={pending}>
            {pending ? <span className='loading loading-spinner' /> : <span>Send</span>}
          </button>
          <button className='btn btn-secondary' type='reset' onClick={reset}>
            Clear
          </button>
        </div>
      </form>
      <div className='mockup-window border w-full my-4 flex-1 overflow-y-auto text-start px-4 '>
        {messages.map((m, i) =>
          m.role === 'assistant' ? (
            <div key={i} className='chat chat-start'>
              <div className='chat-bubble whitespace-pre-wrap'>
                <Markdown value={m.content} renderer={renderer} />
              </div>
            </div>
          ) : (
            <div key={i} className='chat chat-end'>
              <div className='chat-bubble whitespace-pre-wrap'>{m.content}</div>
            </div>
          ),
        )}
      </div>
    </main>
  );
}

export default App;
