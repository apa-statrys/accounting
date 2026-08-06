import type { ReceivingAccount } from "../types";

export const RECEIVING_ACCOUNTS: ReceivingAccount[] = [
  { id: "personal", name: "Personal Saving", number: "HK883-168888-168", country: "Hong Kong", primary: true,
    holder: "Your Company Ltd", bankName: "Statrys (Hong Kong)", swift: "STYSHKHH", currency: "HKD" },
  { id: "operating", name: "Operating Account", number: "SG6601-2233-4455", country: "Singapore",
    holder: "Your Company Ltd", bankName: "Statrys (Singapore)", swift: "STYSSGSGXXX", currency: "SGD" },
  { id: "france", name: "France Account", number: "FR76 3000 6000 0112 3456 7890 189", country: "France",
    holder: "Your Company Ltd", bankName: "Statrys (France)", swift: "STYSFRPPXXX", currency: "EUR", iban: true },
];

/** Compact label shown in the invoice detail row, e.g. "Personal Saving *8168" (last 4 digits) —
 *  or, for an IBAN account, "France Account FR76*" (the leading country + check digits instead,
 *  since IBANs are conventionally identified/masked from the front, not the back). */
export function formatAccount(id: string): string {
  const a = RECEIVING_ACCOUNTS.find((x) => x.id === id);
  if (!a) return "";
  const cleaned = a.number.replace(/[\s-]/g, "");
  return a.iban ? `${a.name} ${cleaned.slice(0, 4)}*` : `${a.name} *${cleaned.slice(-4)}`;
}

/** Full account record (for the invoice's bank-transfer details). */
export function getAccount(id: string): ReceivingAccount | undefined {
  return RECEIVING_ACCOUNTS.find((x) => x.id === id);
}
