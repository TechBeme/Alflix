'use client';

import { motion } from 'framer-motion';

export default function AnimatedGrid() {
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* Grid principal animado - quadrados se movendo */}
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.08) 2px, transparent 2px)',
                    backgroundSize: '100px 100px',
                }}
                animate={{
                    x: [0, 100],
                    y: [0, 100],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Grid secundário animado em direção oposta */}
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                }}
                animate={{
                    x: [100, 0],
                    y: [100, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
        </div>
    );
}
