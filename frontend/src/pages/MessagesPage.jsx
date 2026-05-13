import { useEffect, useState } from 'react';
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

const MessagesPage = () => {
  const { isExpert } = useAuth();
  const [params, setParams] = useSearchParams();
  const role = params.get('role') === 'expert' && isExpert ? 'expert' : 'user';
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
    if (next === 'expert') params.set('role', 'expert');
    else params.delete('role');
    setParams(params, { replace: true });
    setActiveId(null);
  };

  return (
    <div className="container-app py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl dark:text-white">
            Messages
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {role === 'expert' ? 'Inquiries from clients about your services' : 'Conversations with experts you\'ve contacted'}
          </p>
        </div>

        {isExpert && (
          <div className="inline-flex rounded-lg border border-ink-200 p-0.5 text-sm dark:border-ink-800">
            <button type="button"
              onClick={() => switchRole('user')}
              className={clsx(
                'rounded-md px-3 py-1.5 font-medium transition-colors',
                role === 'user' ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : 'text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
              )}>
              As member
            </button>
            <button type="button"
              onClick={() => switchRole('expert')}
              className={clsx(
                'rounded-md px-3 py-1.5 font-medium transition-colors',
                role === 'expert' ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : 'text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
              )}>
              As expert
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid h-[calc(100vh-16rem)] min-h-[32rem] gap-0 overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 md:grid-cols-[20rem_1fr]">
        <aside className={clsx('border-r border-ink-200 dark:border-ink-800 md:block', activeId ? 'hidden' : 'block')}>
          <div className="border-b border-ink-200 px-4 py-3 dark:border-ink-800">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white">
              Inbox <span className="text-ink-400 dark:text-ink-500">· {conversations.length}</span>
            </h2>
          </div>
          {isLoading ? (
            <div className="p-4"><RowSkeleton rows={3} /></div>
          ) : conversations.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={InboxIcon}
                title="No messages yet"
                description={role === 'expert' ? 'Inquiries from clients will land here.' : 'Open an expert profile to start a conversation.'}
              />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100 overflow-y-auto dark:divide-ink-800" style={{ maxHeight: 'calc(100% - 49px)' }}>
              {conversations.map((c) => {
                const unread = role === 'expert' ? c.unreadByExpert : c.unreadByUser;
                const isActive = c._id === activeId;
                const counterpartName = role === 'expert' ? c.userName : c.expertId?.name || 'Expert';
                const counterpartImage = role === 'expert' ? null : c.expertId?.profileImage;
                return (
                  <li key={c._id}>
                    <button type="button" onClick={() => setActiveId(c._id)}
                      className={clsx(
                        'flex w-full gap-3 p-4 text-left transition-colors',
                        isActive ? 'bg-ink-50 dark:bg-ink-800/60' : 'hover:bg-ink-50/70 dark:hover:bg-ink-800/40'
                      )}>
                      <Avatar src={counterpartImage} name={counterpartName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={clsx(
                            'truncate text-sm',
                            unread > 0 ? 'font-semibold text-ink-900 dark:text-white' : 'font-medium text-ink-700 dark:text-ink-200'
                          )}>{counterpartName}</span>
                          <span className="shrink-0 text-xs text-ink-400 dark:text-ink-500">
                            {formatRelativeTime(c.lastMessageAt)}
                          </span>
                        </div>
                        <p className={clsx(
                          'mt-0.5 line-clamp-1 text-xs',
                          unread > 0 ? 'text-ink-700 dark:text-ink-200' : 'text-ink-500 dark:text-ink-400'
                        )}>
                          {c.lastMessage?.text || c.subject || 'New conversation'}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">
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

        <section className={clsx('flex flex-col', !activeId && 'hidden md:flex')}>
          {activeId ? (
            <ConversationPanel conversationId={activeId} role={role} onBack={() => setActiveId(null)} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center">
                <MessageIcon className="mx-auto h-8 w-8 text-ink-400" />
                <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
                  Select a conversation to view messages
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const ConversationPanel = ({ conversationId, role, onBack }) => {
  const queryClient = useQueryClient();

  const { data: convo, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
    refetchOnWindowFocus: true,
  });

  const markRead = useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    if (convo) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, convo?._id]);

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
  const counterpartLabel = role === 'expert' ? convo.userEmail : `${convo.expertId?.category || ''}${convo.expertId?.company ? ` · ${convo.expertId.company}` : ''}`;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-ink-200 px-5 py-4 dark:border-ink-800">
        <button type="button" onClick={onBack}
          className="grid h-8 w-8 place-items-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 md:hidden dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <Avatar src={counterpartImage} name={counterpartName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-ink-900 dark:text-white">{counterpartName}</div>
          <div className="truncate text-xs text-ink-500 dark:text-ink-400">{counterpartLabel}</div>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50/40 p-5 dark:bg-ink-950/40">
        {convo.subject && (
          <div className="mb-2 rounded-md border border-ink-200 bg-white px-3 py-2 text-xs text-ink-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400">
            <span className="font-medium text-ink-700 dark:text-ink-300">Subject:</span> {convo.subject}
          </div>
        )}
        {convo.messages.map((m) => {
          const fromMe = m.sender === role;
          return (
            <div key={m._id} className={clsx('flex', fromMe ? 'justify-end' : 'justify-start')}>
              <div className={clsx(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card',
                fromMe
                  ? 'rounded-br-md bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                  : 'rounded-bl-md border border-ink-200 bg-white text-ink-800 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100'
              )}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                <div className={clsx('mt-1 text-[10px]', fromMe ? 'text-white/60 dark:text-ink-500' : 'text-ink-400 dark:text-ink-500')}>
                  {formatRelativeTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onReply)}
        className="flex items-center gap-2 border-t border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
        <input type="text" placeholder="Write a reply..." className="input flex-1" autoComplete="off" {...register('text')} />
        <button type="submit" disabled={replyMutation.isPending} className="btn-primary px-4" aria-label="Send">
          <SendIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </>
  );
};

export default MessagesPage;
