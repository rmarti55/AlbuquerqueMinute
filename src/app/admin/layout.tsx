import { currentUser } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/admin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!isAdminEmail(email)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Forbidden</h1>
        <p className="mt-2 text-sm text-zinc-600">
          This admin dashboard is restricted to{' '}
          <span className="font-medium">{process.env.ADMIN_EMAIL ?? 'the configured admin'}</span>.
        </p>
        {email && (
          <p className="mt-4 text-xs text-zinc-500">
            Signed in as {email}
          </p>
        )}
      </main>
    );
  }

  return children;
}
