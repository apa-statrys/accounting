import AddIcon from "@mui/icons-material/Add";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "./Tile";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

export interface ReceivingAccount {
  id: string;
  name: string;
  number: string;
  flag: string;
  primary?: boolean;
  /** Account holder (the sender's business). */
  holder: string;
  bankName: string;
  swift: string;
  /** Account currency. */
  currency: string;
}

export const RECEIVING_ACCOUNTS: ReceivingAccount[] = [
  { id: "personal", name: "Personal Saving", number: "HK883-168888-168", flag: "🇭🇰", primary: true,
    holder: "Your Company Ltd", bankName: "Statrys (Hong Kong)", swift: "STYSHKHH", currency: "HKD" },
  { id: "operating", name: "Operating Account", number: "SG6601-2233-4455", flag: "🇸🇬",
    holder: "Your Company Ltd", bankName: "Statrys (Singapore)", swift: "STYSSGSGXXX", currency: "SGD" },
  { id: "france", name: "France Account", number: "FR76 3000 6000 0112 3456 7890 189", flag: "🇫🇷",
    holder: "Your Company Ltd", bankName: "Statrys (France)", swift: "STYSFRPPXXX", currency: "EUR" },
];

/** Compact label shown in the invoice detail row, e.g. "Personal Saving (..222)". */
export function formatAccount(id: string): string {
  const a = RECEIVING_ACCOUNTS.find((x) => x.id === id);
  if (!a) return "";
  const digits = a.number.replace(/\s/g, "");
  return `${a.name} (..${digits.slice(-3)})`;
}

/** Full account record (for the invoice's bank-transfer details). */
export function getAccount(id: string): ReceivingAccount | undefined {
  return RECEIVING_ACCOUNTS.find((x) => x.id === id);
}

interface ReceivingAccountSheetProps {
  open: boolean;
  /** Selected account id. */
  value?: string;
  /** Sheet title — defaults to "Receiving Account"; refund flow passes "Refund from". */
  title?: string;
  /** Hide the "Use External Bank Account" option (e.g. a refund must be paid from a Statrys account). */
  hideExternal?: boolean;
  onClose?: () => void;
  onSelect?: (id: string) => void;
  onUseExternal?: () => void;
}

export function ReceivingAccountSheet({
  open,
  value,
  title = "Receiving Account",
  hideExternal = false,
  onClose,
  onSelect,
  onUseExternal,
}: ReceivingAccountSheetProps) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <motion.div variants={sheetItem}>
          <p className="text-[16px] font-bold leading-[1.3] text-[#1b1b1b]" style={FONT}>
            Statrys Accounts
          </p>
        </motion.div>

        <div className="flex flex-col gap-2">
          {RECEIVING_ACCOUNTS.map((a) => (
            <motion.div key={a.id} variants={sheetItem}>
              <Tile
                title={a.name}
                description={a.number}
                showIcon
                icon={<span className="text-[16px] leading-none">{a.flag}</span>}
                showStatus={a.primary}
                status="PRIMARY"
                selected={value === a.id}
                onClick={() => onSelect?.(a.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Divider + external account (hidden when the source must be a Statrys account, e.g. a refund). */}
        {!hideExternal && (
          <motion.div variants={sheetItem} className="flex flex-col gap-4">
            <div className="border-t border-[rgba(160,160,160,0.2)]" />
            <button
              type="button"
              onClick={onUseExternal}
              className="w-full flex items-center justify-between bg-white border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl p-[17px] transition-colors hover:bg-[#faf9f4]"
            >
              <span className="card-title-2xs text-[#101828]">Use External Bank Account</span>
              <AddIcon style={{ fontSize: 20, color: "#1b1b1b" }} />
            </button>
          </motion.div>
        )}
      </div>
    </BottomSheet>
  );
}

export default ReceivingAccountSheet;
