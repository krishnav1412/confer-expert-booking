import { useEffect, useState, useCallback } from 'react';
import AppRoutes from './routes/AppRoutes';
import { getSocket } from './sockets/socket';
import Preloader from './components/Preloader';

const App = () => {
  const [preloaderDone, setPreloaderDone] = useState(false);

  // Singleton socket — no cleanup on unmount (StrictMode remount must not reconnect-loop)
  useEffect(() => {
    getSocket();
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    setPreloaderDone(true);
  }, []);

  return (
    <>
      {!preloaderDone && <Preloader onComplete={handlePreloaderComplete} />}
      {/* Render routes immediately so they start hydrating behind the preloader */}
      <div style={{ opacity: preloaderDone ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <AppRoutes />
      </div>
    </>
  );
};

export default App;
