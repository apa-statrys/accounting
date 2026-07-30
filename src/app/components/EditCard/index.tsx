import React from 'react';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { Button } from '../../ui/Button';
import styles from './index.module.css';

export interface EditCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  /** Leading icon inside the avatar (defaults to a brand person-add icon). */
  icon?: React.ReactNode;
  /** Hide the leading avatar entirely (e.g. a read-only recipient card). */
  hideAvatar?: boolean;
  /** Trailing action; defaults to a "Change" button wired to onChange. */
  trailing?: React.ReactNode;
  onChange?: () => void;
  changeLabel?: string;
  className?: string;
}

export const EditCard = React.forwardRef<HTMLDivElement, EditCardProps>(
  ({ title, description, icon, hideAvatar, trailing, onChange, changeLabel = 'Change', className = '', ...rest }, ref) => {
    return (
      <div ref={ref} className={[styles.root, className].filter(Boolean).join(' ')} {...rest}>
        {!hideAvatar && (
          <div className={styles.avatar}>
            {icon ?? <PersonAddAlt1Icon className={styles.defaultIcon} />}
          </div>
        )}

        <div className={styles.body}>
          <p className={`${styles.title} card-title-sm`}>{title}</p>
          <p className={`${styles.description} body-sm-medium`}>{description}</p>
        </div>

        {trailing ?? (
          <Button hierarchy="secondary" size="sm" className={styles.change} onClick={onChange} label={changeLabel} />
        )}
      </div>
    );
  }
);

EditCard.displayName = 'EditCard';

export default EditCard;
