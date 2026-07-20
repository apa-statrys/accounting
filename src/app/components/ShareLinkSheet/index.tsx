import { useState } from "react";
import { motion } from "motion/react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IosShareIcon from "@mui/icons-material/IosShare";
import CheckIcon from "@mui/icons-material/Check";
import LinkIcon from "@mui/icons-material/Link";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { DemoShareSheet } from "../DemoShareSheet";

import styles from "./index.module.css";

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
  // Scrim tap: dismiss only — copying a link never marks the invoice sent (stays a draft).
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
      <div className={styles.root}>
        {/* Link field — the single copy affordance (tap field or icon) */}
        <motion.div variants={sheetItem} className={styles.linkField}>
          <LinkIcon className={styles.linkIcon} />
          <button type="button" onClick={copy} className={`${styles.linkText} body-sm`}>
            {link}
          </button>
          <button
            type="button"
            onClick={copy}
            className={styles.copyButton}
            data-copied={copied}
          >
            {copied ? (
              <>
                <CheckIcon className={styles.copyIconCopied} />
                <span className={styles.copyLabelCopied}>Copied</span>
              </>
            ) : (
              <>
                <ContentCopyIcon className={styles.copyIcon} />
                <span className={styles.copyLabel}>Copy</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Share — single full-width action */}
        <motion.button
          type="button"
          variants={sheetItem}
          onClick={share}
          className={styles.shareButton}
        >
          {shared ? <CheckIcon className={styles.shareIconShared} /> : <IosShareIcon className={styles.shareIcon} />}
          <span className={styles.shareLabel}>{shared ? "Shared" : "Share"}</span>
        </motion.button>

        {/* No-login / validity note */}
        <motion.p variants={sheetItem} className={styles.note}>
          Anyone with this link can view and pay the invoice — no login needed. The link stays valid until the invoice is paid.
        </motion.p>
      </div>
    </BottomSheet>
    </>
  );
}

export default ShareLinkSheet;
