/** Country calling codes for the phone-field prefix picker (Figma "Select Country Code").
 *  Same country set as components/CountrySheet, plus each one's dial code. Flag icons are
 *  looked up by `name` via components/CountryFlag — never emoji (design rule, no emoji anywhere). */
export interface CountryCode {
  name: string;
  dialCode: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { name: "Singapore", dialCode: "+65" },
  { name: "Hong Kong", dialCode: "+852" },
  { name: "United States", dialCode: "+1" },
  { name: "United Kingdom", dialCode: "+44" },
  { name: "Australia", dialCode: "+61" },
  { name: "Canada", dialCode: "+1" },
  { name: "Germany", dialCode: "+49" },
  { name: "France", dialCode: "+33" },
  { name: "Netherlands", dialCode: "+31" },
  { name: "India", dialCode: "+91" },
  { name: "Japan", dialCode: "+81" },
  { name: "China", dialCode: "+86" },
  { name: "Malaysia", dialCode: "+60" },
  { name: "Indonesia", dialCode: "+62" },
  { name: "Thailand", dialCode: "+66" },
  { name: "United Arab Emirates", dialCode: "+971" },
];

export const DEFAULT_COUNTRY_CODE = COUNTRY_CODES.find((c) => c.name === "United States")!;
