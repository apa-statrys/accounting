import { useState } from "react";
import { FileText } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { Badge } from "../ui/Badge";
import { money } from "../lib/format";
import { FONT } from "../lib/theme";
import type { ExtractedInvoice } from "../types";

export interface UploadQueueItem {
  file: { name: string; size: number };
  extraction: ExtractedInvoice;
}

export interface UploadQueueResult {
  client: string;
  amount: string;
  status: "Draft" | "Awaiting";
}

interface UploadQueueProps {
  items: UploadQueueItem[];
  /** Keyed by the item's index in `items` — present once that invoice has been reviewed/created. */
  results: Record<number, UploadQueueResult>;
  onReview: (index: number) => void;
  onBack?: () => void;
}

function QueueCard({ item, result, onOpen }: { item: UploadQueueItem; result?: UploadQueueResult; onOpen: () => void }) {
  const total = item.extraction.services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
  const preview = money(total, item.extraction.currency || "USD");
  const reviewed = !!result;

  return (
    <button
      onClick={onOpen}
      className="w-full bg-white border border-[var(--border-neutral-primary)] rounded-xl px-4 py-3 flex items-center gap-3 text-left active:bg-[var(--bg-neutral-secondary)] transition-colors"
    >
      <span className="shrink-0 w-9 h-9 rounded-lg bg-[var(--bg-neutral-secondary)] flex items-center justify-center text-[var(--icon-secondary)]">
        <FileText size={18} strokeWidth={1.67} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold leading-[1.3] text-[var(--text-primary)] truncate" style={FONT}>
          {item.file.name}
        </p>
        <p className="text-[12px] leading-[1.3] text-[var(--text-secondary)] truncate" style={FONT}>
          {reviewed ? `${result.client} · ${result.amount}` : `${item.extraction.customerName || "Customer not found"} · ${preview}`}
        </p>
      </div>
      <Badge label={reviewed ? "Reviewed" : "Needs Review"} color={reviewed ? "success" : "neutral"} size="sm" />
    </button>
  );
}

/**
 * Review Invoices — lands here after a multi-file upload (the native picker/scanner returning
 * several files at once) finishes its batch OCR pass. Each row opens the same single-invoice
 * review screen (AddInvoiceDetails) already used for a one-file upload; tapping back into this
 * queue after a Create/Save marks that row done. Leaving before every row is reviewed simply
 * abandons the remaining ones (no partial invoices are created) — same "reload resets state"
 * prototype limit as the rest of the app.
 */
export function UploadQueue({ items, results, onReview, onBack }: UploadQueueProps) {
  const [scrolled, setScrolled] = useState(false);
  const reviewedCount = Object.keys(results).length;

  return (
    <div
      className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}>
        <PageAppHeader scrolled={scrolled}>
          <PageHeader type="center" title="Review Invoices" onBack={onBack} showSearch={false} />
        </PageAppHeader>

        <div className="px-4 pt-5 pb-10 flex flex-col gap-4">
          <p className="text-[13px] leading-[1.4] text-[var(--text-secondary)]" style={FONT}>
            {reviewedCount} of {items.length} reviewed. Open an invoice to check the details and create it.
          </p>

          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <QueueCard key={i} item={item} result={results[i]} onOpen={() => onReview(i)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadQueue;
