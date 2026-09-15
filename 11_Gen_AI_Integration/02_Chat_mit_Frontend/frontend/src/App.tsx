import type { SubmitEvent } from 'react';
import { useState } from 'react';
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
      // TODO: Post prompts
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
        {messages.map((m, i) => (
          <div key={i} className='chat'>
            <div className='chat-bubble chat-bubble-primary whitespace-pre-wrap'>{m.content}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;
