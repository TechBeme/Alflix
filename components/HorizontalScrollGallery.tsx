'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import MediaCard, { MediaCardItem } from './MediaCard';
import { GRADIENTS } from '@/lib/theme';

interface GallerySection {
    title: string;
    items: MediaCardItem[];
    direction: 'left-to-right' | 'right-to-left';
}

interface HorizontalScrollGalleryProps {
    sections: GallerySection[];
}

interface HorizontalScrollRowProps {
    section: GallerySection;
    scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}

function HorizontalScrollRow({ section, scrollYProgress }: HorizontalScrollRowProps) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [maxScroll, setMaxScroll] = useState(0);

    useLayoutEffect(() => {
        const viewportEl = viewportRef.current;
        const listEl = listRef.current;
        if (!viewportEl || !listEl) return;

        const measure = () => {
            const viewportWidth = viewportEl.clientWidth;
            const contentWidth = listEl.scrollWidth;
            const nextMaxScroll = Math.max(0, contentWidth - viewportWidth);
            setMaxScroll(nextMaxScroll);
        };

        measure();

        const observer = new ResizeObserver(() => measure());
        observer.observe(viewportEl);
        observer.observe(listEl);

        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);

    const xLeft = useTransform(scrollYProgress, [0, 1], [0, -maxScroll]);
    const xRight = useTransform(scrollYProgress, [0, 1], [-maxScroll, 0]);
    const x = section.direction === 'left-to-right' ? xLeft : xRight;

    return (
        <div style={{ marginBottom: section.title ? '32px' : 0 }}>
            <h2 className="text-xl font-bold text-white mb-3 px-4">{section.title}</h2>
            <div ref={viewportRef} style={{ overflow: 'hidden', paddingLeft: '16px', paddingRight: '16px' }}>
                <motion.div
                    ref={listRef}
                    style={{ x, display: 'flex', gap: '16px', willChange: 'transform' }}
                >
                    {section.items.map((item) => (
                        <div key={item.id} style={{ flexShrink: 0 }}>
                            <MediaCard
                                item={item}
                                width="w-[180px]"
                                height="h-[270px]"
                                showActions={false}
                                showBadges={true}
                            />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

export default function HorizontalScrollGallery({ sections }: HorizontalScrollGalleryProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <section
            ref={containerRef}
            className="py-32 px-4 relative"
            style={{
                height: '300vh',
                background: GRADIENTS.sectionPricing
            }}
        >
            <div
                style={{
                    position: 'sticky',
                    top: 0,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}
            >
                <div className="w-full max-w-7xl mx-auto">
                    {sections.map((section, sectionIdx) => (
                        <HorizontalScrollRow
                            key={sectionIdx}
                            section={section}
                            scrollYProgress={scrollYProgress}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
