import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { getSocket, disconnectSocket } from './sockets/socket';

const App = () => {
  // Establish socket connection once on mount
  useEffect(() => {
    getSocket();
    return () => disconnectSocket();
  }, []);

  return <AppRoutes />;
};

export default App;
