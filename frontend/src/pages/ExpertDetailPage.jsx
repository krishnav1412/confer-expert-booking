import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { fetchExpertById } from '../api/experts';
import { toggleFavorite, trackView } from '../api/users';
import { getSocket } from '../sockets/socket';
import { useAuth } from '../context/AuthContext';

import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Rating from '../components/Rating';
import BookingModal from '../components/BookingModal';
import MessageExpertModal from '../components/MessageExpertModal';
import { ExpertDetailSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import {
  ArrowLeftIcon, CalendarIcon, ClockIcon, CheckIcon, CheckCircleIcon,
  AwardIcon, MessageIcon, UsersIcon, ShieldIcon, HelpIcon, ChevronDownIcon,
  LinkedInIcon, StarIcon, HeartIcon,
} from '../components/Icons';
import { formatDate, formatPrice, formatDuration, groupByDate, formatRelativeTime } from '../utils/format';

const ExpertDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [activeServiceId, setActiveServiceId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [activeDate, setActiveDate] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  const { data: expert, isLoading, isError, refetch } = useQuery({
    queryKey: ['expert', id],
    queryFn: () => fetchExpertById(id),
    enabled: !!id,
  });

  // Track profile view (auth required, non-blocking)
  useEffect(() => {
    if (id && isAuthenticated) trackView(id);
  }, [id, isAuthenticated]);

  // Default service = cheapest
  useEffect(() => {
    if (expert?.services?.length > 0 && !activeServiceId) {
      const cheapest = [...expert.services].sort((a, b) => a.price - b.price)[0];
      setActiveServiceId(cheapest._id);
    }
  }, [expert, activeServiceId]);

  // Real-time slot updates
  useEffect(() => {
    if (!id) return undefined;
    const socket = getSocket();

    const join = () => socket.emit('joinExpertRoom', id);
    if (socket.connected) join();
    socket.on('connect', join);

    const onSlotBooked = (payload) => {
      if (!payload || payload.expertId !== id) return;
      queryClient.setQueryData(['expert', id], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          availableSlots: prev.availableSlots.map((g) => {
            if (g.date !== payload.date) return g;
            return {
              ...g,
              slots: g.slots.map((s) =>
                s.time === payload.timeSlot ? { ...s, booked: true } : s
              ),
            };
          }),
        };
      });
      setSelectedSlot((cur) =>
        cur && cur.date === payload.date && cur.time === payload.timeSlot ? null : cur
      );
    };

    socket.on('slotBooked', onSlotBooked);

    return () => {
      socket.emit('leaveExpertRoom', id);
      socket.off('slotBooked', onSlotBooked);
      socket.off('connect', join);
    };
  }, [id, queryClient]);

  const sortedSlots = useMemo(
    () => (expert?.availableSlots ? groupByDate(expert.availableSlots) : []),
    [expert]
  );

  useEffect(() => {
    if (!activeDate && sortedSlots.length > 0) {
      const first = sortedSlots.find((g) => g.slots.some((s) => !s.booked)) || sortedSlots[0];
      setActiveDate(first.date);
    }
  }, [sortedSlots, activeDate]);

  const isFavorite = isAuthenticated && user?.favoriteExperts?.some((fid) => String(fid) === String(id));

  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', 'me'] });
      toast.success(isFavorite ? 'Removed from favorites' : 'Saved to favorites');
    },
    onError: (err) => {
      if (err?.status === 401) toast.error('Sign in to save favorites');
      else toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="container-app py-10">
        <BackLink />
        <div className="mt-6"><ExpertDetailSkeleton /></div>
      </div>
    );
  }

  if (isError || !expert) {
    return (
      <div className="container-app py-16">
        <BackLink />
        <div className="mt-6">
          <EmptyState title="Expert not found"
            description="The profile you're looking for doesn't exist or was removed."
            action={<button type="button" className="btn-primary" onClick={() => refetch()}>Try again</button>} />
        </div>
      </div>
    );
  }

  const activeService =
    expert.services?.find((s) => s._id === activeServiceId) ||
    expert.services?.[0] || null;

  const activeDay = sortedSlots.find((g) => g.date === activeDate) || sortedSlots[0];

  const handleBook = () => {
    if (!selectedSlot) return;
    setBookingOpen(true);
  };

  const isOwnProfile = isAuthenticated && user?.expertProfile && String(user.expertProfile?._id || user.expertProfile) === String(expert._id);

  return (
    <div className="container-app py-10">
      <BackLink />

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile */}
          <div className="card p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar src={expert.profileImage} name={expert.name} size="xl" />
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                      {expert.name}
                    </h1>
                    {expert.company && <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{expert.company}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{expert.category}</Badge>
                      <Rating value={expert.rating} />
                      {expert.reviewCount > 0 && (
                        <span className="text-sm text-ink-500 dark:text-ink-400">
                          ({expert.reviewCount} review{expert.reviewCount === 1 ? '' : 's'})
                        </span>
                      )}
                      <span className="text-sm text-ink-500 dark:text-ink-400">· {expert.experience}+ years</span>
                    </div>

                    {(expert.badges?.length > 0 || expert.featured) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {expert.featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
                            <AwardIcon className="h-3 w-3" /> Featured Expert
                          </span>
                        )}
                        {expert.badges?.filter((b) => b !== 'Featured Expert').map((badge) => (
                          <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20">
                            <AwardIcon className="h-3 w-3" /> {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => favoriteMutation.mutate()}
                        className={clsx(
                          'grid h-9 w-9 place-items-center rounded-md border transition-colors',
                          isFavorite
                            ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
                            : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:text-ink-900 dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-white'
                        )}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                      >
                        <HeartIcon filled={isFavorite} className="h-4 w-4" />
                      </button>
                    )}
                    {expert.linkedinUrl && (
                      <a href={expert.linkedinUrl} target="_blank" rel="noopener noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-md border border-ink-200 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900 dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-white"
                        aria-label="LinkedIn profile">
                        <LinkedInIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <SectionLabel>About</SectionLabel>
              <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{expert.bio}</p>
            </div>

            {expert.stats && (
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-ink-100 pt-5 dark:border-ink-800">
                <StatBlock icon={UsersIcon} value={`${expert.stats.sessionsCompleted || 0}+`} label="Sessions completed" />
                <StatBlock icon={ShieldIcon} value={`${expert.stats.repeatClientsPercent || 0}%`} label="Repeat clients" />
                <StatBlock icon={ClockIcon} value={`< ${expert.stats.responseTimeHours || 24}h`} label="Response time" />
              </div>
            )}

            {expert.skills?.length > 0 && (
              <div className="mt-6 border-t border-ink-100 pt-5 dark:border-ink-800">
                <SectionLabel>Skills & expertise</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {expert.skills.map((skill) => <Badge key={skill} variant="neutral">{skill}</Badge>)}
                </div>
              </div>
            )}
          </div>

          {/* Services */}
          {expert.services?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Services offered</h2>
              <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Pick a service. Pricing and duration update on the right.</p>
              <div className="mt-5 space-y-2.5">
                {expert.services.filter((s) => s.active !== false).map((service) => {
                  const isActive = service._id === activeServiceId;
                  return (
                    <button key={service._id} type="button" onClick={() => setActiveServiceId(service._id)}
                      className={clsx(
                        'group w-full rounded-xl border p-4 text-left transition-all',
                        isActive
                          ? 'border-ink-900 bg-ink-900/[0.02] dark:border-white dark:bg-white/[0.04]'
                          : 'border-ink-200 hover:border-ink-300 dark:border-ink-800 dark:hover:border-ink-700'
                      )}
                      aria-pressed={isActive}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-ink-900 dark:text-white">{service.name}</h3>
                            {isActive && (
                              <span className="grid h-4 w-4 place-items-center rounded-full bg-ink-900 text-white dark:bg-white dark:text-ink-900">
                                <CheckIcon className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{service.description}</p>
                          <div className="mt-2.5 flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                            <ClockIcon className="h-3.5 w-3.5" />{formatDuration(service.durationMinutes)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-lg font-bold text-ink-900 dark:text-white">{formatPrice(service.price)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deliverables */}
          {expert.deliverables?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">What you'll get</h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Every session includes the following deliverables.</p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {expert.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-ink-200">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Availability */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Pick a time</h2>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">All times shown in your local timezone. Updates in real time.</p>
              </div>
              <span className="hidden items-center gap-1.5 text-xs text-ink-500 sm:inline-flex dark:text-ink-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>

            {sortedSlots.length === 0 ? (
              <div className="mt-6"><EmptyState title="No availability" description="This expert has no slots open at the moment." /></div>
            ) : (
              <>
                <div className="mt-5 -mx-1 flex flex-nowrap gap-2 overflow-x-auto pb-1">
                  {sortedSlots.map((g) => {
                    const allBooked = g.slots.every((s) => s.booked);
                    const isActive = g.date === activeDate;
                    return (
                      <button key={g.date} type="button" onClick={() => setActiveDate(g.date)}
                        className={clsx(
                          'shrink-0 rounded-lg border px-3.5 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900'
                            : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-ink-700',
                          allBooked && 'opacity-60'
                        )}>
                        <div className="font-medium">{formatDate(g.date)}</div>
                        <div className={clsx(
                          'mt-0.5 text-xs',
                          isActive ? 'text-white/80 dark:text-ink-700' : 'text-ink-500 dark:text-ink-400'
                        )}>
                          {allBooked ? 'Fully booked' : `${g.slots.filter((s) => !s.booked).length} open`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200">
                    <CalendarIcon className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                    {formatDate(activeDay?.date, { weekday: 'long', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {activeDay?.slots.map((s) => {
                      const slotDateTime = new Date(`${activeDay.date} ${s.time}`);
                      const now = new Date();
                        const isPast =activeDay.date === now.toISOString().split('T')[0] &&slotDateTime.getTime() < now.getTime();
                        const isWithinBuffer =activeDay.date === now.toISOString().split('T')[0] && slotDateTime.getTime() - now.getTime() <((expert.bookingBufferHours || 0) * 3600 * 1000);
                      const isSelected = selectedSlot && selectedSlot.date === activeDay.date && selectedSlot.time === s.time;
                      return (
                        <button key={s.time} type="button" disabled={s.booked || isOwnProfile || isPast || isWithinBuffer}
                          onClick={() => setSelectedSlot({ date: activeDay.date, time: s.time })}
                          className={clsx(
                            'group relative inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                            (s.booked || isPast || isWithinBuffer)
                              ? 'cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400 line-through dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-600'
                              : isOwnProfile
                              ? 'cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-600'
                              : isSelected
                              ? 'border-brand-500 bg-brand-500 text-white shadow-focus'
                              : 'border-ink-200 bg-white text-ink-700 hover:border-ink-900 hover:text-ink-900 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-white dark:hover:text-white'
                          )}
                          aria-pressed={isSelected}>
                          <ClockIcon className={clsx('h-3.5 w-3.5',
                            s.booked ? 'text-ink-400 dark:text-ink-600' :
                            isSelected ? 'text-white' :
                            'text-ink-400 group-hover:text-ink-700 dark:group-hover:text-ink-200'
                          )} />
                          {s.time}
                          {isSelected && <CheckIcon className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reviews */}
          {expert.reviews?.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Reviews</h2>
                <div className="flex items-center gap-2 text-sm">
                  <Rating value={expert.rating} size="lg" />
                  <span className="text-ink-500 dark:text-ink-400">· {expert.reviewCount} review{expert.reviewCount === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {expert.reviews.map((r) => (
                  <div key={r._id} className="rounded-xl border border-ink-100 p-5 dark:border-ink-800">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon key={i} filled
                            className={clsx('h-3.5 w-3.5', i < r.rating ? 'text-amber-500' : 'text-ink-200 dark:text-ink-700')} />
                        ))}
                      </div>
                      {r.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                          <CheckCircleIcon className="h-2.5 w-2.5" /> Verified booking
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-700 dark:text-ink-200">"{r.text}"</p>
                    <div className="mt-4 flex items-center gap-3">
                      <Avatar src={r.reviewerImage} name={r.reviewerName} size="sm" />
                      <div className="text-sm">
                        <div className="font-medium text-ink-900 dark:text-white">{r.reviewerName}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">
                          {r.reviewerRole}{r.reviewerCompany && ` at ${r.reviewerCompany}`}
                          {' · '}{formatRelativeTime(r.createdAt)}
                        </div>
                      </div>
                    </div>
                    {r.expertReply && (
                      <div className="mt-4 rounded-lg border-l-2 border-ink-300 bg-ink-50/70 p-3 text-sm dark:border-ink-600 dark:bg-ink-800/50">
                        <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Expert reply</div>
                        <p className="mt-1 leading-relaxed text-ink-700 dark:text-ink-200">{r.expertReply.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {expert.faqs?.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <HelpIcon className="h-5 w-5 text-ink-500 dark:text-ink-400" />
                <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Frequently asked questions</h2>
              </div>
              <div className="mt-5 divide-y divide-ink-100 border-y border-ink-100 dark:divide-ink-800 dark:border-ink-800">
                {expert.faqs.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div key={i}>
                      <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : i)}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left" aria-expanded={isOpen}>
                        <span className="text-sm font-medium text-ink-900 dark:text-white">{faq.question}</span>
                        <ChevronDownIcon className={clsx('h-4 w-4 shrink-0 text-ink-400 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen && <p className="pb-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{faq.answer}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            {activeService ? (
              <>
                <div className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Selected service</div>
                <div className="mt-1.5 text-base font-semibold text-ink-900 dark:text-white">{activeService.name}</div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-bold text-ink-900 dark:text-white">{formatPrice(activeService.price)}</span>
                  <span className="text-sm text-ink-500 dark:text-ink-400">{formatDuration(activeService.durationMinutes)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-ink-900 dark:text-white">{formatPrice(expert.price)}</span>
                <span className="text-sm text-ink-500 dark:text-ink-400">per session</span>
              </div>
            )}

            <div className="mt-5 space-y-3 rounded-lg bg-ink-50/70 p-4 dark:bg-ink-800/50">
              <Row label="Date" value={selectedSlot ? formatDate(selectedSlot.date) : '—'} />
              <Row label="Time" value={selectedSlot ? selectedSlot.time : '—'} />
              <Row label="Duration" value={activeService ? formatDuration(activeService.durationMinutes) : '60 min'} />
            </div>

            {isOwnProfile ? (
              <div className="mt-5 rounded-md border border-ink-200 bg-ink-50 p-3 text-xs text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
                This is your public profile. Use the expert dashboard to manage services and availability.
              </div>
            ) : (
              <>
                <button type="button" disabled={!selectedSlot} onClick={handleBook} className="btn-primary mt-5 w-full">
                  {selectedSlot ? 'Continue to booking' : 'Select a time slot'}
                </button>
                <button type="button" onClick={() => setMessageOpen(true)} className="btn-secondary mt-2 w-full">
                  <MessageIcon className="h-4 w-4" />
                  Message {expert.name.split(' ')[0]}
                </button>
                {!isAuthenticated && (
                  <p className="mt-3 text-center text-xs text-ink-500 dark:text-ink-400">
                    <Link to="/login" className="font-medium underline">Sign in</Link> or{' '}
                    <Link to="/signup" className="font-medium underline">create an account</Link> to continue.
                  </p>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <BookingModal
        open={bookingOpen} onClose={() => setBookingOpen(false)}
        expert={expert} slot={selectedSlot} service={activeService}
      />
      <MessageExpertModal open={messageOpen} onClose={() => setMessageOpen(false)} expert={expert} />
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{children}</h3>
);

const StatBlock = ({ icon: Icon, value, label }) => (
  <div className="rounded-lg border border-ink-100 p-3 dark:border-ink-800">
    <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
    </div>
    <div className="mt-1.5 font-display text-base font-bold text-ink-900 dark:text-white">{value}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-ink-500 dark:text-ink-400">{label}</span>
    <span className="font-medium text-ink-900 dark:text-white">{value}</span>
  </div>
);

const BackLink = () => (
  <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">
    <ArrowLeftIcon className="h-4 w-4" />
    Back to experts
  </Link>
);

export default ExpertDetailPage;
