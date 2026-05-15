import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AmbientBackground } from '../components/design-system';

const pageTransition = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
};

const MainLayout = () => {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground intensity="subtle" />
      <div className="relative z-0 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} {...pageTransition}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
