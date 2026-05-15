import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Avatar from './Avatar';
import Badge from './Badge';
import Rating from './Rating';
import { ArrowRightIcon, AwardIcon } from './Icons';
import { formatPrice } from '../utils/format';

const ExpertCard = ({ expert }) => {
  // Lowest service price drives the "starts from" copy
  const fromPrice =
    expert.services?.length > 0
      ? Math.min(...expert.services.map((s) => s.price))
      : expert.price;

  const MotionLink = motion(Link);

  return (
    <MotionLink
      to={`/experts/${expert._id}`}
      whileHover={{ y: -6, scale: 1.01 }}
      className="group ds-spatial-card ds-edge-light relative flex h-full flex-col p-6 transition-all hover:shadow-glow hover:border-brand-500/50 dark:hover:border-brand-500/30"
    >
      {expert.featured && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
          <AwardIcon className="h-3 w-3" />
          Featured
        </div>
      )}

      <div className="flex items-start gap-4">
        <Avatar src={expert.profileImage} name={expert.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate pr-28 text-base font-semibold text-ink-900 dark:text-white">
            {expert.name}
          </h3>
          {expert.company && (
            <div className="mt-0.5 truncate text-sm text-ink-500 dark:text-ink-400">
              {expert.company}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant="brand">{expert.category}</Badge>
            <Rating value={expert.rating} />
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
        {expert.bio}
      </p>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
          <div className="text-sm">
            <div className="text-xs text-ink-400 dark:text-ink-500">Starts from</div>
            <div>
              <span className="text-base font-semibold text-ink-900 dark:text-white">
                {formatPrice(fromPrice)}
              </span>
              {expert.stats?.sessionsCompleted > 0 && (
                <span className="ml-2 text-xs text-ink-500 dark:text-ink-400">
                  · {expert.stats.sessionsCompleted}+ sessions
                </span>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-ink-700 transition-colors group-hover:text-ink-900 dark:text-ink-300 dark:group-hover:text-white">
            View
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </MotionLink>
  );
};

export default ExpertCard;
