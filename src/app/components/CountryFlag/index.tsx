import { USFlag } from "../../ui/TextField/USFlag";

/**
 * Rounded country flags — the emoji-free replacement for the phone/address Country pickers'
 * flag emoji (Figma "Sales Invoice - Client" TextField/Tile flag slot expects an SVG icon like
 * `<USFlag />`, not a text emoji; see ui/TextField/USFlag.tsx). Same simplified-but-recognizable
 * style as USFlag: a 20x20 viewBox clipped to a circle. Covers the 15-country set shared by
 * data/countryCodes.ts and components/CountrySheet, "European Union"/Switzerland/New Zealand
 * entries for currencies with no matching country picker entry (see components/CurrencySheet's
 * CURRENCY_COUNTRY map — 11 supported currencies), and Brazil/Ireland/Italy/Mexico/Spain for
 * InvoiceSettings' Business Address country list (added 2026-07-28 replacing an emoji fallback).
 */

type FlagProps = { size?: number };

function SingaporeFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#sg-flag-clip)">
        <rect width="20" height="10" fill="#D80027" />
        <rect y="10" width="20" height="10" fill="#F0F0F0" />
        <circle cx="6" cy="5" r="2.6" fill="#F0F0F0" />
        <circle cx="7" cy="5" r="2.2" fill="#D80027" />
        <circle cx="9.2" cy="3.6" r="0.5" fill="#F0F0F0" />
        <circle cx="10.6" cy="4.6" r="0.5" fill="#F0F0F0" />
        <circle cx="10.1" cy="6.2" r="0.5" fill="#F0F0F0" />
        <circle cx="8.6" cy="6.4" r="0.5" fill="#F0F0F0" />
      </g>
      <defs>
        <clipPath id="sg-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function HongKongFlag({ size = 20 }: FlagProps) {
  const petalAngles = [0, 72, 144, 216, 288];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#hk-flag-clip)">
        <rect width="20" height="20" fill="#D80027" />
        {petalAngles.map((a) => (
          <ellipse key={a} cx="10" cy="6.2" rx="1.6" ry="3.2" fill="#F0F0F0" transform={`rotate(${a} 10 10)`} />
        ))}
      </g>
      <defs>
        <clipPath id="hk-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function UnitedKingdomFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#gb-flag-clip)">
        <rect width="20" height="20" fill="#00247D" />
        <path d="M0 0L20 20M20 0L0 20" stroke="#F0F0F0" strokeWidth="3" />
        <path d="M0 0L20 20M20 0L0 20" stroke="#D80027" strokeWidth="1.2" />
        <path d="M10 0V20M0 10H20" stroke="#F0F0F0" strokeWidth="4.5" />
        <path d="M10 0V20M0 10H20" stroke="#D80027" strokeWidth="2.2" />
      </g>
      <defs>
        <clipPath id="gb-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function AustraliaFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#au-flag-clip)">
        <rect width="20" height="20" fill="#00247D" />
        <path d="M1 1L9 7M9 1L1 7" stroke="#F0F0F0" strokeWidth="1" />
        <path d="M5 1V7M1 4H9" stroke="#F0F0F0" strokeWidth="1.4" />
        <path d="M5 1V7M1 4H9" stroke="#D80027" strokeWidth="0.7" />
        <circle cx="4.5" cy="14.5" r="1.1" fill="#F0F0F0" />
        <circle cx="9" cy="16.5" r="0.7" fill="#F0F0F0" />
        <circle cx="13" cy="14" r="0.7" fill="#F0F0F0" />
        <circle cx="12" cy="17.5" r="0.6" fill="#F0F0F0" />
        <circle cx="15.5" cy="6" r="0.9" fill="#F0F0F0" />
      </g>
      <defs>
        <clipPath id="au-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function CanadaFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#ca-flag-clip)">
        <rect width="20" height="20" fill="#F0F0F0" />
        <rect width="6" height="20" fill="#D80027" />
        <rect x="14" width="6" height="20" fill="#D80027" />
        <path d="M10 6L11 9H13.5L11.5 10.8L12.2 13.5L10 12L7.8 13.5L8.5 10.8L6.5 9H9L10 6Z" fill="#D80027" />
      </g>
      <defs>
        <clipPath id="ca-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function GermanyFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#de-flag-clip)">
        <rect width="20" height="6.67" fill="#000000" />
        <rect y="6.67" width="20" height="6.67" fill="#D80027" />
        <rect y="13.33" width="20" height="6.67" fill="#FFDA44" />
      </g>
      <defs>
        <clipPath id="de-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function FranceFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#fr-flag-clip)">
        <rect width="20" height="20" fill="#F0F0F0" />
        <rect width="6.67" height="20" fill="#0052B4" />
        <rect x="13.33" width="6.67" height="20" fill="#D80027" />
      </g>
      <defs>
        <clipPath id="fr-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function NetherlandsFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#nl-flag-clip)">
        <rect width="20" height="6.67" fill="#D80027" />
        <rect y="6.67" width="20" height="6.67" fill="#F0F0F0" />
        <rect y="13.33" width="20" height="6.67" fill="#0052B4" />
      </g>
      <defs>
        <clipPath id="nl-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function IndiaFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#in-flag-clip)">
        <rect width="20" height="6.67" fill="#FF9933" />
        <rect y="6.67" width="20" height="6.67" fill="#F0F0F0" />
        <rect y="13.33" width="20" height="6.67" fill="#138808" />
        <circle cx="10" cy="10" r="1.8" fill="none" stroke="#0052B4" strokeWidth="0.5" />
        <circle cx="10" cy="10" r="0.4" fill="#0052B4" />
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1="10" y1="8.2" x2="10" y2="11.8" stroke="#0052B4" strokeWidth="0.35" transform={`rotate(${a} 10 10)`} />
        ))}
      </g>
      <defs>
        <clipPath id="in-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function JapanFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#jp-flag-clip)">
        <rect width="20" height="20" fill="#F0F0F0" />
        <circle cx="10" cy="10" r="4.5" fill="#D80027" />
      </g>
      <defs>
        <clipPath id="jp-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function ChinaFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#cn-flag-clip)">
        <rect width="20" height="20" fill="#D80027" />
        <path d="M7 5L8 7.2H10.4L8.5 8.7L9.2 11L7 9.6L4.8 11L5.5 8.7L3.6 7.2H6L7 5Z" fill="#FFDA44" />
        <circle cx="12" cy="4.5" r="0.55" fill="#FFDA44" />
        <circle cx="13.5" cy="6.5" r="0.55" fill="#FFDA44" />
        <circle cx="13.5" cy="9.2" r="0.55" fill="#FFDA44" />
        <circle cx="12" cy="11.2" r="0.55" fill="#FFDA44" />
      </g>
      <defs>
        <clipPath id="cn-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function MalaysiaFlag({ size = 20 }: FlagProps) {
  const stripeH = 20 / 7;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#my-flag-clip)">
        <rect width="20" height="20" fill="#F0F0F0" />
        {[0, 2, 4, 6].map((i) => (
          <rect key={i} y={i * stripeH} width="20" height={stripeH} fill="#D80027" />
        ))}
        <rect width="11" height="10" fill="#0052B4" />
        <circle cx="5.5" cy="5" r="2.6" fill="#FFDA44" />
        <circle cx="6.6" cy="5" r="2.2" fill="#0052B4" />
        <path d="M9 3.6L9.5 4.9H10.9L9.8 5.7L10.2 7L9 6.2L7.8 7L8.2 5.7L7.1 4.9H8.5L9 3.6Z" fill="#FFDA44" />
      </g>
      <defs>
        <clipPath id="my-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function IndonesiaFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#id-flag-clip)">
        <rect width="20" height="10" fill="#D80027" />
        <rect y="10" width="20" height="10" fill="#F0F0F0" />
      </g>
      <defs>
        <clipPath id="id-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function ThailandFlag({ size = 20 }: FlagProps) {
  const stripeH = 20 / 5;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#th-flag-clip)">
        <rect width="20" height="20" fill="#F0F0F0" />
        <rect y={0} width="20" height={stripeH} fill="#D80027" />
        <rect y={stripeH * 3} width="20" height={stripeH} fill="#F0F0F0" />
        <rect y={stripeH * 4} width="20" height={stripeH} fill="#D80027" />
        <rect y={stripeH} width="20" height={stripeH * 2} fill="#0052B4" />
      </g>
      <defs>
        <clipPath id="th-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function UnitedArabEmiratesFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#ae-flag-clip)">
        <rect x="5" width="15" height="6.67" fill="#009E49" />
        <rect x="5" y="6.67" width="15" height="6.67" fill="#F0F0F0" />
        <rect x="5" y="13.33" width="15" height="6.67" fill="#000000" />
        <rect width="5" height="20" fill="#D80027" />
      </g>
      <defs>
        <clipPath id="ae-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function SwitzerlandFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#ch-flag-clip)">
        <rect width="20" height="20" fill="#D80027" />
        <rect x="8.5" y="4.5" width="3" height="11" fill="#F0F0F0" />
        <rect x="4.5" y="8.5" width="11" height="3" fill="#F0F0F0" />
      </g>
      <defs>
        <clipPath id="ch-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function NewZealandFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#nz-flag-clip)">
        <rect width="20" height="20" fill="#00247D" />
        <path d="M1 1L9 7M9 1L1 7" stroke="#F0F0F0" strokeWidth="1" />
        <path d="M5 1V7M1 4H9" stroke="#F0F0F0" strokeWidth="1.4" />
        <path d="M5 1V7M1 4H9" stroke="#D80027" strokeWidth="0.7" />
        <circle cx="13" cy="4.5" r="0.8" fill="#F0F0F0" />
        <circle cx="16.5" cy="8" r="1" fill="#F0F0F0" />
        <circle cx="13.5" cy="12" r="1" fill="#F0F0F0" />
        <circle cx="17" cy="14.5" r="0.7" fill="#F0F0F0" />
      </g>
      <defs>
        <clipPath id="nz-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function BrazilFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#br-flag-clip)">
        <rect width="20" height="20" fill="#6DA544" />
        <path d="M10 3L18 10L10 17L2 10L10 3Z" fill="#FFDA44" />
        <circle cx="10" cy="10" r="3.6" fill="#0052B4" />
        <path d="M6.8 9.2C8.5 8.2 11.5 8.2 13.2 9.6" stroke="#F0F0F0" strokeWidth="0.6" fill="none" />
      </g>
      <defs>
        <clipPath id="br-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function IrelandFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#ie-flag-clip)">
        <rect width="20" height="20" fill="#F0F0F0" />
        <rect width="6.67" height="20" fill="#6DA544" />
        <rect x="13.33" width="6.67" height="20" fill="#FF9811" />
      </g>
      <defs>
        <clipPath id="ie-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function ItalyFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#it-flag-clip)">
        <rect width="20" height="20" fill="#F0F0F0" />
        <rect width="6.67" height="20" fill="#6DA544" />
        <rect x="13.33" width="6.67" height="20" fill="#D80027" />
      </g>
      <defs>
        <clipPath id="it-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function MexicoFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#mx-flag-clip)">
        <rect width="20" height="20" fill="#F0F0F0" />
        <rect width="6.67" height="20" fill="#6DA544" />
        <rect x="13.33" width="6.67" height="20" fill="#D80027" />
        <circle cx="10" cy="10" r="1.8" fill="#6DA544" />
      </g>
      <defs>
        <clipPath id="mx-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function SpainFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#es-flag-clip)">
        <rect width="20" height="5" fill="#D80027" />
        <rect y="5" width="20" height="10" fill="#FFDA44" />
        <rect y="15" width="20" height="5" fill="#D80027" />
        <rect x="6" y="7" width="4" height="6" rx="0.6" fill="#D80027" />
      </g>
      <defs>
        <clipPath id="es-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

