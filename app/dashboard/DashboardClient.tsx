'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Conversation, Message } from '@/types';

interface Props {
  initialConversations: Conversation[];
}

export default function DashboardClient({ initialConversations }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedId,    setSelectedId]    = useState<string | null>(
    initialConversations[0]?.id ?? null
  );
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [loadingMsg,  setLoadingMsg]  = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingMsg(true);

    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoadingMsg(false);
      });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription — re-subscribe when selectedId changes
  useEffect(() => {
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message;

          // Append to thread if it belongs to the currently visible conversation
          if (newMessage.conversation_id === selectedId) {
            setMessages((prev) => [...prev, newMessage]);
          }

          // Bubble the conversation to the top of the sidebar
          setConversations((prev) => {
            const match = prev.find((c) => c.id === newMessage.conversation_id);
            if (!match) return prev;
            const updated = { ...match, updated_at: newMessage.created_at };
            return [updated, ...prev.filter((c) => c.id !== updated.id)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function formatTime(iso: string): string {
    const d   = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* ---- Sidebar ---- */}
      <aside className="w-80 flex-shrink-0 bg-surface-1 border-r border-surface-3 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-surface-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">Tribearium Agent</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1
                       rounded hover:bg-surface-3"
          >
            Sign out
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-10 px-4">
              No conversations yet. Messages will appear here when users write via WhatsApp.
            </p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-surface-3 transition-colors
                          hover:bg-surface-2
                          ${
                            selectedId === conv.id
                              ? 'bg-surface-2 border-l-2 border-l-brand'
                              : 'border-l-2 border-l-transparent'
                          }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white truncate">
                  +{conv.phone_number}
                </span>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {formatTime(conv.updated_at)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(conv.created_at).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* ---- Message thread ---- */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Thread header */}
            <div className="px-6 py-4 border-b border-surface-3 bg-surface-1">
              <p className="text-sm font-semibold text-white">
                +{selectedConversation.phone_number}
              </p>
              <p className="text-xs text-gray-500">WhatsApp conversation</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loadingMsg && (
                <p className="text-gray-500 text-sm text-center mt-10">
                  Loading messages…
                </p>
              )}
              {!loadingMsg && messages.length === 0 && (
                <p className="text-gray-500 text-sm text-center mt-10">
                  No messages yet.
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'assistant' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'assistant'
                        ? 'bg-brand text-white rounded-br-sm'
                        : 'bg-surface-3 text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === 'assistant' ? 'text-indigo-200' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-sm">
              Select a conversation to view messages
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
