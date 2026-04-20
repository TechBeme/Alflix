'use client';

import { memo, useMemo } from 'react';
import {
    User, Smile, Ghost, Baby,
    Cat, Dog, Bird, Fish, Rabbit, Squirrel,
    Gamepad2, Music, Camera, Palette, Rocket, Coffee,
    Star, Heart, Zap, Crown, Diamond, Flame, Shield, Sparkles,
} from 'lucide-react';
import { getAvatarColor } from '@/lib/avatar';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

// ─── Icon Map ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
    user: User,
    smile: Smile,
    ghost: Ghost,
    baby: Baby,
    cat: Cat,
    dog: Dog,
    bird: Bird,
    fish: Fish,
    rabbit: Rabbit,
    squirrel: Squirrel,
    'gamepad-2': Gamepad2,
    music: Music,
    camera: Camera,
    palette: Palette,
    rocket: Rocket,
    coffee: Coffee,
    star: Star,
    heart: Heart,
    zap: Zap,
    crown: Crown,
    diamond: Diamond,
    flame: Flame,
    shield: Shield,
    sparkles: Sparkles,
};

/**
 * Get the Lucide icon component for a given icon ID
 */
export function getIconComponent(iconId: string): LucideIcon {
    return ICON_MAP[iconId] || User;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface UserAvatarProps {
    /** Icon preset ID */
    icon?: string;
    /** Color preset ID */
    color?: string;
    /** Size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Shape variant */
    shape?: 'circle' | 'rounded';
    /** Show ring border */
    ring?: boolean;
    /** Additional className */
    className?: string;
    /** onClick handler */
    onClick?: () => void;
}

const SIZE_CONFIG = {
    xs: { container: 'w-6 h-6', icon: 'w-3 h-3' },
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { container: 'w-16 h-16', icon: 'w-8 h-8' },
    xl: { container: 'w-20 h-20', icon: 'w-10 h-10' },
} as const;

/**
 * UserAvatar — Reusable avatar component
 * 
 * Renders the user's avatar with their chosen icon and color.
 * Used across Navbar, Settings, and mobile menu.
 */
const UserAvatar = memo(function UserAvatar({
    icon = 'user',
    color = 'red',
    size = 'md',
    shape = 'circle',
    ring = false,
    className = '',
    onClick,
}: UserAvatarProps) {
    const t = useTranslations('avatar');
    const colorPreset = useMemo(() => getAvatarColor(color), [color]);
    const Icon = useMemo(() => getIconComponent(icon), [icon]);
    const sizeConfig = SIZE_CONFIG[size];

    // Raio de borda proporcional ao tamanho para não ficar redondo nos pequenos
    const shapeClass = shape === 'circle'
        ? 'rounded-full'
        : size === 'lg' || size === 'xl'
            ? 'rounded-2xl'  // ~16px para elementos grandes
            : 'rounded-lg';  // ~8px para xs, sm, md
    const ringClass = ring ? 'ring-2 ring-white/10' : '';

    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            className={`${sizeConfig.container} ${shapeClass} ${ringClass} flex items-center justify-center shrink-0 transition-all ${onClick ? 'cursor-pointer hover:ring-white/20 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary' : ''} ${className}`}
            style={{ background: colorPreset.gradient }}
            onClick={onClick}
            {...(onClick ? { type: 'button' as const, 'aria-label': t('change') } : {})}
        >
            <Icon className={`${sizeConfig.icon} text-white`} aria-hidden="true" />
        </Tag>
    );
});

export default UserAvatar;
