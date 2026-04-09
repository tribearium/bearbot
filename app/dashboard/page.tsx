import { redirect } from 'next/navigation';
import { createServerSessionClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import type { Conversation } from '@/types';

export default async function DashboardPage() {
  const supabase = await createServerSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  return (
    <DashboardClient
      initialConversations={(conversations as Conversation[]) ?? []}
    />
  );
}
