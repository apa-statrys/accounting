import { Wallet, ArrowDownUp, CreditCard, LayoutGrid } from "lucide-react";

type FinanceTabId = "accounts" | "transactions" | "cards" | "menu";

interface FinanceBottomNavProps {
  /** Which tab is highlighted (the Accounting hub lives under "Menu"). */
  active?: FinanceTabId;
  onSelect?: (id: FinanceTabId) => void;
}

/** Poppins to match the Statrys finance-app shell nav (Figma 465:3159). */
const NAV_FONT = { fontFamily: "Poppins, sans-serif" } as const;
const CREAM = "#f9f5ea";

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
    <div className="absolute bottom-7 inset-x-0 z-20 flex justify-center px-4">
      <div
        className="flex items-stretch gap-1 px-2 py-2 rounded-[40px] w-full max-w-[330px]"
        style={{
          backgroundImage:
            "linear-gradient(9deg, #ff4a15 16%, #ff553a 44%, #ff7fc4 153%)",
          boxShadow: "0 12px 30px rgba(255,74,21,0.28)",
          opacity: 0.97,
        }}
      >
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect?.(id)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-[28px] transition-colors"
              style={
                isActive
                  ? {
                      background: "rgba(235,235,235,0.18)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
                    }
                  : undefined
              }
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 2}
                style={{ color: CREAM, opacity: isActive ? 1 : 0.85 }}
              />
              <span
                className="text-[11px] leading-none whitespace-nowrap"
                style={{ ...NAV_FONT, color: CREAM, opacity: isActive ? 1 : 0.85, fontWeight: isActive ? 500 : 400 }}
              >
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
