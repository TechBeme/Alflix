'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

/**
 * BackButton - Client component for navigation back
 */
export default function BackButton() {
    const tc = useTranslations('common');

    return (
        <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="lg"
            className="gap-2 w-full sm:w-auto"
        >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            {tc('back')}
        </Button>
    );
}
