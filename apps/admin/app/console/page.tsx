import Link from 'next/link';

export const metadata = { title: 'Console' };

export default function ConsolePage() {
  return (
    <section>
      <h1 className="font-serif text-3xl font-bold text-navy-900">Admin console</h1>
      <p className="mt-3 max-w-2xl text-navy-800">
        You are signed in with a platform administrator account.
      </p>
      <ul className="mt-6 space-y-2">
        <li>
          <Link
            href="/console/content"
            className="font-semibold text-navy-900 underline underline-offset-4"
          >
            Website content
          </Link>{' '}
          <span className="text-navy-700">
            FAQ, section pages, legal pages, membership and subscription.
          </span>
        </li>
      </ul>
    </section>
  );
}
