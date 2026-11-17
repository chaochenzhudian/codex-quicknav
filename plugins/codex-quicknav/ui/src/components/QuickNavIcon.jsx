/** Cloud mark used at the top of the page and by the plugin listing. */
export function CloudMark({ className = "h-16 w-16" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 45.5h25a10.5 10.5 0 0 0 2.2-20.77A14.6 14.6 0 0 0 21.7 20.9 11.7 11.7 0 0 0 20.5 45.5Z" />
      <circle cx="33.4" cy="31.4" r="4.6" />
      <path d="M27.4 40.2h12" />
    </svg>
  );
}

/** Thin-line compass glyph that matches Codex's rail icons. */
export function CompassGlyph({ className = "h-[18px] w-[18px]", strokeWidth = 1.9 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.4 8.6-1.8 5-5 1.8 1.8-5z" />
    </svg>
  );
}

export function PlusGlyph({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseGlyph({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}
