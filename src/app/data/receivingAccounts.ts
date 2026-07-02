import type { ReceivingAccount } from "../types";

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
