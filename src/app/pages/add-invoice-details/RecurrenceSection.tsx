import { Item } from "../../components/Item";

interface RecurrenceSectionProps {
  frequency: string;
  startLabel: string;
  endLabel: string;
  onFrequency?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Recurrence schedule for a recurring invoice series (DES-782). Presentational — the picker sheets and
 * all state live in the page (AddInvoiceDetails). The Auto-send toggle sits separately, below Discount.
 */
export function RecurrenceSection({ frequency, startLabel, endLabel, onFrequency, onStart, onEnd }: RecurrenceSectionProps) {
  return (
    <div
      className="w-full bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]"
      style={{ boxShadow: "var(--shadow-card-soft)" }}
    >
      <Item variant="dropdown" label="Frequency" value={frequency} onClick={onFrequency} />
      <Item variant="dropdown" label="Start Date" value={startLabel} onClick={onStart} />
      <Item variant="dropdown" label="Ends" value={endLabel} onClick={onEnd} />
    </div>
  );
}

export default RecurrenceSection;
