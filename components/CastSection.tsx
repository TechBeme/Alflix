'use client';

import { Cast } from '@/lib/tmdb';
import { useState } from 'react';
import { User } from 'lucide-react';
import { GRADIENTS } from '@/lib/theme';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getCastProfileUrl } from '@/lib/image-utils';
import { useTranslations } from 'next-intl';

interface CastSectionProps {
    cast: Cast[];
    maxItems?: number;
}

/**
 * CastSection - Component for displaying cast members in a horizontal scrollable grid
 * Shows actor photo, name, and character
 */
export default function CastSection({ cast, maxItems = 10 }: CastSectionProps) {
    const t = useTranslations('cast');
    const displayCast = cast.slice(0, maxItems);

    if (displayCast.length === 0) return null;

    return (
        <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">{t('mainCast')}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayCast.map((member) => (
                    <CastCard key={member.id} member={member} />
                ))}
            </div>
        </section>
    );
}

interface CastCardProps {
    member: Cast;
}

function CastCard({ member }: CastCardProps) {
    const [imageError, setImageError] = useState(false);

    const profileUrl = !member.profile_path || imageError
        ? null
        : getCastProfileUrl(member.profile_path);

    return (
        <div className="group">
            {/* Profile Photo */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2" style={{ background: GRADIENTS.cast }}>
                {profileUrl ? (
                    <OptimizedImage
                        src={profileUrl}
                        alt={member.name}
                        fill
                        loading="lazy"
                        sizeContext="castProfile"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: GRADIENTS.castAlt }}>
                        <User className="w-12 h-12 text-gray-600" aria-hidden="true" />
                    </div>
                )}
            </div>

            {/* Actor Info */}
            <div>
                <h3 className="font-semibold text-white text-sm line-clamp-1">
                    {member.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-1">
                    {member.character}
                </p>
            </div>
        </div>
    );
}
