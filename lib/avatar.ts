/**
 * Avatar System Constants
 * 
 * Defines all available avatar icons and color presets.
 * Users can customize their avatar by choosing an icon + color combo.
 * No photo upload — follows Netflix/HBO profile icon pattern.
 */

// ─── Color Presets ─────────────────────────────────────────────────────────

export interface AvatarColorPreset {
    id: string;
    labelKey: string;
    /** CSS gradient for the avatar background */
    gradient: string;
    /** Solid color for smaller contexts (badges, indicators) */
    solid: string;
}

export const AVATAR_COLORS: AvatarColorPreset[] = [
    {
        id: 'red',
        labelKey: 'red',
        gradient: 'linear-gradient(135deg, #d0212a, #8b0000)',
        solid: '#d0212a',
    },
    {
        id: 'blue',
        labelKey: 'blue',
        gradient: 'linear-gradient(135deg, #2563eb, #1e40af)',
        solid: '#2563eb',
    },
    {
        id: 'purple',
        labelKey: 'purple',
        gradient: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
        solid: '#7c3aed',
    },
    {
        id: 'green',
        labelKey: 'green',
        gradient: 'linear-gradient(135deg, #16a34a, #166534)',
        solid: '#16a34a',
    },
    {
        id: 'orange',
        labelKey: 'orange',
        gradient: 'linear-gradient(135deg, #ea580c, #9a3412)',
        solid: '#ea580c',
    },
    {
        id: 'pink',
        labelKey: 'pink',
        gradient: 'linear-gradient(135deg, #ec4899, #9d174d)',
        solid: '#ec4899',
    },
    {
        id: 'teal',
        labelKey: 'turquoise',
        gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)',
        solid: '#14b8a6',
    },
    {
        id: 'indigo',
        labelKey: 'indigo',
        gradient: 'linear-gradient(135deg, #6366f1, #3730a3)',
        solid: '#6366f1',
    },
    {
        id: 'amber',
        labelKey: 'amber',
        gradient: 'linear-gradient(135deg, #f59e0b, #b45309)',
        solid: '#f59e0b',
    },
    {
        id: 'cyan',
        labelKey: 'cyan',
        gradient: 'linear-gradient(135deg, #06b6d4, #0e7490)',
        solid: '#06b6d4',
    },
    {
        id: 'rose',
        labelKey: 'rose',
        gradient: 'linear-gradient(135deg, #f43f5e, #9f1239)',
        solid: '#f43f5e',
    },
    {
        id: 'slate',
        labelKey: 'slate',
        gradient: 'linear-gradient(135deg, #64748b, #334155)',
        solid: '#64748b',
    },
] as const;

// ─── Icon Presets ──────────────────────────────────────────────────────────

export interface AvatarIconPreset {
    id: string;
    labelKey: string;
    /** Lucide icon name (used to dynamically render) */
    category: 'people' | 'animals' | 'objects' | 'symbols';
}

export const AVATAR_ICONS: AvatarIconPreset[] = [
    // People
    { id: 'user', labelKey: 'person', category: 'people' },
    { id: 'smile', labelKey: 'smile', category: 'people' },
    { id: 'ghost', labelKey: 'ghost', category: 'people' },
    { id: 'baby', labelKey: 'baby', category: 'people' },
    // Animals
    { id: 'cat', labelKey: 'cat', category: 'animals' },
    { id: 'dog', labelKey: 'dog', category: 'animals' },
    { id: 'bird', labelKey: 'bird', category: 'animals' },
    { id: 'fish', labelKey: 'fish', category: 'animals' },
    { id: 'rabbit', labelKey: 'rabbit', category: 'animals' },
    { id: 'squirrel', labelKey: 'squirrel', category: 'animals' },
    // Objects
    { id: 'gamepad-2', labelKey: 'gamepad', category: 'objects' },
    { id: 'music', labelKey: 'music', category: 'objects' },
    { id: 'camera', labelKey: 'camera', category: 'objects' },
    { id: 'palette', labelKey: 'palette', category: 'objects' },
    { id: 'rocket', labelKey: 'rocket', category: 'objects' },
    { id: 'coffee', labelKey: 'coffee', category: 'objects' },
    // Symbols
    { id: 'star', labelKey: 'star', category: 'symbols' },
    { id: 'heart', labelKey: 'heart', category: 'symbols' },
    { id: 'zap', labelKey: 'lightning', category: 'symbols' },
    { id: 'crown', labelKey: 'crown', category: 'symbols' },
    { id: 'diamond', labelKey: 'diamond', category: 'symbols' },
    { id: 'flame', labelKey: 'flame', category: 'symbols' },
    { id: 'shield', labelKey: 'shield', category: 'symbols' },
    { id: 'sparkles', labelKey: 'sparkles', category: 'symbols' },
] as const;

// ─── Icon Categories ───────────────────────────────────────────────────────

export interface IconCategory {
    key: 'people' | 'animals' | 'objects' | 'symbols';
    labelKey: string;
}

export const ICON_CATEGORIES: IconCategory[] = [
    { key: 'people', labelKey: 'people' },
    { key: 'animals', labelKey: 'animals' },
    { key: 'objects', labelKey: 'objects' },
    { key: 'symbols', labelKey: 'symbols' },
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Get avatar color preset by ID, fallback to red
 */
export function getAvatarColor(colorId: string): AvatarColorPreset {
    return AVATAR_COLORS.find(c => c.id === colorId) || AVATAR_COLORS[0];
}

/**
 * Get avatar icon preset by ID, fallback to user
 */
export function getAvatarIcon(iconId: string): AvatarIconPreset {
    return AVATAR_ICONS.find(i => i.id === iconId) || AVATAR_ICONS[0];
}

/**
 * Validate avatar icon ID
 */
export function isValidAvatarIcon(iconId: string): boolean {
    return AVATAR_ICONS.some(i => i.id === iconId);
}

/**
 * Validate avatar color ID
 */
export function isValidAvatarColor(colorId: string): boolean {
    return AVATAR_COLORS.some(c => c.id === colorId);
}
