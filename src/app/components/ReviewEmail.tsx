import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { BottomSheet } from "./BottomSheet";
import { EditCard } from "./EditCard";
import { TextInput } from "./TextInput";
import { Checkbox } from "./ui/checkbox";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
/** The signed-in user's own email — used for the "Put me in cc" option. */
const MY_EMAIL = "apa@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] font-bold leading-[1.2] text-[#1b1b1b]" style={FONT}>
      {children}
    </p>
  );
}

/** iOS-style toggle switch. */
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="relative w-[44px] h-[26px] rounded-full transition-colors shrink-0"
      style={{ background: on ? "#2f80ed" : "#d9d9d9" }}
    >
      <motion.span
        className="absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow"
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
      />
    </button>
  );
}

interface ReviewEmailProps {
  customerName: string;
  customerEmail: string;
  /** Sender company for the email brand bar (from Invoice Settings; defaults to the demo company). */
  companyName?: string;
  invoiceNo: string;
  /** Pre-formatted amount, e.g. "HKD 12,500.00". */
  amountLabel: string;
  /** Pre-formatted due date, e.g. "17 July 2025". */
  dueDateLabel: string;
  onBack?: () => void;
  /** Send the email — the parent shows the sent toast and navigates away. */
  onSend?: () => void;
}

/** Review Email — compose + live preview before sending the invoice email. */
export function ReviewEmail({
  customerName,
  customerEmail,
  companyName = "Lumen Studio",
  invoiceNo,
  amountLabel,
  dueDateLabel,
  onBack,
  onSend,
}: ReviewEmailProps) {
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

  return (
    <div className="absolute inset-0 flex flex-col bg-white rounded-[48px] overflow-hidden">
      <StatusBar />

      <SheetHeader
        title="Review Email"
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-6 flex flex-col gap-5">
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
          <EditCard title={customerName} description={customerEmail} hideAvatar trailing={<></>} />
          <label className="flex items-center gap-2 cursor-pointer pt-0.5">
            <Checkbox checked={cc} onCheckedChange={(c) => setCc(c === true)} />
            <span className="text-[14px] leading-[1.2] text-[#1b1b1b]" style={FONT}>
              Send me a copy
            </span>
          </label>
        </div>

        {/* Recipients — hidden behind a toggle */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Label>Add Recipients</Label>
            <Toggle on={showRecipients} onClick={() => setShowRecipients((v) => !v)} />
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
                  <TextInput
                    size="sm"
                    placeholder="e.g. ayepa@gmail.com"
                    value={draft}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRecipientError(null);
                      if (v.includes(",")) commit(v);
                      else setDraft(v);
                    }}
                    onKeyDown={onKeyDown}
                    onBlur={() => draft.trim() && commit(draft)}
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
                          className="inline-flex items-center gap-1.5 h-[30px] pl-3 pr-2 rounded-full border border-[rgba(160,160,160,0.45)] text-[12px] uppercase text-[#1b1b1b]"
                          style={FONT}
                        >
                          {r}
                          <button
                            type="button"
                            aria-label={`Remove ${r}`}
                            onClick={() => setRecipients((prev) => prev.filter((x) => x !== r))}
                            className="shrink-0"
                          >
                            <CloseIcon style={{ fontSize: 14, color: "#808080" }} />
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
          <TextInput
            size="sm"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setSaveDefault(true); }}
            placeholder="Subject"
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <Label>Message</Label>
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setSaveDefault(true); }}
            rows={7}
            className="w-full resize-none rounded-xl border border-[rgba(160,160,160,0.45)] bg-white px-3.5 py-3 text-[14px] leading-[1.45] text-[#1b1b1b] outline-none focus:border-[#1b1b1b]"
            style={FONT}
          />
        </div>

        {/* Save default */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={saveDefault} onCheckedChange={(c) => setSaveDefault(c === true)} />
          <span className="text-[14px] leading-[1.3] text-[#1b1b1b]" style={FONT}>
            Save the content as default
          </span>
        </label>
      </div>

      <ButtonDock
        type="double"
        overflow
        secondaryLabel="Preview Email"
        primaryLabel={sendError ? "Try again" : "Send Email"}
        onSecondary={() => setPreviewOpen(true)}
        onPrimary={handleSend}
        homeIndicator
      />

      {/* Email preview — bottom sheet */}
      <BottomSheet open={previewOpen} title="Email Preview" onClose={() => setPreviewOpen(false)}>
        <div className="rounded-xl overflow-hidden border border-[rgba(160,160,160,0.2)] shadow-sm">
          {/* Brand bar — the sender company (from Invoice Settings), not Statrys. */}
          <div className="bg-[#1b1b1b] px-4 py-3.5 flex items-center gap-2.5">
            <span className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "#FF4A15" }}>
              <span className="text-[14px] font-bold text-white" style={FONT}>{companyInitial}</span>
            </span>
            <span className="text-[18px] font-bold text-white tracking-[-0.3px]" style={FONT}>{companyName}</span>
          </div>
          {/* To / Subject band */}
          <div className="bg-[#f6f1e7] px-4 py-2.5 flex flex-col gap-0.5">
            <p className="text-[12px] leading-[1.35] text-[#6b6455]" style={FONT}>
              To: <span className="text-[#1b1b1b]">{toLine}</span>
            </p>
            {cc && (
              <p className="text-[12px] leading-[1.35] text-[#6b6455]" style={FONT}>
                Cc: <span className="text-[#1b1b1b]">{MY_EMAIL}</span>
              </p>
            )}
            <p className="text-[12px] leading-[1.35] text-[#6b6455]" style={FONT}>
              Subject: <span className="font-bold text-[#1b1b1b]">{subject}</span>
            </p>
          </div>
          {/* Body */}
          <div className="bg-white px-4 py-4 text-[13px] leading-[1.5] text-[#1b1b1b] whitespace-pre-line" style={FONT}>
            {message}
          </div>
          {/* Structured invoice content (DES-718 Email Content) */}
          <div className="bg-white px-4 pb-4">
            <button
              type="button"
              className="w-full rounded-lg bg-[#1b1b1b] text-white py-2.5 text-[14px] font-medium"
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
                  <span className="text-[12px]" style={{ ...FONT, color: "#808080" }}>{r.label}</span>
                  <span className="text-[12px] font-medium text-[#1b1b1b]" style={FONT}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

export default ReviewEmail;
