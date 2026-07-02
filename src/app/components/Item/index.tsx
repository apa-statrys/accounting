import React from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styles from './index.module.css';

export type ItemVariant = 'dropdown' | 'button';

export interface ItemProps {
  label: string;
  /** Value shown on the right (dropdown variant). */
  value?: string;
  variant?: ItemVariant;
  /** Trailing button label (button variant). */
  actionLabel?: string;
  onClick?: () => void;
  /** Locked (e.g. non-editable field on a limited edit): dimmed, no chevron, not tappable. */
  disabled?: boolean;
  /** Read-only (e.g. a fixed account default): no chevron, not tappable, but NOT dimmed. */
  readOnly?: boolean;
  className?: string;
}

/**
 * Item — a list row used in detail lists.
 * `dropdown`: whole row taps to open a picker (value + chevron).
 * `button`: row with a trailing action button (e.g. Edit).
 */
export const Item: React.FC<ItemProps> = ({
  label,
  value,
  variant = 'dropdown',
  actionLabel = 'Edit',
  onClick,
  disabled = false,
  readOnly = false,
  className = '',
}) => {
  const interactive = !disabled && !readOnly;
  if (variant === 'button') {
    return (
      <div className={[styles.root, className].filter(Boolean).join(' ')}>
        <span className={`${styles.label} body-sm`}>{label}</span>
        <button type="button" className={styles.editBtn} onClick={onClick}>
          <span className="link-upper-sm">{actionLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      className={[styles.root, styles.rowButton, className].filter(Boolean).join(' ')}
      style={disabled ? { opacity: 0.5, cursor: 'default' } : readOnly ? { cursor: 'default' } : undefined}
    >
      <span className={`${styles.label} body-sm`}>{label}</span>
      <span className={styles.value}>
        {value && <span className={`${styles.valueText} body-sm-medium`}>{value}</span>}
        {interactive && <ChevronRightIcon className={styles.chevron} />}
      </span>
    </button>
  );
};

Item.displayName = 'Item';

export default Item;
