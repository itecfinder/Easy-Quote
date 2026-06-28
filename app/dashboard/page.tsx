import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AppShell } from '@/components/app/app-shell';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <AppShell session={session} />;
}
