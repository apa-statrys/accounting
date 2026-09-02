import { useEffect, useState } from "react";
import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { FONT } from "../../lib/theme";

// Same hand-drawn globe-with-a-slash as NetworkErrorPage (Figma "[lib] Icons" node 1663:8250).
const networkErrorIcon = new URL("../../pages/network-error-icon.svg", import.meta.url).href;

interface NetworkErrorDrawerProps {
  open: boolean;
  /** Copy must name the connectivity issue specifically — same default wording as
   *  NetworkErrorPage, never a generic "something went wrong". */
  title?: string;
  message?: string;
  onClose?: () => void;
  onRetry?: () => void;
}

/**
 * NetworkErrorDrawer — the non-blocking counterpart to NetworkErrorPage: an action on the
 * CURRENT page failed because there's no connection, but the page itself stayed loaded and
 * usable underneath (unlike NetworkErrorPage, which only shows when a whole new page couldn't
 * load at all). Rendered as a sibling BottomSheet alongside the page's own JSX rather than a
 * screen navigation, so whatever the user had in progress on that page is never unmounted —
 * nothing is lost when the connection returns, per the "preserve state mid-flow" requirement.
 * Same hand-drawn icon + headline/body + single "Try Again" CTA as NetworkErrorPage, and the same
 * auto-retry-on-reconnect behavior (`online` event) with the button as manual fallback.
 */
export function NetworkErrorDrawer({
  open,
  title = "You're offline",
  message = "Check your connection and try again.",
  onClose,
  onRetry,
}: NetworkErrorDrawerProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onRetry();
    }, 900);
  };

  useEffect(() => {
    if (!open) return;
    window.addEventListener("online", handleRetry);
    return () => window.removeEventListener("online", handleRetry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onRetry]);

  return (
    <BottomSheet
      open={open}
      title=""
      onClose={onClose}
      compact
      footer={<ButtonDock type="single" primaryLabel="Try Again" primaryLoading={retrying} onPrimary={handleRetry} />}
    >
      <div className="flex flex-col gap-4">
        <img src={networkErrorIcon} alt="" width={56} height={56} />
        <div className="flex flex-col gap-2.5">
          <p className="card-title-lg" style={{ color: "var(--text-primary)" }}>{title}</p>
          <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>{message}</p>
        </div>
      </div>
    </BottomSheet>
  );
}

export default NetworkErrorDrawer;
