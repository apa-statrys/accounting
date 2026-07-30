import { useId } from "react";
import styles from "./index.module.css";

/**
 * BannerAI — design-system inline AI-generated-content callout (Figma "[APP] Design System" →
 * BannerAI, node 4649-43). Same shell recipe as ui/Banner (8px gap, 12/13px x / 10/11px y
 * padding, 12px radius) but a single fixed brand-orange border + white fill + ink text + a
 * gradient sparkle icon — no color variants (unlike Banner's info/success/warning/error). Use
 * for callouts about AI/OCR-generated content (e.g. the invoice editor's extraction-coverage
 * summary), not general status messaging — that's still ui/Banner.
 */
interface BannerAiProps {
  text: string;
}

export function BannerAI({ text }: BannerAiProps) {
  const gradientId = useId();
  return (
    <div className={styles.banner}>
      <span className={styles.icon}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M6.01293 0.544263C6.04149 0.391332 6.12265 0.253207 6.24233 0.153809C6.36201 0.0544106 6.51269 0 6.66826 0C6.82384 0 6.97452 0.0544106 7.0942 0.153809C7.21388 0.253207 7.29503 0.391332 7.3236 0.544263L8.02426 4.2496C8.07403 4.51303 8.20205 4.75534 8.39162 4.94491C8.58119 5.13448 8.8235 5.2625 9.08693 5.31226L12.7923 6.01293C12.9452 6.04149 13.0833 6.12265 13.1827 6.24233C13.2821 6.36201 13.3365 6.51269 13.3365 6.66826C13.3365 6.82384 13.2821 6.97452 13.1827 7.0942C13.0833 7.21388 12.9452 7.29503 12.7923 7.3236L9.08693 8.02426C8.8235 8.07403 8.58119 8.20205 8.39162 8.39162C8.20205 8.58119 8.07403 8.8235 8.02426 9.08693L7.3236 12.7923C7.29503 12.9452 7.21388 13.0833 7.0942 13.1827C6.97452 13.2821 6.82384 13.3365 6.66826 13.3365C6.51269 13.3365 6.36201 13.2821 6.24233 13.1827C6.12265 13.0833 6.04149 12.9452 6.01293 12.7923L5.31226 9.08693C5.2625 8.8235 5.13448 8.58119 4.94491 8.39162C4.75534 8.20205 4.51303 8.07403 4.2496 8.02426L0.544263 7.3236C0.391332 7.29503 0.253207 7.21388 0.153809 7.0942C0.0544106 6.97452 0 6.82384 0 6.66826C0 6.51269 0.0544106 6.36201 0.153809 6.24233C0.253207 6.12265 0.391332 6.04149 0.544263 6.01293L4.2496 5.31226C4.51303 5.2625 4.75534 5.13448 4.94491 4.94491C5.13448 4.75534 5.2625 4.51303 5.31226 4.2496L6.01293 0.544263Z"
            fill={`url(#${gradientId})`}
          />
          <defs>
            <linearGradient id={gradientId} x1="2.85864" y1="9.96191" x2="24.5438" y2="-4.8312" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4A15" />
              <stop offset="0.11" stopColor="#FF553A" />
              <stop offset="0.25" stopColor="#FF6264" />
              <stop offset="0.39" stopColor="#FF6C86" />
              <stop offset="0.54" stopColor="#FF74A1" />
              <stop offset="0.69" stopColor="#FF7AB4" />
              <stop offset="0.84" stopColor="#FF7DC0" />
              <stop offset="1" stopColor="#FF7FC4" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <p className={styles.text}>{text}</p>
    </div>
  );
}

export default BannerAI;
