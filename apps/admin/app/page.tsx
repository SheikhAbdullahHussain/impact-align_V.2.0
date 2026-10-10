import { Container } from '@impactalign/ui';

export default function AdminHomePage() {
  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl font-bold text-navy-900">ImpactAlign Admin</h1>
      <p
        role="note"
        className="mt-6 max-w-2xl rounded-md border border-gold-500 bg-gold-400/10 p-4"
      >
        Placeholder. Admin functionality is separate from the public site and will only be available
        after authentication and role-based authorization are implemented. Do not expose this
        application publicly until then.
      </p>
    </Container>
  );
}
