import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import CheckIcon from "@mui/icons-material/Check";
import { Download as DownloadIcon } from "lucide-react";
import { PageAppHeader } from "../PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { SegmentedControls } from "../../ui/SegmentedControls";
import { Tile } from "../../ui/Tile";
import { FileItemBase } from "../../ui/FileItemBase";
import { Banner } from "../../ui/Banner";
import { Button } from "../../ui/Button";
import { ButtonDock } from "../ButtonDock";
import { BottomSheet } from "../BottomSheet";
import { Toast } from "../Toast";
import { TextField } from "../../ui/TextField";
import { TextArea } from "../../ui/TextArea";
import { Checkbox } from "../../ui/Checkbox";
import { Toggle } from "../../ui/Toggle";
import { FONT, avatarTint, initials } from "../../lib/theme";
import { EMAIL_RE } from "../../lib/format";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";
import styles from "./index.module.css";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="body-sm-medium text-[var(--text-primary)]">{children}</p>;
}

interface SendInvoiceSheetProps {
  open: boolean;
  customerName: string;
  customerEmail: string;
  /** Sender company for the email brand bar (from Invoice Settings; defaults to the demo company). */
  companyName?: string;
  /** Sender company email (from Invoice Settings) — shown as the Cc when "Send me a copy" is on. */
  companyEmail?: string;
  invoiceNo: string;
  /** Pre-formatted amount, e.g. "HKD 12,500.00". */
  amountLabel: string;
  /** Pre-formatted due date, e.g. "17 July 2025". */
  dueDateLabel: string;
  /** Which document is being sent — drives the email subject/message/preview-button wording. */
  docType?: "invoice" | "creditNote";
  /** The generated no-login payment link (Share/Download tab). */
  link: string;
  /** Close (✕/back) — the parent decides where it goes (e.g. the invoice list). */
  onClose?: () => void;
  /** "Send Invoice" confirmed on the Email tab. */
  onSend?: () => void;
  /** "Mark as Sent" confirmed on the Share/Download tab. */
  onSent?: () => void;
  /** Share/Download tab's file row tapped — the parent opens the full PDF preview page. */
  onDownload?: () => void;
  /** Preview sheet's PDF-segment Download button tapped — the document is already shown right
   *  there, so this just closes the sheet; the parent shows its own download toast (no full-page
   *  preview navigation). */
  onQuickDownload?: () => void;
  /** The actual document preview — an `InvoiceDocumentPreview`/`CreditNoteDocumentPreview` built
   *  by the parent from the same data it already threads to the full-screen preview page. Shown in
   *  the Preview sheet's PDF segment (not the Share/Download tab, which keeps its own file row). */
  docPreview?: React.ReactNode;
  /** Dev-only (QuickNav "Send Invoice — Failed"): make every Send attempt fail with an error
   *  toast — screen and button stay identical to a normal send, no inline banner/relabel. Never
   *  set from the real send flow. */
  forceError?: boolean;
}

/**
 * Send Invoice — a full page (slides in), Figma node 1841-12174 / 1841-12402. A
 * SegmentedControls switches between "Send by Email" (compose + live preview) and
 * "Share/Download" (copy the no-login link, or download a PDF) — replaces the old
 * 3-tile "Select Delivery Method" chooser + separate Review Email / Shareable Link
 * screens with one page.
 */
