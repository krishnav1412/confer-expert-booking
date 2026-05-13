import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { MailIcon, MessageIcon, HelpIcon, CheckCircleIcon, ChevronDownIcon } from '../components/Icons';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email('Enter a valid email'),
  topic: z.string().min(1, 'Pick a topic'),
  message: z.string().trim().min(20, 'Tell us a bit more (at least 20 characters)').max(2000),
});

const FAQS = [
  { q: 'How does payment work on Confer?', a: 'Bookings are charged at the time of confirmation. We hold the payment and release it to the expert after the session has been completed. Cancellations made at least 24 hours in advance are credited back to your next booking.' },
  { q: 'Can I reschedule a confirmed session?', a: 'Yes. You can reschedule a session once for free up to 12 hours before the start time.' },
  { q: 'How are experts vetted?', a: 'Every expert applies through our onboarding flow and is reviewed by our curation team. We verify experience, reputation, and references before a profile goes live.' },
  { q: 'What if I don\'t get value from a session?', a: 'Reach out to support within 7 days of the session. If we agree the session didn\'t deliver, we offer either a full refund or a free re-booking with a different expert.' },
  { q: 'Do you offer team or company plans?', a: 'Yes. Reach out via the form below and pick "Partnerships" — we\'ll set up a custom plan for teams of 5 or more.' },
];

const ContactPage = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', topic: '', message: '' },
  });

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
    }
  }, [user, setValue]);

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
    toast.success('Message sent. We\'ll be in touch soon.');
    reset({ name: user?.name || '', email: user?.email || '', topic: '', message: '' });
  };

  return (
    <div>
      <section className="border-b border-ink-200/70 bg-white dark:border-ink-800/70 dark:bg-ink-950">
        <div className="container-app py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
              We're here to help
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl dark:text-white">
              Get in touch
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-500 sm:text-lg dark:text-ink-400">
              Questions about a booking, partnership ideas, or feedback on the platform — we read every message and reply within one business day.
            </p>
          </div>
        </div>
      </section>

      <section className="container-app py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <ContactCard icon={MailIcon} title="Email us directly"
              body={<a href="mailto:agarwalkrishnav34@gmail.com"
                className="text-ink-900 underline-offset-4 hover:underline dark:text-white">agarwalkrishnav34@gmail.com</a>} />
            <ContactCard icon={MessageIcon} title="Support response time"
              body="Within 1 business day for support queries. Same-day for booking issues." />
            <ContactCard icon={HelpIcon} title="Self-serve help"
              body={<>Most answers are in the FAQ below. Take a quick look first — it's faster.</>} />
          </aside>

          <div className="space-y-10 lg:col-span-2">
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Send us a message</h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">We typically respond within one business day.</p>

              {submitted && (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-semibold text-emerald-900 dark:text-emerald-200">Thanks — your message is in.</div>
                    <p className="mt-0.5 text-emerald-800/80 dark:text-emerald-300/80">We'll reply by email shortly.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name" error={errors.name?.message}>
                    <input className="input" placeholder="Aarav Mehta" {...register('name')} />
                  </Field>
                  <Field label="Your email" error={errors.email?.message}>
                    <input type="email" className="input" placeholder="aarav@company.com" {...register('email')} />
                  </Field>
                </div>
                <Field label="Topic" error={errors.topic?.message}>
                  <select className="input" {...register('topic')}>
                    <option value="">Pick a topic</option>
                    <option>General question</option>
                    <option>Booking issue</option>
                    <option>Becoming an expert</option>
                    <option>Partnerships</option>
                    <option>Press / media</option>
                    <option>Feedback</option>
                  </select>
                </Field>
                <Field label="Your message" error={errors.message?.message}>
                  <textarea rows={6} className="input resize-none" placeholder="How can we help?" {...register('message')} />
                </Field>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[10rem]">
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </form>
            </div>

            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <HelpIcon className="h-5 w-5 text-ink-500 dark:text-ink-400" />
                <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Frequently asked questions</h2>
              </div>
              <div className="mt-5 divide-y divide-ink-100 border-y border-ink-100 dark:divide-ink-800 dark:border-ink-800">
                {FAQS.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div key={i}>
                      <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : i)}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left" aria-expanded={isOpen}>
                        <span className="text-sm font-medium text-ink-900 dark:text-white">{faq.q}</span>
                        <ChevronDownIcon className={clsx('h-4 w-4 shrink-0 text-ink-400 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen && <p className="pb-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{faq.a}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ContactCard = ({ icon: Icon, title, body }) => (
  <div className="card p-5">
    <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
      <Icon className="h-4 w-4" />
    </div>
    <h3 className="mt-3 text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
    <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{body}</p>
  </div>
);

const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

export default ContactPage;
