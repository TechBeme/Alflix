import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
    const t = await getTranslations('pwa');
    return {
        title: t('offlineTitle'),
        description: t('offlineDescription'),
        robots: { index: false, follow: false },
    };
}

export default function OfflineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