export function SendInvoiceSheet({
  open,
  customerName,
  customerEmail,
  companyName = "Lumen Studio",
  companyEmail = "hello@lumenstudio.co",
  invoiceNo,
  amountLabel,
  dueDateLabel,
  docType = "invoice",
  link,
  onClose,
  onSend,
  onSent,
  onDownload,
  onQuickDownload,
  docPreview,
  forceError = false,
}: SendInvoiceSheetProps) {
  const [tab, setTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // ===== Email tab state (Figma "Send by Email") =====
  const companyInitial = (companyName.trim()[0] ?? "L").toUpperCase();
  // Document noun for the subject / message / preview button ("Invoice" vs "Credit Note").
  const isCreditNote = docType === "creditNote";
  const docLabel = isCreditNote ? "Credit Note" : "Invoice";
  const [recipients, setRecipients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [cc, setCc] = useState(false);
  const [subject, setSubject] = useState(`${docLabel} #${invoiceNo}`);
  const [message, setMessage] = useState(
    isCreditNote
      ? `Hi,\n\nPlease find attached Credit Note #${invoiceNo} for ${amountLabel}.\n\nYou can view your credit note using the button below.\n\nThank you for your business.`
      : `Dear ${customerName},\n\nPlease find attached Invoice #${invoiceNo} in the amount of ${amountLabel}, due on ${dueDateLabel}.\n\nYou can open the invoice by clicking the button below.\n\nThank you for your continued business.\n\nKind regards,\n\n${companyName}`
  );
  const [saveDefault, setSaveDefault] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Preview sheet's own Email/PDF segment (Figma "Preview" — no separate title, the segmented
  // control itself frames what's showing). Always reopens on Email; only the PDF segment's
  // Download row is affected by the flow below.
  const [previewSegment, setPreviewSegment] = useState(0);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  // Dev-only forced-failure scenario (QuickNav "Send Invoice — Failed") — an error toast on top
  // of the unchanged screen, not the inline banner/"Try again" state real validation failures use.
  const [forceErrorToastOpen, setForceErrorToastOpen] = useState(false);
  // Brief "Invoice Sent ✓" confirmation on the button itself before actually navigating away —
  // gives the send a felt moment of completion instead of jumping straight to the next screen.
  const [sent, setSent] = useState(false);
  // Any of the three text fields (recipients / subject / message) focused → the dock shows
  // the on-screen keyboard (Figma "IOS controls" = Keyboard).
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const focusKeyboard = (e: React.FocusEvent<HTMLElement>) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); };
  const blurKeyboard = () => setKeyboardOpen(false);

  // ===== Share/Download tab state (Figma "Share/Download") =====
  const [copied, setCopied] = useState(false);

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const valid = parts.filter((p) => EMAIL_RE.test(p));
    const invalid = parts.filter((p) => !EMAIL_RE.test(p));
    if (valid.length) {
      setRecipients((prev) => [...prev, ...valid.filter((p) => !prev.includes(p))]);
    }
    setRecipientError(invalid.length ? "Enter a valid email address" : null);
    // Keep any invalid text in the field so the client can fix it.
    setDraft(invalid.join(", "));
  };

  /** Validate every address, then send — with a recoverable failure state (DES-718 AC4). Shows a
   *  brief "Sent" confirmation on the button itself before actually handing off to the parent. */
  const handleSend = () => {
    setSendError(null);
    // Dev-only forced-failure scenario (QuickNav "Send Invoice — Failed") — an error toast, same
    // screen/button as a normal send (no inline banner, no "Try again" relabel).
    if (forceError) {
      setForceErrorToastOpen(true);
      return;
    }
    const pending = draft.trim();
    const all = [customerEmail, ...recipients, ...(pending ? [pending] : [])];
    const bad = all.find((e) => !EMAIL_RE.test(e));
    if (bad) {
      setRecipientError(`“${bad}” is not a valid email`);
      setShowRecipients(true);
      return;
    }
    setSent(true);
    setTimeout(() => onSend?.(), 900);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && recipients.length) {
      setRecipients((prev) => prev.slice(0, -1));
    }
  };

  const toLine = [customerEmail, ...recipients].join(" , ");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard may be blocked in the sandbox — link is still generated */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.root}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
        >
          <div className={styles.body} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}>
            <PageAppHeader scrolled={scrolled}>
              <PageHeader type="center" title={`Send ${docLabel}`} onBack={onClose} showSearch={false} />
              {/* PageAppHeader's own flex `gap: 12px` already provides part of Figma's 16px top
                  padding here (node 1896-17204) — pt-1 (4px) tops it up to 16px total; pb-2 (8px)
                  matches the frame's asymmetric bottom padding. */}
              <div className="px-4 pt-1 pb-2">
                <SegmentedControls segments={["Send by Email", "Share/Download"]} activeIndex={tab} onChange={setTab} />
              </div>
            </PageAppHeader>

            {tab === 0 ? (
              <div className={`px-4 pt-4 flex flex-col gap-5 ${keyboardOpen ? "pb-[430px]" : "pb-44"}`}>
                {/* Delivery-failure banner — content is kept so the client can retry */}
                <AnimatePresence initial={false}>
                  {sendError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <Banner color="error" text={sendError} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Send To */}
                <div className="flex flex-col gap-2">
                  <Label>Send To</Label>
                  <Tile
                    title={customerName}
                    text={customerEmail}
                    avatar={initials(customerName)}
                    avatarColor={avatarTint(customerName)}
                    onLayer="beige"
                    reserveTrailing={false}
                  />
                  <Checkbox checked={cc} onChange={setCc} label="Send me a copy" />
                </div>

                {/* Recipients — hidden behind a toggle */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <Label>Add Recipients</Label>
                    <Toggle checked={showRecipients} onChange={setShowRecipients} aria-label="Show recipients" />
                  </div>

                  <AnimatePresence initial={false}>
                    {showRecipients && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2.5 pt-0.5">
                          <TextField
                            placeholder="e.g. name@example.com"
                            value={draft}
                            onChange={(v) => {
                              setRecipientError(null);
                              if (v.includes(",")) commit(v);
                              else setDraft(v);
                            }}
                            onKeyDown={onKeyDown}
                            onFocus={focusKeyboard}
                            onBlur={() => { draft.trim() && commit(draft); blurKeyboard(); }}
                            inputMode="email"
                          />

                          <AnimatePresence initial={false}>
                            {recipientError && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="text-[12px] leading-[1.3] text-[#d92d20] overflow-hidden"
                                style={FONT}
                              >
                                {recipientError}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          {recipients.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {recipients.map((r) => (
                                <span
                                  key={r}
                                  className="inline-flex items-center gap-1.5 h-[30px] pl-3 pr-2 rounded-full border border-[rgba(160,160,160,0.45)] text-[12px] uppercase text-[var(--text-primary)]"
                                  style={FONT}
                                >
                                  {r}
                                  <button
                                    type="button"
                                    aria-label={`Remove ${r}`}
                                    onClick={() => setRecipients((prev) => prev.filter((x) => x !== r))}
                                    className="shrink-0"
                                  >
                                    <CloseIcon style={{ fontSize: 14, color: "var(--text-secondary)" }} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <Label>Subject</Label>
                  <TextField
                    value={subject}
                    onChange={(v) => { setSubject(v); setSaveDefault(true); }}
                    onFocus={focusKeyboard}
                    onBlur={blurKeyboard}
                    placeholder="Subject"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <Label>Message</Label>
                  <TextArea
                    value={message}
                    onChange={(v) => { setMessage(v); setSaveDefault(true); }}
                    onFocus={focusKeyboard}
                    onBlur={blurKeyboard}
                    rows={7}
                  />
                </div>

                {/* Save default */}
                <Checkbox checked={saveDefault} onChange={setSaveDefault} label="Save the content as default" />
              </div>
            ) : (
              <div className="px-4 pt-4 flex flex-col gap-5 pb-32">
                {/* Link field + copy */}
                <div className="flex flex-col gap-2">
                  <TextField
                    value={link}
                    onChange={() => {}}
                    iconRight={
                      <Button
                        hierarchy="secondary"
                        size="sm"
                        onClick={copyLink}
                        iconLeft={copied ? <CheckIcon style={{ fontSize: 16 }} /> : <LinkIcon style={{ fontSize: 16 }} />}
                        label={copied ? "Copied" : "Copy Link"}
                      />
                    }
                  />
                  <p className="text-[12px] leading-[1.3] text-[var(--text-secondary)]" style={FONT}>
                    {isCreditNote
                      ? "Anyone with this link can view the credit note — no login needed."
                      : "Anyone with this link can view and pay the invoice — no login needed. The link stays valid until the invoice is paid."}
                  </p>
                </div>

                {/* Download (Figma "Sales Invoice - Client" node 1943-12485) — reuses the
                    FileItemBase design-system row (Figma node 4655-4008), same as the
                    uploaded-file chip, with action="download" swapping in the download icon.
                    Single interaction here (tap anywhere = download) — the Preview sheet already
                    covers viewing the document separately, so this row doesn't need its own
                    split view/action split like a real uploaded-file row does. */}
                <div className="flex flex-col gap-3">
                  <p className="body-sm text-[var(--text-primary)]">Download</p>
                  <FileItemBase
                    name={`${invoiceNo}.pdf`}
                    size="148 KB"
                    fileType="pdf"
                    state="completed"
                    action="download"
                    onClick={onDownload}
                    onDownload={onDownload}
                  />
                </div>
              </div>
            )}
          </div>

          <ButtonDock
            type={tab === 0 ? "double" : "single"}
            sticky
            secondaryLabel="Preview"
            primaryLabel={
              tab === 0 ? (
                // Just the label text crossfades to "Invoice Sent" — the button itself doesn't move.
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={sent ? "sent" : sendError ? "retry" : "send"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-block"
                  >
                    {sent ? `${docLabel} Sent` : sendError ? "Try again" : `Send ${docLabel}`}
                  </motion.span>
                </AnimatePresence>
              ) : (
                "Mark as Sent"
              )
            }
            primaryIconLeft={tab === 0 && sent ? <CheckIcon style={{ fontSize: 18 }} /> : undefined}
            onSecondary={() => { setPreviewSegment(0); setPreviewOpen(true); }}
            onPrimary={tab === 0 ? handleSend : onSent}
            keyboard={tab === 0 && keyboardOpen}
          />

          {/* Preview — Email/PDF segmented control replaces the title (no separate "Email Preview"
              text; the segments themselves frame what's showing). PDF segment shows the actual
              document (docPreview) plus its own Download button — the document's already right
              there, so Download just closes this sheet + fires the parent's toast (onQuickDownload),
              no full-page preview navigation. */}
          <BottomSheet
            open={previewOpen}
            title=""
            onClose={() => setPreviewOpen(false)}
            headerExtra={
              <div className="px-4 pb-3">
                <SegmentedControls segments={["Email", "PDF"]} activeIndex={previewSegment} onChange={setPreviewSegment} />
              </div>
            }
          >
            {previewSegment === 0 ? (
              <div className="rounded-xl overflow-hidden border border-[rgba(160,160,160,0.2)] shadow-sm">
                {/* Brand bar — the sender company (from Invoice Settings), not Statrys. */}
                <div className="bg-[var(--bg-neutral-inverse-primary)] px-4 py-3.5 flex items-center gap-2.5">
                  <span className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "var(--bg-brand-primary)" }}>
                    <span className="text-[14px] font-bold text-white" style={FONT}>{companyInitial}</span>
                  </span>
                  <span className="text-[18px] font-bold text-white tracking-[-0.3px]" style={FONT}>{companyName}</span>
                </div>
                {/* To / Subject band */}
                <div className="bg-[#f6f1e7] px-4 py-2.5 flex flex-col gap-0.5">
                  <p className="text-[12px] leading-[1.35] text-[#6b6455]" style={FONT}>
                    To: <span className="text-[var(--text-primary)]">{toLine}</span>
                  </p>
                  {cc && (
                    <p className="text-[12px] leading-[1.35] text-[#6b6455]" style={FONT}>
                      Cc: <span className="text-[var(--text-primary)]">{companyEmail}</span>
                    </p>
                  )}
                  <p className="text-[12px] leading-[1.35] text-[#6b6455]" style={FONT}>
                    Subject: <span className="font-bold text-[var(--text-primary)]">{subject}</span>
                  </p>
                </div>
                {/* Body */}
                <div className="bg-white px-4 py-4 text-[13px] leading-[1.5] text-[var(--text-primary)] whitespace-pre-line" style={FONT}>
                  {message}
                </div>
                {/* Structured invoice content (DES-718 Email Content) — the number/amount/due date
                    already appear in the subject and body above, so no separate summary box. */}
                <div className="bg-white px-4 pb-4">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-[var(--bg-neutral-inverse-primary)] text-white py-2.5 text-[14px] font-medium"
                    style={FONT}
                  >
                    {isCreditNote ? "Open Credit Note" : "Open Invoice"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* The actual document (InvoiceDocumentPreview/CreditNoteDocumentPreview, built
                    by the parent from the same data as the full-screen preview) — not a file chip,
                    this IS the PDF. */}
                {docPreview}
                <Button
                  hierarchy="primary"
                  fullWidth
                  iconLeft={<DownloadIcon size={18} strokeWidth={1.67} />}
                  label="Download"
                  onClick={() => { setPreviewOpen(false); onQuickDownload?.(); }}
                />
              </div>
            )}
          </BottomSheet>

          <Toast
            open={forceErrorToastOpen}
            message="Failed to send invoice"
            variant="error"
            bottomOffset={150}
            onDone={() => setForceErrorToastOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SendInvoiceSheet;
