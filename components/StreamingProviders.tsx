'use client';

import { streamingProviders } from '@/lib/providers-data';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useTranslations } from 'next-intl';

interface StreamingProvidersProps {
    className?: string;
}

export default function StreamingProviders({
    className = ''
}: StreamingProvidersProps) {
    const tc = useTranslations('common');

    return (
        <section className={`py-12 ${className}`}>
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-white">
                    {tc('availableOn')}
                </h2>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-8 items-center justify-items-center max-w-4xl mx-auto">
                    {streamingProviders.map((provider) => (
                        <div
                            key={provider.id}
                            className="group relative flex items-center justify-center"
                            title={provider.name}
                        >
                            <div className="relative w-20 h-20 md:w-24 md:h-24 transition-all duration-300 opacity-70 hover:opacity-100 grayscale hover:grayscale-0">
                                <OptimizedImage
                                    src={provider.logoPath || ''}
                                    alt={provider.name}
                                    fill
                                    className="object-contain"
                                    sizeContext="icon"
                                    placeholder="empty"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-center text-sm text-gray-400 mt-8">
                    {tc('availabilityNote')}
                </p>
            </div>
        </section>
    );
}
