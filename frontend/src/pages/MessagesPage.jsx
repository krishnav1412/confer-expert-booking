import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import {
  listConversations,
  getConversation,
  replyToConversation,
  markConversationRead,
} from '../api/messages';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { RowSkeleton } from '../components/Skeletons';
import { MessageIcon, SendIcon, ArrowLeftIcon, InboxIcon } from '../components/Icons';
import { formatRelativeTime } from '../utils/format';
import { GlowOrb } from '../components/design-system';
import { Reveal } from '../components/design-system/Motion';

const MessagesPage = () => {
  const { isExpert } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get('role') === 'expert' && isExpert ? 'expert' : 'user';
  const [activeId, setActiveId] = useState(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', role],
    queryFn: () => listConversations(role),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0]._id);
    }
  }, [conversations, activeId]);

  const switchRole = (next) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'expert') nextParams.set('role', 'expert');
    else nextParams.delete('role');
    setSearchParams(nextParams, { replace: true });
    setActiveId(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <GlowOrb color="purple" size="xl" className="absolute -left-40 top-20 opacity-40" />
      <GlowOrb color="cyan" size="lg" className="absolute right-0 bottom-0 opacity-30" />

      <div className="container-app relative z-10 py-10">
        <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ds-caption mb-2">Workspace</p>
            <h1 className="ds-headline">Messages</h1>
            <p className="ds-subtitle mt-2">
              {role === 'expert'
                ? 'Inquiries from clients about your services'
                : "Conversations with experts you've contacted"}
            </p>
          </div>

          {isExpert && (
            <div className="ds-glass-subtle inline-flex rounded-xl p-1 text-sm">
              <button
                type="button"
                onClick={() => switchRole('user')}
                className={clsx(
                  'rounded-lg px-4 py-2 font-medium transition-all',
                  role === 'user'
                    ? 'bg-brand-500 text-white shadow-glow'
                    : 'text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                )}
              >
                As member
              </button>
              <button
                type="button"
                onClick={() => switchRole('expert')}
                className={clsx(
                  'rounded-lg px-4 py-2 font-medium transition-all',
                  role === 'expert'
                    ? 'bg-brand-500 text-white shadow-glow'
                    : 'text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                )}
              >
                As expert
              </button>
            </div>
          )}
        </Reveal>

        <div className="ds-workspace mt-8 grid h-[calc(100vh-14rem)] min-h-[32rem] gap-0 md:grid-cols-[minmax(18rem,22rem)_1fr]">
          <aside
            className={clsx(
              'ds-workspace-sidebar flex flex-col md:block',
              activeId ? 'hidden' : 'block'
            )}
          >
            <div className="border-b border-white/5 px-4 py-4">
              <h2 className="text-sm font-semibold text-ink-900 dark:text-white">
                Inbox{' '}
                <span className="font-normal text-ink-400 dark:text-ink-500">· {conversations.length}</span>
              </h2>
            </div>
            {isLoading ? (
              <div className="p-4">
                <RowSkeleton rows={3} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={InboxIcon}
                  title="No messages yet"
                  description={
                    role === 'expert'
                      ? 'Inquiries from clients will land here.'
                      : 'Open an expert profile to start a conversation.'
                  }
                />
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-white/5 overflow-y-auto">
                {conversations.map((c) => {
                  const unread = role === 'expert' ? c.unreadByExpert : c.unreadByUser;
                  const isActive = c._id === activeId;
                  const counterpartName = role === 'expert' ? c.userName : c.expertId?.name || 'Expert';
                  const counterpartImage = role === 'expert' ? null : c.expertId?.profileImage;
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(c._id)}
                        className={clsx(
                          'flex w-full gap-3 p-4 text-left transition-all duration-300',
                          isActive
                            ? 'ds-workspace-active'
                            : 'hover:bg-white/[0.03] dark:hover:bg-white/[0.04]'
                        )}
                      >
                        <Avatar src={counterpartImage} name={counterpartName} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={clsx(
                                'truncate text-sm',
                                unread > 0
                                  ? 'font-semibold text-ink-900 dark:text-white'
                                  : 'font-medium text-ink-700 dark:text-ink-200'
                              )}
                            >
                              {counterpartName}
                            </span>
                            <span className="shrink-0 text-xs text-ink-400 dark:text-ink-500">
                              {formatRelativeTime(c.lastMessageAt)}
                            </span>
                          </div>
                          <p
                            className={clsx(
                              'mt-0.5 line-clamp-1 text-xs',
                              unread > 0
                                ? 'text-ink-700 dark:text-ink-200'
                                : 'text-ink-500 dark:text-ink-400'
                            )}
                          >
                            {c.lastMessage?.text || c.subject || 'New conversation'}
                          </p>
                        </div>
                        {unread > 0 && (
                          <span className="ml-2 inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white shadow-glow">
                            {unread}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className={clsx('relative flex flex-col', !activeId && 'hidden md:flex')}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent" />
            {activeId ? (
              <ConversationPanel conversationId={activeId} role={role} onBack={() => setActiveId(null)} />
            ) : (
              <div className="relative flex flex-1 flex-col items-center justify-center p-12">
                <div className="ds-spatial-card ds-edge-light max-w-sm p-10 text-center">
                  <MessageIcon className="mx-auto h-10 w-10 text-brand-400" />
                  <p className="mt-4 text-sm font-medium text-ink-700 dark:text-ink-200">
                    Select a conversation
                  </p>
                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                    Your messages appear in a focused, distraction-free workspace.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const ConversationPanel = ({ conversationId, role, onBack }) => {
  const queryClient = useQueryClient();
  const markedReadRef = useRef(null);

  const { data: convo, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
    refetchOnWindowFocus: true,
  });

  const markRead = useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      queryClient.setQueriesData({ queryKey: ['conversations'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((c) => {
          if (c._id !== conversationId) return c;
          return role === 'expert'
            ? { ...c, unreadByExpert: 0 }
            : { ...c, unreadByUser: 0 };
        });
      });
      queryClient.setQueryData(['conversation', conversationId], (old) => {
        if (!old) return old;
        return role === 'expert'
          ? { ...old, unreadByExpert: 0 }
          : { ...old, unreadByUser: 0 };
      });
    },
  });

  useEffect(() => {
    if (!convo?._id || markedReadRef.current === conversationId) return;
    const unread = role === 'expert' ? convo.unreadByExpert : convo.unreadByUser;
    if (!unread) {
      markedReadRef.current = conversationId;
      return;
    }
    markedReadRef.current = conversationId;
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, convo?._id, role]);

  const replyMutation = useMutation({
    mutationFn: (text) => replyToConversation(conversationId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err) => toast.error(err?.message || 'Could not send'),
  });

  const { register, handleSubmit, reset } = useForm({ defaultValues: { text: '' } });
  const onReply = (values) => {
    if (!values.text?.trim()) return;
    replyMutation.mutate(values.text.trim(), { onSuccess: () => reset({ text: '' }) });
  };

  if (isLoading || !convo) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-sm text-ink-500 dark:text-ink-400">Loading...</div>
      </div>
    );
  }

  const counterpartName = role === 'expert' ? convo.userName : convo.expertId?.name;
  const counterpartImage = role === 'expert' ? null : convo.expertId?.profileImage;
  const counterpartLabel =
    role === 'expert'
      ? convo.userEmail
      : `${convo.expertId?.category || ''}${convo.expertId?.company ? ` · ${convo.expertId.company}` : ''}`;

  return (
    <>
      <header className="relative z-10 flex items-center gap-3 border-b border-white/5 px-5 py-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-white/5 hover:text-ink-900 md:hidden dark:text-ink-400 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <Avatar src={counterpartImage} name={counterpartName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-ink-900 dark:text-white">{counterpartName}</div>
          <div className="truncate text-xs text-ink-500 dark:text-ink-400">{counterpartLabel}</div>
        </div>
      </header>

      <div className="relative z-10 flex-1 space-y-3 overflow-y-auto p-5">
        {convo.subject && (
          <div className="ds-glass-subtle mb-2 px-4 py-3 text-xs text-ink-500 dark:text-ink-400">
            <span className="font-medium text-ink-700 dark:text-ink-300">Subject:</span> {convo.subject}
          </div>
        )}
        {convo.messages.map((m) => {
            const fromMe = m.sender === role;
            return (
              <div
                key={m._id}
                className={clsx('flex', fromMe ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={clsx(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    fromMe
                      ? 'rounded-br-md bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-glow'
                      : 'ds-glass-subtle rounded-bl-md text-ink-800 dark:text-ink-100'
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div
                    className={clsx(
                      'mt-1 text-[10px]',
                      fromMe ? 'text-white/60' : 'text-ink-400 dark:text-ink-500'
                    )}
                  >
                    {formatRelativeTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <form
        onSubmit={handleSubmit(onReply)}
        className="relative z-10 flex items-center gap-2 border-t border-white/5 bg-[rgb(var(--ds-glass-bg))]/80 p-4 backdrop-blur-xl"
      >
        <input
          type="text"
          placeholder="Write a reply..."
          className="input flex-1 border-white/10 bg-white/5"
          autoComplete="off"
          {...register('text')}
        />
        <button type="submit" disabled={replyMutation.isPending} className="ds-btn-primary px-4" aria-label="Send">
          <SendIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </>
  );
};

export default MessagesPage;
