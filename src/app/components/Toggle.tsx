/**
 * Toggle — a small on/off switch in the app's brand orange (#FF4A15 = --brand-5).
 * Used for the automated-chaser setting (DES-764), account-level and per-invoice.
 * (We avoid the Radix ui/switch here because its `bg-primary`/`bg-switch-background`
 *  Tailwind tokens aren't defined in this project's theme.)
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
      className="relative inline-flex h-[24px] w-[42px] shrink-0 items-center rounded-full transition-colors duration-200 outline-none"
      style={{
        background: checked ? "#FF4A15" : "#d9d9d9",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="block size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(21px)" : "translateX(3px)" }}
      />
    </button>
  );
}

export default Toggle;
