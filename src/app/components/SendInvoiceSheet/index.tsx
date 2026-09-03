import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
import { Chips } from "../../ui/Chips";
import { FONT, INK, avatarTint, initials } from "../../lib/theme";
import { EMAIL_RE, truncateEmailChip } from "../../lib/format";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";
import styles from "./index.module.css";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="body-sm-medium text-[var(--text-primary)]">{children}</p>;
}

/** Recipients are capped — an email blast to an unbounded list isn't this flow's job. */
const MAX_RECIPIENTS = 5;

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
  /** Dev-only (Page States "PDF Attach Failed"): simulate the PDF failing to generate/attach —
   *  Confirm & Send never completes (no onSend call) and shows its own error toast, distinct
   *  from forceError's "Failed to send invoice" wording. Tapping Confirm & Send again is the
   *  retry — no dedicated retry control. Never set from the real send flow. */
  simulatePdfError?: boolean;
  /** Dev-only (PageControls "Resend Limit Reached", invoice detail): simulate hitting the
   *  10-resend cap — Confirm & Send opens a blocking dialog instead of sending. No real send-count
   *  tracking exists in this prototype's data model; this is preview-only. Never set from the
   *  real send flow. */
  resendLimitReached?: boolean;
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
  simulatePdfError = false,
  resendLimitReached = false,
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
  // Message starts read-only (Figma default is a pre-filled template) and unlocks for editing
  // on tap, reverting to the read-only look on blur (the typed content itself is untouched
  // either way) — a one-off interaction built on top of TextArea's inert readOnly state, not
  // something that state does by itself (see ui/TextArea's own doc comment). The read TextArea
  // itself has pointer-events: none while readOnly, so the click lands on the wrapping div
  // below instead; unlocking then needs an explicit focus() since nothing native focused it.
  const [messageEditable, setMessageEditable] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (messageEditable) messageRef.current?.focus();
  }, [messageEditable]);
  const [saveDefault, setSaveDefault] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Preview sheet's own Email/PDF segment (Figma "Preview" — no separate title, the segmented
  // control itself frames what's showing). Always reopens on Email; only the PDF segment's
  // Download row is affected by the flow below.
  const [previewSegment, setPreviewSegment] = useState(0);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  // Dev-only forced-failure scenario (QuickNav "Send Invoice — Failed") — an error toast
  // alongside the button's own red "Send Failed" state (see sendFailed below).
  const [forceErrorToastOpen, setForceErrorToastOpen] = useState(false);
  // Dev-only (Page States "PDF Attach Failed") — a separate error toast for the PDF-attach
  // scenario specifically, worded differently from the generic Send Failed one above; Confirm &
  // Send just never completes (no onSend call), so tapping it again is the retry — no dedicated
  // retry affordance needed.
  const [pdfErrorToastOpen, setPdfErrorToastOpen] = useState(false);
  // Dev-only (PageControls "Resend Limit Reached") — blocking dialog instead of the normal send.
  const [resendLimitOpen, setResendLimitOpen] = useState(false);
  // Brief loading state on the primary button (dots) before it resolves to either the green
  // "Invoice Sent" confirmation or (forced-failure only) the red "Send Failed" state.
  const [sending, setSending] = useState(false);
  // Brief "Invoice Sent ✓" confirmation on the button itself (green) before actually navigating
  // away — gives the send a felt moment of completion instead of jumping straight to the next screen.
  const [sent, setSent] = useState(false);
  // Forced-failure scenario only (see forceErrorToastOpen) — turns the button red with a
  // "Send Failed" label for a couple seconds, then settles back to "Send Invoice" so the
  // scenario can be replayed instead of getting stuck red.
  const [sendFailed, setSendFailed] = useState(false);
  // Any of the three text fields (recipients / subject / message) focused → the dock shows
  // the on-screen keyboard (Figma "IOS controls" = Keyboard).
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const focusKeyboard = (e: React.FocusEvent<HTMLElement>) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); };
  const blurKeyboard = () => setKeyboardOpen(false);

  // ===== Share/Download tab state (Figma "Share/Download") =====
  const [copied, setCopied] = useState(false);
  // Brief spinner on the Download row (dev feedback DES-894: "need a loading icon when
  // downloading the PDF") before the parent's onDownload actually fires — same loading beat as
  // handleSend's `sending` above, just on FileItemBase's own trailing icon instead of the dock.
  const [downloading, setDownloading] = useState(false);
  const handleDownload = () => {
    if (downloading) return;
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      onDownload?.();
    }, 900);
  };

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const valid = parts.filter((p) => EMAIL_RE.test(p));
    const invalid = parts.filter((p) => !EMAIL_RE.test(p));
    // De-dupe case-insensitively against the existing chips AND the primary "Send To" address
    // (already getting the email — adding it again as a recipient is a no-op), plus within the
    // same pasted/typed batch itself (e.g. "a@x.com, a@x.com").
    const already = new Set([customerEmail.toLowerCase(), ...recipients.map((r) => r.toLowerCase())]);
    const newOnes: string[] = [];
    const duplicates: string[] = [];
    for (const p of valid) {
      const key = p.toLowerCase();
      if (already.has(key)) { duplicates.push(p); continue; }
      already.add(key);
      newOnes.push(p);
    }
    // Cap at MAX_RECIPIENTS — anything past the remaining slots is held back rather than silently
    // dropped, so it stays in the field (alongside any invalid text) for the client to see/retry.
    const remaining = Math.max(0, MAX_RECIPIENTS - recipients.length);
    const toAdd = newOnes.slice(0, remaining);
    const overflow = newOnes.slice(remaining);
    if (toAdd.length) {
      setRecipients((prev) => [...prev, ...toAdd]);
    }
    setRecipientError(
      invalid.length
        ? "Enter a valid email address"
        : overflow.length
          ? `You can add up to ${MAX_RECIPIENTS} recipients`
          : duplicates.length
            ? "This recipient has already been added"
            : null
    );
    // Keep any invalid or over-the-cap text in the field so the client can fix/reconsider it —
    // a duplicate never has anything to fix, so it's just dropped rather than looped back in.
    setDraft([...invalid, ...overflow].join(", "));
  };

  /** Validate every address, then send — with a recoverable failure state (DES-718 AC4). Shows a
   *  brief loading state on the button, then either the green "Invoice Sent" confirmation before
   *  handing off to the parent, or (forced-failure only) the red "Send Failed" state + error toast,
   *  which settles back to normal after a couple seconds instead of staying red. */
  const handleSend = () => {
    setSendError(null);
    setSendFailed(false);
    setSent(false);
    // Dev-only (PageControls "Resend Limit Reached") — a hard stop, not a retryable error, so it
    // takes priority over the other dev-only failure scenarios below and skips the loading beat.
    if (resendLimitReached) {
      setResendLimitOpen(true);
      return;
    }
    // Dev-only forced-failure scenario (QuickNav "Send Invoice — Failed") — same loading beat as a
    // real send, then the button turns red/"Send Failed" + an error toast fires, before settling
    // back to its normal "Send Invoice" state so the scenario can be replayed.
    if (forceError) {
      setSending(true);
      setTimeout(() => {
        setSending(false);
        setSendFailed(true);
        setForceErrorToastOpen(true);
        setTimeout(() => setSendFailed(false), 2000);
      }, 900);
      return;
    }
    // Dev-only (Page States "PDF Attach Failed") — same loading beat as a real send, then an
    // error toast fires and Confirm & Send never completes (no onSend call) — tapping it again
    // is the retry.
    if (simulatePdfError) {
      setSending(true);
      setTimeout(() => {
        setSending(false);
        setPdfErrorToastOpen(true);
      }, 900);
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
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => onSend?.(), 900);
    }, 900);
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
              <PageHeader
                type="center"
                title={`Send ${docLabel}`}
                onBack={onClose}
                rightSlot={
                  <button
                    type="button"
                    className="body-sm"
                    style={{ color: INK }}
                    onClick={() => { setPreviewSegment(0); setPreviewOpen(true); }}
                  >
                    Preview
                  </button>
                }
              />
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
                    onLayer="gray"
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
                              <AnimatePresence initial={false}>
                                {recipients.map((r) => (
                                  <motion.div
                                    key={r}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <Chips
                                      type="input"
                                      label={truncateEmailChip(r)}
                                      onDismiss={() => setRecipients((prev) => prev.filter((x) => x !== r))}
                                    />
                                  </motion.div>
                                ))}
                              </AnimatePresence>
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
                  <div
                    onClick={() => { if (!messageEditable) setMessageEditable(true); }}
                    className={messageEditable ? undefined : "cursor-pointer"}
                  >
                    <TextArea
                      ref={messageRef}
                      value={message}
                      onChange={(v) => { setMessage(v); setSaveDefault(true); }}
                      onFocus={focusKeyboard}
                      onBlur={() => { setMessageEditable(false); blurKeyboard(); }}
                      readOnly={!messageEditable}
                      rows={7}
                    />
                  </div>
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
                    downloading={downloading}
                    onClick={handleDownload}
                    onDownload={handleDownload}
                  />
                </div>
              </div>
            )}
          </div>

          <ButtonDock
            type="single"
            sticky
            primaryLabel={
              tab === 0 ? (
                // Just the label text crossfades between states — the button itself doesn't move.
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={sent ? "sent" : sendFailed ? "failed" : "send"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-block"
                  >
                    {sent ? `${docLabel} Sent` : sendFailed ? "Send Failed" : "Confirm & Send"}
                  </motion.span>
                </AnimatePresence>
              ) : (
                "Mark as Sent"
              )
            }
            primaryIconLeft={tab === 0 && sent ? <CheckIcon style={{ fontSize: 18 }} /> : undefined}
            primaryLoading={tab === 0 && sending}
            primarySuccess={tab === 0 && sent}
            primaryDestructive={tab === 0 && sendFailed}
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
            hideClose
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

          {/* Dev-only (PageControls "Resend Limit Reached") — blocks Confirm & Send instead of
              sending; hideClose since the single "Close" footer button already covers dismissal. */}
          <BottomSheet
            open={resendLimitOpen}
            title=""
            onClose={() => setResendLimitOpen(false)}
            hideClose
            compact
            footer={
              <ButtonDock type="single" primaryLabel="Close" onPrimary={() => setResendLimitOpen(false)} />
            }
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                <p className="card-title-lg" style={{ color: "var(--text-primary)" }}>
                  You’ve reached today’s resend limit
                </p>
                <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>
                  This {docLabel.toLowerCase()} has already been resent 10 times today. You can resend
                  it again tomorrow.
                </p>
              </div>
            </div>
          </BottomSheet>

          {/* This sheet's ButtonDock is always type="single", so both toasts below rely on
              Toast's own default bottomOffset (96) — same "single dock" convention as
              InvoiceDetailPage's toastBottomOffset (150 is only for a "double" dock). */}
          <Toast
            open={forceErrorToastOpen}
            message="Failed to send invoice"
            variant="error"
            onDone={() => setForceErrorToastOpen(false)}
          />

          <Toast
            open={pdfErrorToastOpen}
            message="Couldn't attach PDF, please try again"
            variant="error"
            onDone={() => setPdfErrorToastOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SendInvoiceSheet;
