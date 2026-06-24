import React from 'react';

/**
 * iOS status-bar glyphs (signal / wifi / battery).
 *
 * These are device-chrome indicators, not product UI icons. MUI ships only
 * Material-style equivalents (which read as Android, not iOS), and the Figma
 * export references expiring remote asset URLs — so per the "create new only
 * if none of the above exist" rule these are authored here and co-located with
 * StatusBar (its only consumer). All use `currentColor`, so they inherit the
 * status bar's light/dark text color automatically.
 */

export const SignalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="12" viewBox="0 0 20 12" fill="currentColor" aria-hidden="true" {...props}>
    <rect x="0" y="8" width="3" height="4" rx="1" />
    <rect x="5.5" y="5.5" width="3" height="6.5" rx="1" />
    <rect x="11" y="3" width="3" height="9" rx="1" />
    <rect x="16.5" y="0" width="3" height="12" rx="1" />
  </svg>
);
SignalIcon.displayName = 'SignalIcon';

export const WifiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="17" height="13" viewBox="0 0 17 13" fill="none" aria-hidden="true" {...props}>
    <path d="M1.2 3.6A11 11 0 0 1 15.8 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M3.8 6.4A7 7 0 0 1 13.2 6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M6.3 9.1A3.2 3.2 0 0 1 10.7 9.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
WifiIcon.displayName = 'WifiIcon';

export const BatteryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden="true" {...props}>
    <rect x="0.6" y="0.6" width="22.8" height="11.8" rx="3.4" stroke="currentColor" strokeOpacity="0.35" />
    <rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" />
    <path d="M25 4.6v3.8c.96-.36 1.6-1.16 1.6-1.9S25.96 4.96 25 4.6z" fill="currentColor" fillOpacity="0.4" />
  </svg>
);
BatteryIcon.displayName = 'BatteryIcon';
