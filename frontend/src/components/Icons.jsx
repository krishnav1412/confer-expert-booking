import React from 'react';

const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  strokeWidth: 1.6,
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const SearchIcon = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

export const StarIcon = ({ filled = false, ...p }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...p}
  >
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const CalendarIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9h18M8 3v3M16 3v3" /></svg>
);

export const ClockIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);

export const ArrowLeftIcon = (p) => (
  <svg {...base} {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);

export const ArrowRightIcon = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);

export const ArrowUpRightIcon = (p) => (
  <svg {...base} {...p}><path d="M7 17 17 7M7 7h10v10" /></svg>
);

export const CheckIcon = (p) => (
  <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7" /></svg>
);

export const CheckCircleIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5L15.5 9.5" /></svg>
);

export const XIcon = (p) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);

export const SunIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const MoonIcon = (p) => (
  <svg {...base} {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" /></svg>
);

export const MenuIcon = (p) => (
  <svg {...base} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);

export const InboxIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export const SparkIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />
  </svg>
);

export const UserIcon = (p) => (
  <svg {...base} {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export const UsersIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const ShieldIcon = (p) => (
  <svg {...base} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

export const LightningIcon = (p) => (
  <svg {...base} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>
);

export const MessageIcon = (p) => (
  <svg {...base} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);

export const SendIcon = (p) => (
  <svg {...base} {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
);

export const BriefcaseIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const TrendingIcon = (p) => (
  <svg {...base} {...p}><path d="m23 6-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></svg>
);

export const AwardIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.5 12.5 17 22l-5-3-5 3 1.5-9.5" />
  </svg>
);

export const HeartIcon = ({ filled = false, ...p }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...p}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const ChevronDownIcon = (p) => (
  <svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>
);

export const RupeeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 3h12M6 8h12M6 13l9 9M6 13c4 0 8-1 8-5" />
  </svg>
);

export const LinkedInIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.86 3.36-1.86 3.6 0 4.26 2.37 4.26 5.45v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
  </svg>
);

export const PlayCircleIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none" /></svg>
);

export const BookmarkIcon = ({ filled = false, ...p }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...p}
  >
    <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const PhoneIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const MailIcon = (p) => (
  <svg {...base} {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>
);

export const HelpIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

export const ChartIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 3v18h18" />
    <rect x="7" y="13" width="3" height="6" rx="0.5" />
    <rect x="12" y="9" width="3" height="10" rx="0.5" />
    <rect x="17" y="6" width="3" height="13" rx="0.5" />
  </svg>
);

export const FlameIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4-1-2 0-4 3-6z" />
  </svg>
);
