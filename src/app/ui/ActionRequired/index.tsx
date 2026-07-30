import { Button } from "../Button";
import styles from "./index.module.css";

/**
 * ActionRequired — Figma "[APP] Design System" → ActionRequired (node 4141-10423).
 * A single actionable row: title (+ optional description) and a secondary "Proceed"
 * button. Stack it (see components/NeedAttentionStack) for the dashboard preview.
 */

interface ActionRequiredProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ActionRequired({ title, description, actionLabel = "Proceed", onAction, className }: ActionRequiredProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(" ")}>
      <div className={styles.body}>
        <p className={`${styles.title} body-sm-medium`}>{title}</p>
        {description && <p className={`${styles.description} caption`}>{description}</p>}
      </div>
      <Button hierarchy="secondary" size="sm" label={actionLabel} onClick={onAction} />
    </div>
  );
}

export default ActionRequired;
