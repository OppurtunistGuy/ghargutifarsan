import { useId, useState, type FormEvent } from 'react';
import { Check, Clock3, Copy, Mail, MapPin, MessageCircle, Truck, type LucideIcon } from 'lucide-react';
import { Container } from '../components/Container';
import { SectionHeading } from '../components/SectionHeading';
import { PendingChip } from '../components/Placeholder';
import { Button } from '../components/ui/button';
import { fieldClass } from '../components/ui/field';
import { business, isWhatsAppConfigured } from '../config/business';
import { buildEnquiryMessage, whatsappUrl } from '../lib/order';
import { useCopy } from '../lib/useCopy';

interface Row { icon: LucideIcon; label: string; value: string | null; href?: string }

function formatWhatsApp(number: string) {
  return number.startsWith('91') && number.length === 12 ? `+91 ${number.slice(2, 7)} ${number.slice(7)}` : `+${number}`;
}

export function ContactPage() {
  const whatsapp = isWhatsAppConfigured(business.whatsappNumber) ? business.whatsappNumber : null;
  const rows: Row[] = [
    { icon: MessageCircle, label: 'WhatsApp', value: whatsapp && formatWhatsApp(whatsapp), href: whatsapp ? `https://wa.me/${whatsapp}` : undefined },
    { icon: Mail, label: 'Email', value: business.email, href: business.email ? `mailto:${business.email}` : undefined },
    { icon: MapPin, label: 'Kitchen location', value: business.address },
    { icon: Truck, label: 'Delivery areas', value: business.deliveryInformation ?? business.serviceArea },
    { icon: Clock3, label: 'Order timings', value: business.orderingHours },
  ];

  return <Container className="py-12 sm:py-16">
    <SectionHeading as="h1" align="start" marathi="संपर्क" description="Questions about an order, a festive combo or a large order for a function? Send us a message." />
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section aria-labelledby="details-title">
        <h2 id="details-title" className="font-serif text-[1.375rem] font-semibold">Business details</h2>
        <dl className="mt-4 grid">
          {rows.map(({ icon: Icon, label, value, href }) => <div key={label} data-contact={label} className="grid justify-items-start gap-1 border-t border-line py-4 last:border-b">
              <dt className="flex items-center gap-3 font-serif font-semibold"><Icon aria-hidden="true" size={22} strokeWidth={1.4} className="shrink-0 text-saddle" />{label}</dt>
              <dd className="m-0 pl-[2.125rem] text-muted">
                {value === null ? <PendingChip>To be added</PendingChip>
                  : href ? <a href={href} className="underline underline-offset-4 hover:text-maroon" {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{value}</a>
                  : value}
              </dd>
          </div>)}
        </dl>
      </section>
      <EnquiryForm />
    </div>
  </Container>;
}

function EnquiryForm() {
  const ids = { name: useId(), message: useId() };
  const [values, setValues] = useState({ name: '', message: '' });
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});
  const [composed, setComposed] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (values.name.trim().length < 2) next.name = 'Please enter your name.';
    if (values.message.trim().length < 10) next.message = 'Please write a few words about your enquiry (at least 10 characters).';
    setErrors(next);
    if (next.name) { document.getElementById(ids.name)?.focus(); return; }
    if (next.message) { document.getElementById(ids.message)?.focus(); return; }
    const message = buildEnquiryMessage(values.name, values.message);
    const url = whatsappUrl(message);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    setComposed(message);
  }

  const update = (field: 'name' | 'message', value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  return <section aria-labelledby="enquiry-title" className="rounded-card border border-line bg-paper p-5 shadow-card sm:p-7">
    <h2 id="enquiry-title" className="font-serif text-[1.375rem] font-semibold">Send an enquiry</h2>
    <p className="mt-1 text-[0.9375rem] text-muted">Your enquiry is sent as a WhatsApp message. Nothing is stored on this website.</p>
    <form noValidate onSubmit={submit} className="mt-5 grid gap-5">
      <div className="grid gap-2">
        <label htmlFor={ids.name} className="font-serif font-medium">Your name</label>
        <input id={ids.name} name="name" autoComplete="name" maxLength={80} value={values.name} onChange={(event) => update('name', event.target.value)}
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${ids.name}-error` : undefined} className={fieldClass} />
        {errors.name && <p id={`${ids.name}-error`} className="text-[0.875rem] font-medium text-maroon">{errors.name}</p>}
      </div>
      <div className="grid gap-2">
        <label htmlFor={ids.message} className="font-serif font-medium">Your message</label>
        <textarea id={ids.message} name="message" rows={5} maxLength={1000} value={values.message} onChange={(event) => update('message', event.target.value)}
          aria-invalid={Boolean(errors.message)} aria-describedby={`${ids.message}-hint${errors.message ? ` ${ids.message}-error` : ''}`} className={fieldClass} />
        <p id={`${ids.message}-hint`} className="text-[0.8125rem] text-muted">For example, the products, quantities and date you need.</p>
        {errors.message && <p id={`${ids.message}-error`} className="text-[0.875rem] font-medium text-maroon">{errors.message}</p>}
      </div>
      <Button type="submit" className="justify-self-start"><MessageCircle aria-hidden="true" size={19} />{whatsappUrl('') ? 'Send on WhatsApp' : 'Prepare message'}</Button>
    </form>
    {composed && <div role="status" className="mt-6 grid gap-3 border-t border-line pt-5">
      {whatsappUrl('')
        ? <p className="font-serif font-medium">WhatsApp opened with your message. If it did not open, copy the message below.</p>
        : <p className="flex flex-wrap items-center gap-2 font-serif font-medium">Your message is ready. <PendingChip>WhatsApp number to be added</PendingChip></p>}
      <pre data-enquiry-message className="rounded-control border border-line bg-cream p-3.5 font-sans text-[0.875rem] whitespace-pre-wrap">{composed}</pre>
      <Button variant="outline" className="justify-self-start" onClick={() => copy(composed)}>
        {copied === 'done' ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}{copied === 'done' ? 'Message copied' : 'Copy message'}
      </Button>
    </div>}
  </section>;
}
