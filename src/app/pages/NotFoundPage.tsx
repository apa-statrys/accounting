import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { FONT } from "../lib/theme";

// Same hand-drawn warning-triangle illustration as GeneralErrorPage/DuplicateDecision/
// UploadErrorDialog (Figma "Sales Invoice — Client" node 1959-11709) — one shared icon for
// every "something's wrong" moment, not a second one just for this state.
const warningTriangleIcon = new URL("./duplicate-decision-warning.svg", import.meta.url).href;

interface NotFoundPageProps {
  /** Context-specific headline — e.g. "This invoice is no longer available", never a generic
   *  "404 - Not Found". Only ever shown once the server has actually confirmed the resource is
   *  gone (expired invoice link, deleted customer, …) — not a loading/unknown state. */
  title?: string;
  /** Body copy, one short sentence — same context-specific rule as title. */
  message?: string;
  /** The only action: route somewhere useful (e.g. back to the register the resource belonged
   *  to), never back to the dead resource itself. */
  onBack?: () => void;
}

/**
 * NotFoundPage — the app's "this specific thing doesn't exist" state, distinct from
 * GeneralErrorPage's catch-all failure: no Retry (there's nothing to retry — the resource is
 * confirmed gone), a single "Go Back" action instead of a double dock. Same shell/icon as
 * GeneralErrorPage for a consistent visual language across every "Error States" screen.
 */
export function NotFoundPage({
  title = "This item is no longer available",
  message = "It may have been deleted, or the link you used has expired.",
  onBack,
}: NotFoundPageProps) {
  return (
    <div className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div className="flex-1 overflow-y-auto bg-[var(--bg-neutral-tertiary)] flex flex-col">
        <PageAppHeader scrolled={false}>
          <PageHeader type="center" showBack={false} showSearch={false} />
        </PageAppHeader>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 pb-44 text-center">
          <img src={warningTriangleIcon} alt="" width={52} height={49} />
          <div className="flex flex-col gap-2">
            <p className="card-title-lg" style={{ color: "var(--text-primary)" }}>{title}</p>
            <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>{message}</p>
          </div>
        </div>
      </div>

      <ButtonDock type="single" sticky primaryLabel="Go Back" onPrimary={onBack} />
    </div>
  );
}

export default NotFoundPage;
