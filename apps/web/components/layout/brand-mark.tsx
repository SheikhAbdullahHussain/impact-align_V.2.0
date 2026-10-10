/** Simple monogram mark (decorative; the adjacent text names the brand). */
export function BrandMark({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" rx="8" fill="#0f2040" />
      <path
        d="M8 22 16 8l8 14"
        fill="none"
        stroke="#e0b94a"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="22" r="2.4" fill="#e0b94a" />
    </svg>
  );
}
