// Pure derivations for the invoice editor — no React, no state.
import { format, addDays } from "date-fns";
import { convert } from "../../lib/currency";
import type { ExtractedInvoice, InvoiceLine, ServiceLine } from "../../types";

/** Resolve a relative due-date term ("Next 30 days") against the issue date.
 *  dueDateLabel = long absolute date (email/PDF); dueRowLabel = term + short date for the
 *  details row, e.g. "Next 30 days (15 Jul 2026)"; dueShort = short absolute date (list meta). */
export function dueLabels(issueDate: Date, dueDate: string): { dueDateLabel: string; dueRowLabel: string; dueShort: string } {
  const dueMatch = dueDate.match(/(\d+)/);
  const relative = !!dueMatch && /next/i.test(dueDate);
  if (!relative) return { dueDateLabel: dueDate, dueRowLabel: dueDate, dueShort: dueDate };
  const resolved = addDays(issueDate, Number(dueMatch![1]));
  return {
    dueDateLabel: format(resolved, "d MMMM yyyy"),
    dueRowLabel: `${dueDate} (${format(resolved, "d MMM yyyy")})`,
    dueShort: format(resolved, "d MMM yyyy"),
  };
}

/** Extraction coverage — drives the "N out of M extracted" review card (OCR-missing case only). */
export function extractionCoverage(
  extracted: ExtractedInvoice | null | undefined,
  emailMissing: boolean
): { fieldsTotal: number; fieldsExtracted: number; fieldsNeedAttention: number } {
  const fields = extracted
    ? [
        { ok: !!extracted.invoiceNumber.trim() },
        { ok: !!extracted.customerName.trim() },
        { ok: !emailMissing },
        { ok: !!extracted.issueDate },
        { ok: !!extracted.dueDate },
        { ok: !!extracted.currency },
        { ok: true }, // amount (always derived from the line items)
        ...extracted.services.map((s) => ({ ok: !!s.name.trim() && s.quantity > 0 && s.unitPrice >= 0 })),
      ]
    : [];
  const fieldsTotal = fields.length;
  const fieldsNeedAttention = fields.filter((f) => !f.ok).length;
  return { fieldsTotal, fieldsExtracted: fieldsTotal - fieldsNeedAttention, fieldsNeedAttention };
}

/** Line items converted into the invoice currency, for the PDF preview. */
export function toPreviewItems(services: ServiceLine[], currency: string): InvoiceLine[] {
  return services.map((s) => ({
    name: s.name,
    description: s.description,
    qty: s.quantity,
    unit: s.unit,
    unitPrice: convert(s.unitPrice, s.currency, currency),
    amount: convert(s.quantity * s.unitPrice, s.currency, currency),
  }));
}
