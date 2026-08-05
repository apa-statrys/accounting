import styles from "./index.module.css";

/**
 * EmptyState — illustrated zero-state for a register with no rows at all (Figma "Sales Invoice —
 * Client", node 2070-19191 "All Invoices" / node 2071-19448 "Customer List"): hand-drawn icon,
 * title + subtitle stack, then a primary CTA. Distinct from a "no results match this filter/search"
 * message (those stay a plain caption inline where they already are) — this is the full-page
 * zero-data state, shown in place of the list/tabs/sort row entirely.
 */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className={styles.root}>
      {icon}
      <div className={styles.text}>
        <p className={`${styles.title} body-md`}>{title}</p>
        <p className={`${styles.subtitle} body-md`}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
