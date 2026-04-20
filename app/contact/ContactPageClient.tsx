'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import HeroSection from '@/components/HeroSection';
import ContactInfoCard from '@/components/ContactInfoCard';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';
import { Mail, Phone, Send } from 'lucide-react';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { CONTACT_EMAIL } from '@/lib/config';
import { contactSchema, type ContactData } from '@/lib/validation';
import { useTranslations } from 'next-intl';
import type { Session } from '@/lib/auth-client';

interface ContactPageClientProps {
    initialSession: Session | null;
}

export default function ContactPageClient({ initialSession }: ContactPageClientProps) {
    const t = useTranslations('contactPage');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [loading, setLoading] = useState(false);

    // React Hook Form com validação Zod
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            email: '',
            subject: '',
            message: '',
        },
    });

    const onSubmit = async (data: ContactData) => {
        setLoading(true);

        console.log('Contact form data:', data);

        // TODO: Implementar envio real para API
        // Simular envio de formulário
        setTimeout(() => {
            setStatus('success');
            setLoading(false);
            reset();
        }, 1000);
    };

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
            <Navbar initialSession={initialSession} />

            {/* Hero Section */}
            <div className="pt-24">
                <HeroSection
                    title={t('title')}
                    highlightedWord={t('highlightedWord')}
                    description={t('subtitle')}
                />

                {/* Contact Info Cards */}
                <section className="pb-20 pt-4 px-4" style={{ background: GRADIENTS.sectionInstitutional }}>
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-center gap-6 mb-12">
                            <ContactInfoCard
                                icon={Mail}
                                title={t('email')}
                                value={CONTACT_EMAIL}
                                delay={0.1}
                            />
                            <ContactInfoCard
                                icon={Send}
                                title={t('chat')}
                                value={t('available247')}
                                delay={0.2}
                            />
                            <ContactInfoCard
                                icon={Phone}
                                title={t('response')}
                                value={t('responseTime')}
                                delay={0.3}
                            />
                        </div>

                        {/* Contact Form */}
                        <ScrollReveal delay={0.4}>
                            <div className="flex justify-center">
                                <div className="p-6 rounded-2xl border border-white/[0.06] w-[832px] shadow-lg shadow-black/20" style={{ background: GRADIENTS.surface }}>
                                    <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                        {t('sendMessage')}
                                    </h2>

                                    {status === 'success' && (
                                        <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                                            <p className="text-green-400 text-sm text-center">
                                                {t('successMessage')}
                                            </p>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4">
                                        <FormInput
                                            name="name"
                                            label={t('nameLabel')}
                                            type="text"
                                            placeholder={t('namePlaceholder')}
                                            register={register}
                                            error={errors.name}
                                        />

                                        <FormInput
                                            name="email"
                                            label={t('email')}
                                            type="email"
                                            placeholder={t('emailPlaceholder')}
                                            register={register}
                                            error={errors.email}
                                        />

                                        <div className="md:col-span-2">
                                            <FormInput
                                                name="subject"
                                                label={t('subjectLabel')}
                                                type="text"
                                                placeholder={t('subjectPlaceholder')}
                                                register={register}
                                                error={errors.subject}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <FormTextarea
                                                name="message"
                                                label={t('messageLabel')}
                                                placeholder={t('messagePlaceholder')}
                                                rows={4}
                                                register={register}
                                                error={errors.message}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full text-white py-5 hover:opacity-90 transition-all"
                                                style={{ backgroundColor: COLORS.primary }}
                                            >
                                                {loading ? (
                                                    t('sending')
                                                ) : (
                                                    <>
                                                        {t('send')}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
}
