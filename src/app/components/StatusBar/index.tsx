import React from 'react';
import styles from './index.module.css';
import { SignalIcon, WifiIcon, BatteryIcon } from './StatusBarIcons';

export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Time shown on the left. */
  time?: string;
  /** Render light glyphs for use over dark backgrounds. */
  darkMode?: boolean;
  className?: string;
}

export const StatusBar = React.forwardRef<HTMLDivElement, StatusBarProps>(
  ({ time = '09:41', darkMode = false, className = '', ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={[styles.root, darkMode ? styles.dark : '', className]
          .filter(Boolean)
          .join(' ')}
        data-theme={darkMode ? 'dark' : 'light'}
        {...rest}
      >
        <span className={styles.time}>{time}</span>
        <div className={styles.indicators}>
          <SignalIcon />
          <WifiIcon />
          <BatteryIcon />
        </div>
      </div>
    );
  }
);

StatusBar.displayName = 'StatusBar';

export default StatusBar;
