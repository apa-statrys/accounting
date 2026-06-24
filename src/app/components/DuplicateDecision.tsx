import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { UploadedFileCard, FilePreviewOverlay, type UploadedFileInfo } from "./UploadedFile";
import type { ExistingInvoice } from "./extractInvoice";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

interface DuplicateDecisionProps {
  /** The matching draft already in the system. */
  existing: ExistingInvoice;
  /** The file the user uploaded — shown here with a Preview button. */
  file?: UploadedFileInfo | null;
  onBack?: () => void;
  /** Primary — open the existing draft's editor to keep editing it. */
  onEditExisting?: () => void;
  /** Secondary — create a new draft from the OCR data with a freshly generated number. */
  onCreateNew?: () => void;
}

function SummaryRow({ label, value, status }: { label: string; value: string; status?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[rgba(160,160,160,0.18)] last:border-b-0">
      <span className="text-[14px] leading-[1.3]" style={{ ...FONT, color: "#808080" }}>{label}</span>
      {status ? (
        <span
          className="px-2 py-0.5 rounded-full border text-[11px] font-bold leading-[16px]"
          style={{ ...FONT, background: "#faf9f4", borderColor: "rgba(160,160,160,0.4)", color: "#808080" }}
        >
          {value}
        </span>
      ) : (
        <span className="text-[14px] font-medium leading-[1.3] text-right" style={{ ...FONT, color: "#1b1b1b" }}>{value}</span>
      )}
    </div>
  );
}

/**
 * Duplicate decision page (DES-716): shown after OCR when an uploaded invoice matches an
 * existing DRAFT. A decision screen — NOT the editor. The user either opens the existing
 * draft to keep editing it, or creates a brand-new invoice from the upload.
 */
export function DuplicateDecision({ existing, file, onBack, onEditExisting, onCreateNew }: DuplicateDecisionProps) {
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  return (
    <div className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title="Duplicate found"
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto bg-white px-4 pt-6 pb-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <div className="w-12 h-12 rounded-full bg-[#fff7ed] border border-[#ffd9a8] flex items-center justify-center">
            <ErrorOutlineIcon style={{ fontSize: 24, color: "#b45309" }} />
          </div>
          <p className="text-[20px] font-bold leading-[1.2] text-[#1b1b1b]" style={FONT}>Duplicate invoice found</p>
          <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "#808080" }}>
            This invoice already exists. You can continue editing the existing draft or create a new
            invoice from this upload.
          </p>
        </div>

        {/* Duplicate match summary — the key fields only (decision page, not the editor). */}
        <div className="rounded-xl border border-dashed border-[rgba(160,160,160,0.35)] bg-[#faf9f4] px-4">
          <SummaryRow label="Client" value={existing.customer} />
          <SummaryRow label="Invoice number" value={existing.number} />
          <SummaryRow label="Issue date" value={existing.issueDate} />
          <SummaryRow label="Amount" value={existing.amount} />
          <SummaryRow label="Status" value={existing.status} status />
        </div>

        {/* The uploaded file, with a button to preview the original. */}
        {file && <UploadedFileCard file={file} onPreview={() => setFilePreviewOpen(true)} />}
      </div>

      {/* Decision — standard ButtonDock: primary (Edit Existing Draft) dominant, Create New secondary. */}
      <ButtonDock
        type="double"
        overflow
        primaryLabel="Edit Existing Draft"
        secondaryLabel="Create New Invoice"
        onPrimary={onEditExisting}
        onSecondary={onCreateNew}
        homeIndicator
      />

      <FilePreviewOverlay open={filePreviewOpen} file={file ?? null} onClose={() => setFilePreviewOpen(false)} />
    </div>
  );
}

export default DuplicateDecision;