function EuropeanUnionFlag({ size = 20 }: FlagProps) {
  const starAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <g clipPath="url(#eu-flag-clip)">
        <rect width="20" height="20" fill="#0052B4" />
        {starAngles.map((a) => (
          <circle key={a} cx="10" cy="4.2" r="0.6" fill="#FFDA44" transform={`rotate(${a} 10 10)`} />
        ))}
      </g>
      <defs>
        <clipPath id="eu-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
      </defs>
    </svg>
  );
}

/** Fallback for a country outside the mapped set — a neutral globe glyph, never emoji. */
function DefaultFlag({ size = 20 }: FlagProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#E5E5E5" />
      <circle cx="10" cy="10" r="7" stroke="#A0A0A0" strokeWidth="1" fill="none" />
      <path d="M3 10H17M10 3C12 5.5 12 14.5 10 17M10 3C8 5.5 8 14.5 10 17" stroke="#A0A0A0" strokeWidth="1" fill="none" />
    </svg>
  );
}

const FLAG_COMPONENTS: Record<string, (props: FlagProps) => React.ReactElement> = {
  Singapore: SingaporeFlag,
  "Hong Kong": HongKongFlag,
  "United States": USFlag,
  "United Kingdom": UnitedKingdomFlag,
  Australia: AustraliaFlag,
  Canada: CanadaFlag,
  Germany: GermanyFlag,
  France: FranceFlag,
  Netherlands: NetherlandsFlag,
  India: IndiaFlag,
  Japan: JapanFlag,
  China: ChinaFlag,
  Malaysia: MalaysiaFlag,
  Indonesia: IndonesiaFlag,
  Thailand: ThailandFlag,
  "United Arab Emirates": UnitedArabEmiratesFlag,
  "European Union": EuropeanUnionFlag,
  Switzerland: SwitzerlandFlag,
  "New Zealand": NewZealandFlag,
  Brazil: BrazilFlag,
  Ireland: IrelandFlag,
  Italy: ItalyFlag,
  Mexico: MexicoFlag,
  Spain: SpainFlag,
};

/** Looks up a rounded flag icon by country name (the same names used in data/countryCodes.ts
 *  and components/CountrySheet) — falls back to a neutral globe glyph for anything unmapped. */
export function CountryFlag({ name, size = 20 }: { name: string; size?: number }) {
  const Flag = FLAG_COMPONENTS[name] ?? DefaultFlag;
  return <Flag size={size} />;
}

export default CountryFlag;
