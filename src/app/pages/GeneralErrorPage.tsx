import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { FONT } from "../lib/theme";

interface GeneralErrorPageProps {
  /** Headline — keep generic, never raw exception text or an error code. */
  title?: string;
  /** Body copy, one or two short sentences — same rule as title. */
  message?: string;
  onBack?: () => void;
  onRetry?: () => void;
  /** When given, the secondary action reads "Contact Support" instead of the default "Go Back". */
  onContactSupport?: () => void;
}

/**
 * GeneralErrorPage — the app's one catch-all failure screen for a BLOCKING flow (a
 * non-blocking failure, e.g. one row failing to load in a list, uses the Toast "error"
 * variant instead — see components/Toast). Same icon+headline+body+ButtonDock shell as
 * DuplicateDecision's own "here's what happened" page: any screen that hits an
 * unrecoverable error routes here (Screen "generalError") rather than growing its own
 * one-off error markup.
 */
export function GeneralErrorPage({
  title = "Something went wrong",
  message = "We couldn't complete this. Please try again, or go back and try later.",
  onBack,
  onRetry,
  onContactSupport,
}: GeneralErrorPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Prototype: no real request to retry — simulate a brief attempt before handing off, so
  // the button reads as doing something rather than an instant no-op.
  const handleRetry = () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onRetry();
    }, 900);
  };

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
          <TriangleAlert size={48} strokeWidth={1.67} style={{ color: "var(--icon-error-primary)" }} />
          <div className="flex flex-col gap-2">
            <p className="card-title-lg" style={{ color: "var(--text-primary)" }}>{title}</p>
            <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>{message}</p>
          </div>
        </div>
      </div>

      <ButtonDock
        type="double"
        sticky
        primaryLabel="Retry"
        primaryLoading={retrying}
        onPrimary={handleRetry}
        secondaryLabel={onContactSupport ? "Contact Support" : "Go Back"}
        onSecondary={onContactSupport ?? onBack}
      />
    </div>
  );
}

export default GeneralErrorPage;
