import { useEffect, useState } from "react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { FONT } from "../lib/theme";

// Figma "[lib] Icons" (node 1663:8250, "Worldwide-Web-Disable--Streamline-Freehand-Duotone") —
// hand-drawn globe-with-a-slash, same freehand duotone style as the shared warning-triangle icon.
const networkErrorIcon = new URL("./network-error-icon.svg", import.meta.url).href;

interface NetworkErrorPageProps {
  /** Copy must name the connectivity issue specifically — "You're offline"/"Check your
   *  connection", never GeneralErrorPage's generic "Something went wrong" wording. */
  title?: string;
  message?: string;
  onBack?: () => void;
  onRetry?: () => void;
}

/**
 * NetworkErrorPage — same template as GeneralErrorPage (header back chevron, hand-drawn icon,
 * headline+body, single sticky "Try Again" CTA), but a distinct state: only for a whole new page
 * that couldn't load because there's no connection at all (opening a page while already offline,
 * or navigating to one and it fails to load) — never for a server-side 4xx/5xx, which stays
 * GeneralErrorPage's job. A same-page action failing while the current page stays usable is
 * NetworkErrorDrawer's job instead (`components/NetworkErrorDrawer`), not this full page — nothing
 * on this page has state worth preserving since it never finished loading in the first place.
 * Auto-retries the instant the browser reports connectivity restored (`online` event); the "Try
 * Again" button is the manual fallback for browsers/situations where that event doesn't fire.
 */
export function NetworkErrorPage({
  title = "You're offline",
  message = "Check your connection and try again.",
  onBack,
  onRetry,
}: NetworkErrorPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Prototype: no real request to retry — simulate a brief attempt before handing off, so
  // the button (and the auto-retry below) both read as doing something, not an instant no-op.
  const handleRetry = () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onRetry();
    }, 900);
  };

  useEffect(() => {
    window.addEventListener("online", handleRetry);
    return () => window.removeEventListener("online", handleRetry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRetry]);

  return (
    <div className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto bg-[var(--bg-neutral-tertiary)] flex flex-col"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader type="center" onBack={onBack} showSearch={false} />
        </PageAppHeader>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 pb-44 text-center">
          <img src={networkErrorIcon} alt="" width={56} height={56} />
          <div className="flex flex-col gap-2">
            <p className="card-title-lg" style={{ color: "var(--text-primary)" }}>{title}</p>
            <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>{message}</p>
          </div>
        </div>
      </div>

      <ButtonDock type="single" sticky primaryLabel="Try Again" primaryLoading={retrying} onPrimary={handleRetry} />
    </div>
  );
}

export default NetworkErrorPage;
