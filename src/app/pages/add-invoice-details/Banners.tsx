// The three informational banners at the top of the invoice editor (upload flow, DES-716).
import { Banner } from "../../ui/Banner";

/** "N out of M extracted" — only when a field couldn't be read (OCR-missing case). */
export function CoverageBanner({ fieldsExtracted, fieldsTotal }: { fieldsExtracted: number; fieldsTotal: number }) {
  return <Banner color="info" text={`${fieldsExtracted} out of ${fieldsTotal} extracted. Please review before creating.`} />;
}

/** OCR-failure notice (couldn't read the file) — takes priority over the coverage summary. */
export function ExtractionFailedBanner({ onReupload, onDismiss }: { onReupload?: () => void; onDismiss: () => void }) {
  return (
    <Banner
      color="warning"
      text="We couldn’t read this file. Please enter the details below."
      linkLabel="Upload a clearer file"
      onLinkClick={onReupload}
      onClose={onDismiss}
    />
  );
}

/** Duplicate found — informational; the action lives in the dock ("Continue existing draft"). */
export function DuplicateBanner() {
  return <Banner color="warning" title="Duplicate invoice found" text="An invoice with this number already exists." />;
}
