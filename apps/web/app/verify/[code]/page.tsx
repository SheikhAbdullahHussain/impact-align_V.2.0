import type { Metadata } from 'next';
import { VerifyResult } from '@/components/verification/verify-result';

export const metadata: Metadata = {
  title: 'Verify certificate',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <VerifyResult code={code} />
    </main>
  );
}
