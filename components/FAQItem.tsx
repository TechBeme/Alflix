'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GRADIENTS } from '@/lib/theme';
import ScrollReveal from './ScrollReveal';
import { COLORS } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItemProps {
    question: string;
    answer: string;
    delay?: number;
    defaultOpen?: boolean;
    className?: string;
}

/**
 * FAQItem - Collapsible FAQ item with accordion functionality
 * Used in: landing page (FAQ Section)
 */
export default function FAQItem({
    question,
    answer,
    delay = 0,
    defaultOpen = false,
    className = '',
}: FAQItemProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <ScrollReveal delay={delay}>
            <div
                className={`rounded-2xl border border-white/[0.06] hover:border-primary transition-all overflow-hidden shadow-lg shadow-black/20 ${className}`}
                style={{ background: GRADIENTS.surface }}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-8 text-left flex items-start justify-between gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-2xl"
                    aria-expanded={isOpen}
                >
                    <h3 className="text-xl font-bold text-white flex-1">
                        {question}
                    </h3>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                    >
                        <ChevronDown className="w-6 h-6 text-gray-400" aria-hidden="true" />
                    </motion.div>
                </button>

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="px-8 pb-8 pt-0">
                                <p className="text-gray-400 leading-relaxed">
                                    {answer}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ScrollReveal>
    );
}
