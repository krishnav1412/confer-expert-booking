import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AmbientBackground } from '../components/design-system';

/**
 * Stable shell layout — no AnimatePresence on <Outlet />.
 * Blocking exit transitions (especially with blur) prevented route swaps after
 * heavy pages like the dashboard and left the app blank or stuck loading.
 */
const MainLayout = () => (
  <div className="relative flex min-h-screen flex-col">
    <AmbientBackground intensity="subtle" />
    <div className="relative z-0 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  </div>
);

export default MainLayout;
