/**
 * ─────────────────────────────────────────────────────────────
 *  BRAND CONFIG  —  edit this file to white-label the platform
 * ─────────────────────────────────────────────────────────────
 *
 *  After changing values here, ALL five apps update automatically:
 *    • Public website (greens-landscape)
 *    • Client Portal
 *    • Worker Portal
 *    • Sub Dispatch Portal
 *    • API server meta
 *
 *  Logo: replace /public/logo.png inside each artifact folder
 *        (artifacts/greens-landscape/public/logo.png, etc.)
 *        — same filename, no code changes needed.
 * ─────────────────────────────────────────────────────────────
 */

export const brand = {
  /** Full business name shown in headers, footers, and page titles */
  name: "Southern Roots Turf",

  /** Shorter version used in tight spaces */
  shortName: "Southern Roots",

  /** One-line description of the business */
  tagline: "Professional Landscaping & Pressure Washing",

  /** Longer description used in hero sections */
  description:
    "Georgia's premier landscaping and outdoor services marketplace — powered by smart dispatch, live tracking, and instant invoicing.",

  /** Customer-facing phone number */
  phone: "(678) 555-0199",

  /** tel: href for the phone number */
  phoneHref: "tel:6785550199",

  /** Contact email */
  email: "hello@southernrootsturf.com",

  /** Service area shown in nav and footer */
  location: "Serving Georgia & Surrounding Areas",

  /** Alt text for the logo <img> tag */
  logoAlt: "Southern Roots Turf",

  /** Copyright holder (usually same as name) */
  copyrightHolder: "Southern Roots Turf",
} as const;

export type Brand = typeof brand;
