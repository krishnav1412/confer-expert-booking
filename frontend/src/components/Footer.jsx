import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-24 border-t border-ink-200/50 bg-white dark:border-white/5 dark:bg-[#050505]">
      <div className="container-app py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M5 7h14M5 12h14M5 17h9" />
                </svg>
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-ink-900 dark:text-white">Confer</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-ink-500 dark:text-ink-400">
              India's premium marketplace for booking real conversations with vetted mentors, designers, engineers, and founders.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink-900 dark:text-white">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Browse experts</Link></li>
              <li><Link to="/become-expert" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Become an expert</Link></li>
              <li><Link to="/dashboard" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Your dashboard</Link></li>
              <li><Link to="/messages" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Messages</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink-900 dark:text-white">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/contact" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Contact</Link></li>
              <li><a href="#" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">About</a></li>
              <li><a href="#" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Privacy</a></li>
              <li><a href="#" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-ink-200/50 pt-8 text-xs text-ink-400 dark:border-white/5">
          © {new Date().getFullYear()} Confer. Crafted with velocity.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
