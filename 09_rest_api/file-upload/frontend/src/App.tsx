import { Toaster } from 'react-hot-toast';
import { toastOptions } from './utils/toastSettings.ts';
import EditForm from './components/EditForm.tsx';

const App = () => {
  return (
    <main className='p-4'>
      <EditForm />
      <Toaster position='bottom-right' toastOptions={toastOptions} />
    </main>
  );
};

export default App;
