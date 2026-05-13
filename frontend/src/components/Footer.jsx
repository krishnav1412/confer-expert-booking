import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="container-app py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-ink-900 dark:bg-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="text-white dark:text-ink-900">
                  <path d="M5 7h14M5 12h14M5 17h9" />
                </svg>
              </span>
              <span className="font-display font-bold text-ink-900 dark:text-white">Confer</span>
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

        <div className="mt-10 border-t border-ink-200 pt-6 text-xs text-ink-400 dark:border-ink-800">
          © {new Date().getFullYear()} Confer. Crafted with care.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
