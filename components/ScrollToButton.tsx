'use client';

import { Play } from 'lucide-react';
import { Button } from './ui/button';
import { COLORS } from '@/lib/theme';

interface ScrollToButtonProps {
    targetId: string;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

export default function ScrollToButton({ targetId, children, variant = 'primary' }: ScrollToButtonProps) {
    const handleClick = () => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    };

    if (variant === 'primary') {
        return (
            <Button
                size="lg"
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 transition-all hover:scale-105 group w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: COLORS.primary }}
                onClick={handleClick}
            >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                {children}
            </Button>
        );
    }

    return (
        <Button
            size="lg"
            className="text-white text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 hover:scale-105 transition-all border-0 rounded-xl hover:opacity-90 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ backgroundColor: COLORS.primary }}
            onClick={handleClick}
        >
            {children}
        </Button>
    );
}
