'use client';

import { useState, useCallback, useMemo } from 'react';
import { Check, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';
import UserAvatar, { getIconComponent } from '@/components/UserAvatar';
import { AVATAR_ICONS, AVATAR_COLORS, ICON_CATEGORIES, getAvatarColor } from '@/lib/avatar';
import { COLORS } from '@/lib/theme';
import { toast } from 'sonner';

interface AvatarPickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentIcon: string;
    currentColor: string;
    onSave: (icon: string, color: string) => void;
}

/**
 * AvatarPickerModal — Avatar customization modal
 * 
 * Netflix/HBO-inspired picker for choosing avatar icon + color.
 * Shows a live preview and organizes icons by category.
 */
export default function AvatarPickerModal({
    open,
    onOpenChange,
    currentIcon,
    currentColor,
    onSave,
}: AvatarPickerModalProps) {
    const [selectedIcon, setSelectedIcon] = useState(currentIcon);
    const [selectedColor, setSelectedColor] = useState(currentColor);
    const [saving, setSaving] = useState(false);
    const t = useTranslations('settingsAvatar');
    const tc = useTranslations('common');

    // Reset state when modal opens
    const handleOpenChange = useCallback((isOpen: boolean) => {
        if (isOpen) {
            setSelectedIcon(currentIcon);
            setSelectedColor(currentColor);
        }
        onOpenChange(isOpen);
    }, [currentIcon, currentColor, onOpenChange]);

    const hasChanges = selectedIcon !== currentIcon || selectedColor !== currentColor;

    const handleSave = useCallback(async () => {
        if (!hasChanges) {
            onOpenChange(false);
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/settings/avatar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ icon: selectedIcon, color: selectedColor }),
            });

            if (!response.ok) {
                const data = response.status !== 204 ? await response.json() : {};
                throw new Error(data.error || tc('errorSavingAvatar'));
            }

            onSave(selectedIcon, selectedColor);
            onOpenChange(false);
            toast.success(t('updated'));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('saveError'));
        } finally {
            setSaving(false);
        }
    }, [selectedIcon, selectedColor, hasChanges, onSave, onOpenChange]);

    const iconsByCategory = useMemo(() => {
        const categories = [
            { key: 'people' as const, label: t('categories.people') },
            { key: 'animals' as const, label: t('categories.animals') },
            { key: 'objects' as const, label: t('categories.objects') },
            { key: 'symbols' as const, label: t('categories.symbols') },
        ];

        return categories.map(cat => ({
            ...cat,
            icons: AVATAR_ICONS.filter(i => i.category === cat.key),
        }));
    }, [t]);

    return (
        <Modal
            open={open}
            onOpenChange={handleOpenChange}
            title={t('title')}
            className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col !p-5 sm:!p-8"
        >
            <div className="flex flex-col gap-5 overflow-hidden">
                {/* ── Live Preview ── */}
                <div className="flex items-center justify-center py-4">
                    <div className="relative">
                        <UserAvatar
                            icon={selectedIcon}
                            color={selectedColor}
                            size="xl"
                            shape="rounded"
                        />
                        <div
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#161616]"
                            style={{ background: COLORS.primary }}
                        >
                            <Pencil className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                        </div>
                    </div>
                </div>

                {/* ── Scrollable Content ── */}
                <div className="flex flex-col gap-5 overflow-y-auto overflow-x-hidden max-h-[50vh] pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* ── Color Selection ── */}
                    <div>
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.15em] mb-3">
                            {t('color')}
                        </p>
                        <div className="grid grid-cols-6 gap-2 p-1">
                            {AVATAR_COLORS.map(color => {
                                const isSelected = selectedColor === color.id;
                                return (
                                    <button
                                        key={color.id}
                                        onClick={() => setSelectedColor(color.id)}
                                        className={`
                                            relative w-full aspect-square rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                            ${isSelected
                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161616]'
                                                : 'hover:ring-1 hover:ring-white/20'
                                            }
                                        `}
                                        style={{ background: color.gradient }}
                                        title={t(`colors.${color.labelKey}`)}
                                        aria-label={`${t('color')} ${t(`colors.${color.labelKey}`)}`}
                                        aria-pressed={isSelected}
                                    >
                                        {isSelected && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white drop-shadow-md" aria-hidden="true" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Icon Selection by Category ── */}
                    {iconsByCategory.map(category => (
                        <div key={category.key}>
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.15em] mb-3">
                                {category.label}
                            </p>
                            <div className="grid grid-cols-4 gap-2 p-1">
                                {category.icons.map(iconPreset => {
                                    const Icon = getIconComponent(iconPreset.id);
                                    const isSelected = selectedIcon === iconPreset.id;
                                    const colorPreset = getAvatarColor(selectedColor);

                                    return (
                                        <button
                                            key={iconPreset.id}
                                            onClick={() => setSelectedIcon(iconPreset.id)}
                                            className={`
                                                flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                                ${isSelected
                                                    ? 'bg-white/[0.12]'
                                                    : 'bg-white/[0.04] hover:bg-white/[0.08]'
                                                }
                                            `}
                                            style={{
                                                borderColor: isSelected ? colorPreset.solid : 'transparent',
                                                border: isSelected ? `1.5px solid ${colorPreset.solid}` : '1.5px solid transparent',
                                            }}
                                            title={t(`icons.${iconPreset.labelKey}`)}
                                            aria-label={t(`icons.${iconPreset.labelKey}`)}
                                            aria-pressed={isSelected}
                                        >
                                            <Icon
                                                className="w-5 h-5 transition-colors"
                                                style={{ color: isSelected ? colorPreset.solid : 'rgba(255,255,255,0.6)' }}
                                                aria-hidden="true"
                                            />
                                            <span className={`text-[10px] font-medium transition-colors ${isSelected ? 'text-white' : 'text-white/40'}`}>
                                                {t(`icons.${iconPreset.labelKey}`)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                    <button
                        onClick={() => handleOpenChange(false)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white/70 bg-white/[0.06] rounded-xl hover:bg-white/[0.1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        {tc('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{ backgroundColor: hasChanges ? COLORS.primary : 'rgba(255,255,255,0.1)' }}
                    >
                        {saving ? t('saving') : tc('save')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
