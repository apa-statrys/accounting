import { Wallet, ArrowDownUp, CreditCard, LayoutGrid } from "lucide-react";
import styles from "./index.module.css";

type FinanceTabId = "accounts" | "transactions" | "cards" | "menu";

interface FinanceBottomNavProps {
  /** Which tab is highlighted (the Accounting hub lives under "Menu"). */
  active?: FinanceTabId;
  onSelect?: (id: FinanceTabId) => void;
}

/**
 * The wider Statrys finance-app bottom navigation (Figma 465:3159): a glassy
 * orange-gradient pill with Accounts / Transactions / Cards / Menu. The
 * Accounting flows hang off the "Menu" tab, so it shows as active here.
 */
export function FinanceBottomNav({ active = "menu", onSelect }: FinanceBottomNavProps) {
  const tabs = [
    { id: "accounts" as const, label: "Accounts", Icon: Wallet },
    { id: "transactions" as const, label: "Transactions", Icon: ArrowDownUp },
    { id: "cards" as const, label: "Cards", Icon: CreditCard },
    { id: "menu" as const, label: "Menu", Icon: LayoutGrid },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.pill}>
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect?.(id)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={[styles.tab, isActive ? styles.tabActive : ""].filter(Boolean).join(" ")}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 2}
                className={[styles.icon, isActive ? styles.iconActive : ""].filter(Boolean).join(" ")}
              />
              <span className={[styles.label, isActive ? styles.labelActive : ""].filter(Boolean).join(" ")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FinanceBottomNav;
