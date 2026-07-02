import { useState } from "react";
import { motion } from "motion/react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IosShareIcon from "@mui/icons-material/IosShare";
import CheckIcon from "@mui/icons-material/Check";
import LinkIcon from "@mui/icons-material/Link";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { ButtonDock } from "./ButtonDock";
import { DemoShareSheet } from "./DemoShareSheet";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

interface ShareLinkSheetProps {
  open: boolean;
  /** The generated no-login payment link. */
  link: string;
  /** "Mark as sent" tapped — invoice marked Sent, return to list. */
  onSent?: () => void;
  /** Closed (✕) without marking sent — just dismiss; the invoice stays a draft. */
  onDismiss?: () => void;
}

/**
 * Shareable link (DES-718): a permanent, no-login payment link. Copying/sharing does
 * NOT mark the invoice sent — only the explicit "Mark as sent" CTA does. Closing the
 * sheet (✕) leaves the invoice a draft.
 */
export function ShareLinkSheet({ open, link, onSent, onDismiss }: ShareLinkSheetProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard may be blocked in the sandbox — link is still generated */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Always open the demo iOS share sheet (no real sharing). Stays on this sheet after.
  const share = () => setShareSheetOpen(true);

  const onPickChannel = (channelId: string) => {
    setShareSheetOpen(false);
    if (channelId === "copy") {
      copy();
      return;
    }
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  const reset = () => {
    setCopied(false);
    setShared(false);
  };
  // ✕ / scrim: dismiss only — copying a link never marks the invoice sent (stays a draft).
  const dismiss = () => {
    reset();
    onDismiss?.();
  };
  // Explicit CTA: mark the invoice as sent.
  const markSent = () => {
    reset();
    onSent?.();
  };

  return (
    <>
    <DemoShareSheet open={shareSheetOpen} link={link} onClose={() => setShareSheetOpen(false)} onPick={onPickChannel} />
    <BottomSheet
      open={open}
      title="Shareable link"
      onClose={dismiss}
      footer={<ButtonDock type="single" primaryLabel="Mark as sent" onPrimary={markSent} homeIndicator />}
    >
      <div className="flex flex-col gap-4">
        {/* Link field — the single copy affordance (tap field or icon) */}
        <motion.div variants={sheetItem} className="w-full flex items-center gap-2.5 h-[52px] pl-4 pr-1.5 rounded-xl border border-[rgba(160,160,160,0.4)] bg-[#faf9f4]">
          <LinkIcon style={{ fontSize: 18, color: "#808080" }} />
          <button type="button" onClick={copy} className="flex-1 min-w-0 truncate text-[14px] text-[#1b1b1b] text-left" style={FONT}>
            {link}
          </button>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 h-9 px-3 rounded-lg flex items-center gap-1.5"
            style={{ background: copied ? "#e7f6ec" : "#1b1b1b" }}
          >
            {copied ? (
              <>
                <CheckIcon style={{ fontSize: 16, color: "#006a1d" }} />
                <span className="text-[13px] font-medium" style={{ ...FONT, color: "#006a1d" }}>Copied</span>
              </>
            ) : (
              <>
                <ContentCopyIcon style={{ fontSize: 16, color: "white" }} />
                <span className="text-[13px] font-medium text-white" style={FONT}>Copy</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Share — single full-width action */}
        <motion.button
          type="button"
          variants={sheetItem}
          onClick={share}
          className="w-full h-12 rounded-full border border-[rgba(160,160,160,0.45)] text-[#1b1b1b] flex items-center justify-center gap-2"
        >
          {shared ? <CheckIcon style={{ fontSize: 18, color: "#006a1d" }} /> : <IosShareIcon style={{ fontSize: 18 }} />}
          <span className="text-[15px] font-medium" style={FONT}>{shared ? "Shared" : "Share"}</span>
        </motion.button>

        {/* No-login / validity note */}
        <motion.p variants={sheetItem} className="text-[13px] leading-[1.4] text-[#808080]" style={FONT}>
          Anyone with this link can view and pay the invoice — no login needed. The link stays valid until the invoice is paid.
        </motion.p>
      </div>
    </BottomSheet>
    </>
  );
}

export default ShareLinkSheet;
