import React from 'react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import styles from './index.module.css';

export interface TileProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  title: string;
  description?: string;
  showDescription?: boolean;
  selected?: boolean;
  /** Show a leading icon before the title. */
  showIcon?: boolean;
  /** Custom leading icon (defaults to a calendar icon when showIcon is set). */
  icon?: React.ReactNode;
  /** Show the trailing status badge. */
  showStatus?: boolean;
  status?: string;
  className?: string;
}

/**
 * Tile — a selectable "Selection Card".
 * States: Default (dashed) · Hover · Selected (gradient) · Disabled.
 * Optional leading icon and a trailing status badge.
 */
export const Tile = React.forwardRef<HTMLButtonElement, TileProps>(
  (
    {
      title,
      description,
      showDescription = true,
      selected = false,
      showIcon = false,
      icon,
      showStatus = false,
      status = 'PRIMARY',
      disabled,
      className = '',
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        data-state={disabled ? 'disabled' : selected ? 'selected' : 'default'}
        className={[
          styles.root,
          selected ? styles.selected : '',
          disabled ? styles.disabled : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        <div className={styles.body}>
          {showIcon ? (
            <div className={styles.titleRow}>
              <span className={styles.titleWithIcon}>
                <span className={styles.icon}>{icon ?? <CalendarTodayIcon className={styles.iconSvg} />}</span>
                <span className={`${styles.title} card-title-2xs`}>{title}</span>
              </span>
              {showStatus && (
                <span className={styles.badge}>
                  <span className="caption-sm">{status}</span>
                </span>
              )}
            </div>
          ) : (
            <p className={`${styles.title} card-title-2xs`}>{title}</p>
          )}

          {showDescription && description && (
            <p className={`${styles.description} body-sm-medium`}>{description}</p>
          )}
        </div>
      </button>
    );
  }
);

Tile.displayName = 'Tile';

export default Tile;
