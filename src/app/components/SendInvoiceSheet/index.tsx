import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LinkIcon from "@mui/icons-material/Link";
import CheckIcon from "@mui/icons-material/Check";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { PageAppHeader } from "../PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { SegmentedControls } from "../../ui/SegmentedControls";
import { Tile } from "../../ui/Tile";
import { Button } from "../../ui/Button";
import { ButtonDock } from "../ButtonDock";
import { BottomSheet } from "../BottomSheet";
import { TextField } from "../../ui/TextField";
import { TextArea } from "../../ui/TextArea";
import { Checkbox } from "../../ui/Checkbox";
import { Toggle } from "../../ui/Toggle";
import { FONT, avatarTint, initials } from "../../lib/theme";
import { EMAIL_RE } from "../../lib/format";
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
  /** The generated no-login payment link (Share/Download tab). */
  link: string;
  /** Close (✕/back) — the parent decides where it goes (e.g. the invoice list). */
  onClose?: () => void;
  /** "Send Invoice" confirmed on the Email tab. */
  onSend?: () => void;
  /** "Mark as Sent" confirmed on the Share/Download tab. */
  onSent?: () => void;
  /** "Download" tile tapped — the parent opens the PDF preview page. */
  onDownload?: () => void;
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
  link,
  onClose,
  onSend,
  onSent,
  onDownload,
}: SendInvoiceSheetProps) {
  const [tab, setTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // ===== Email tab state (Figma "Send by Email") =====
  const companyInitial = (companyName.trim()[0] ?? "L").toUpperCase();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [cc, setCc] = useState(false);
  const [subject, setSubject] = useState(`Invoice #${invoiceNo}`);
  const [message, setMessage] = useState(
    `Hi,\n\nPlease find attached Invoice #${invoiceNo} for ${amountLabel}, due on ${dueDateLabel}.\n\nYou can view and pay your invoice using the button below.\n\nThank you for your business.`
  );
  const [saveDefault, setSaveDefault] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  // Any of the three text fields (recipients / subject / message) focused → the dock swaps its
  // home indicator for the on-screen keyboard (Figma "IOS controls" = Keyboard).
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const focusKeyboard = () => setKeyboardOpen(true);
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

  /** Validate every address, then send — with a recoverable failure state (DES-718 AC4). */
  const handleSend = () => {
    setSendError(null);
    const pending = draft.trim();
    const all = [customerEmail, ...recipients, ...(pending ? [pending] : [])];
    const bad = all.find((e) => !EMAIL_RE.test(e));
    if (bad) {
      setRecipientError(`“${bad}” is not a valid email`);
      setShowRecipients(true);
      return;
    }
    onSend?.();
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
              <PageHeader type="center" title="Send Invoice" onBack={onClose} showSearch={false} />
            </PageAppHeader>

            <div className="px-4 py-4">
              <SegmentedControls segments={["Send by Email", "Share/Download"]} activeIndex={tab} onChange={setTab} />
            </div>

            {tab === 0 ? (
              <div className={`px-4 flex flex-col gap-5 ${keyboardOpen ? "pb-[430px]" : "pb-44"}`}>
                {/* Delivery-failure banner — content is kept so the client can retry */}
                {sendError && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-[#fdecea] border border-[#f5c6c0] px-3.5 py-3">
                    <ErrorOutlineIcon style={{ fontSize: 18, color: "#d92d20", marginTop: 1 }} />
                    <p className="text-[13px] leading-[1.35] text-[#8a1c12]" style={FONT}>{sendError}</p>
                  </div>
                )}

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
                            placeholder="e.g. ayepa@gmail.com"
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

                          {recipientError && (
                            <p className="text-[12px] leading-[1.3] text-[#d92d20]" style={FONT}>{recipientError}</p>
                          )}

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
              <div className="px-4 flex flex-col gap-5 pb-32">
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
                    Anyone with this link can view and pay the invoice — no login needed. The link stays valid until the invoice is paid.
                  </p>
                </div>

                {/* Download */}
                <Tile
                  title="Download"
                  icon={<FileDownloadOutlinedIcon />}
                  reserveTrailing={false}
                  onClick={onDownload}
                />
              </div>
            )}
          </div>

          <ButtonDock
            type={tab === 0 ? "double" : "single"}
            sticky
            secondaryLabel="Preview"
            primaryLabel={tab === 0 ? (sendError ? "Try again" : "Send Invoice") : "Mark as Sent"}
            onSecondary={() => setPreviewOpen(true)}
            onPrimary={tab === 0 ? handleSend : onSent}
            homeIndicator={!keyboardOpen}
            keyboard={tab === 0 && keyboardOpen}
          />

          {/* Email preview — bottom sheet */}
          <BottomSheet open={previewOpen} title="Email Preview" onClose={() => setPreviewOpen(false)}>
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
              {/* Structured invoice content (DES-718 Email Content) */}
              <div className="bg-white px-4 pb-4">
                <button
                  type="button"
                  className="w-full rounded-lg bg-[var(--bg-neutral-inverse-primary)] text-white py-2.5 text-[14px] font-medium"
                  style={FONT}
                >
                  Open invoice
                </button>
                <div className="mt-3 rounded-lg border border-[rgba(160,160,160,0.25)] px-3.5 py-1">
                  {[
                    { label: "Invoice number", value: `#${invoiceNo}` },
                    { label: "Amount due", value: amountLabel },
                    { label: "Due date", value: dueDateLabel },
                    { label: "Payment reference", value: invoiceNo },
                  ].map((r, i, arr) => (
                    <div
                      key={r.label}
                      className={`flex items-center justify-between py-2 ${i === arr.length - 1 ? "" : "border-b border-[rgba(160,160,160,0.15)]"}`}
                    >
                      <span className="text-[12px]" style={{ ...FONT, color: "var(--text-secondary)" }}>{r.label}</span>
                      <span className="text-[12px] font-medium text-[var(--text-primary)]" style={FONT}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BottomSheet>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SendInvoiceSheet;
