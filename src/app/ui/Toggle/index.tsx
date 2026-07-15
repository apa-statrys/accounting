import styles from "./index.module.css";

/**
 * Toggle — design-system switch (Figma "[APP] Design System" → Toggle, node 4065-2177).
 * Variants: Selected × State(Default|Disabled). Styling in index.module.css.
 */

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Toggle({ checked, onChange, disabled = false, "aria-label": ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`${styles.track} ${checked ? styles.checked : ""}`}
    >
      <span className={styles.knob} />
    </button>
  );
}

export default Toggle;
