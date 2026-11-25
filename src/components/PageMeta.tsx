import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

/**
 * Per-page metadata for the coach portal. The portal is a single-page app, so the browser tab, link
 * previews and search results would otherwise all show the one title from index.html. This sets the
 * <title>, description, canonical URL and Open Graph / Twitter tags for whichever route is on screen.
 * Add a row to PAGES when you add a route.
 */
const ORIGIN = 'https://coach.koshpal.com';
const PORTAL = 'Koshpal Coach Portal';

interface PageMetaEntry {
  /** react-router path pattern */
  path: string;
  title: string;
  description: string;
}

const DEFAULT_ENTRY: PageMetaEntry = {
  path: '/',
  title: 'Coach Portal',
  description: 'Koshpal coach portal: run financial coaching sessions, follow the playbook and support your clients.',
};

export const PAGES: PageMetaEntry[] = [
  { path: '/login', title: 'Coach Login', description: 'Sign in to the Koshpal coach portal to manage your sessions, clients and availability.' },
  { path: '/forgot-password', title: 'Forgot Password', description: 'Reset your Koshpal coach portal password. Enter your email and we will send you a reset link.' },
  { path: '/reset-password/:token', title: 'Reset Password', description: 'Choose a new password for your Koshpal coach portal account.' },
  { path: '/dashboard', title: 'Dashboard', description: 'Your coaching day at a glance: upcoming sessions, follow-ups, clients who need attention and tasks.' },
  { path: '/sessions', title: 'Sessions', description: 'All your coaching sessions, upcoming and past, with prepare, run and notes actions.' },
  { path: '/availability', title: 'Availability', description: 'See the weekly availability slots employees can book with you.' },
  { path: '/availability/edit', title: 'Edit Availability', description: 'Set your weekly working hours, breaks and time off so employees can book the right slots.' },
  { path: '/clients', title: 'Clients', description: 'The employees you coach, with their programme progress, next session and open actions.' },
  { path: '/clients/:id', title: 'Client Profile', description: 'A client’s goals, session history, notes, homework and progress in the coaching programme.' },
  { path: '/sessions/:id/prepare', title: 'Prepare Session', description: 'Prepare for a coaching session: review the client’s history, goals, homework and the session script.' },
  { path: '/sessions/:id/run', title: 'Session Runner', description: 'Run a coaching session step by step with the script, timer, notes and closing checklist.' },
  { path: '/calendar', title: 'Calendar', description: 'Your coaching calendar with booked sessions, availability and time off.' },
  { path: '/escalations', title: 'Escalations', description: 'Raise and track escalations for clients who need specialist help or welfare support.' },
  { path: '/playbook', title: 'Playbook', description: 'The Koshpal Coaching Playbook: session guides, rules, topic guides, templates and the full PDF.' },
  { path: '/tools', title: 'Financial Tools', description: 'Calculators and worksheets to use with clients during coaching sessions.' },
  { path: '/homework', title: 'Homework', description: 'Assign worksheets and tasks to clients and review what they have completed.' },
  { path: '/learning', title: 'Learning', description: 'Coach training modules and certification progress.' },
  { path: '/settings', title: 'Settings', description: 'Your profile, notification and security settings for the Koshpal coach portal.' },
];

/** Set (or create) a <meta> in <head>. */
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function resolvePageMeta(pathname: string): { entry: PageMetaEntry; canonical: string | null } {
  const entry = PAGES.find((p) => matchPath({ path: p.path, end: true }, pathname));
  if (!entry) return { entry: DEFAULT_ENTRY, canonical: null };
  // A canonical URL must not carry a record id or a reset token, so parameterised routes get none.
  return { entry, canonical: entry.path.includes(':') ? null : `${ORIGIN}${entry.path}` };
}

export default function PageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const { entry, canonical } = resolvePageMeta(pathname);
    const title = entry === DEFAULT_ENTRY ? 'Koshpal Coach Portal' : `${entry.title} | ${PORTAL}`;
    document.title = title;
    setMeta('name', 'description', entry.description);
    setMeta('name', 'robots', 'index, follow');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', entry.description);
    setMeta('property', 'og:url', canonical ?? ORIGIN);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', entry.description);
    setCanonical(canonical);
  }, [pathname]);
  return null;
}
