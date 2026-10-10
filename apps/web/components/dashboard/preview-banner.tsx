export function PreviewBanner() {
  return (
    <p
      role="note"
      className="mb-6 rounded-md border border-gold-500 bg-gold-50 p-4 text-sm text-navy-900"
    >
      <strong>Interface preview.</strong> Sign-in and data storage are not built yet, so nothing
      here is saved or personal. Real, access-controlled dashboards arrive after authentication is
      implemented.
    </p>
  );
}
