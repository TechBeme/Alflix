import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { SessionProvider } from "@/components/SessionProvider";
import { QueryProvider } from "@/components/QueryProvider";
import JsonLd from "@/components/JsonLd";
import PWAProvider from "@/components/PWAProvider";
import { SITE_NAME_FULL, SITE_URL } from "@/lib/config";
import {
  DEFAULT_OG_IMAGE,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from "@/lib/seo";
import { localeToDir, localeToOpenGraph } from "@/lib/language";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

const siteUrl = SITE_URL;

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ogLocale = localeToOpenGraph(locale);
  const t = await getTranslations('metadata');
  const siteTitle = t('siteTitle', { siteName: SITE_NAME_FULL });
  const siteDescription = t('homeDescription', { siteName: SITE_NAME_FULL });
  const ogAlt = t('ogAlt', { siteName: SITE_NAME_FULL });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteTitle,
      template: `%s | ${SITE_NAME_FULL}`,
    },
    description: siteDescription,
    authors: [{ name: SITE_NAME_FULL }],
    creator: SITE_NAME_FULL,
    publisher: SITE_NAME_FULL,
    applicationName: SITE_NAME_FULL,
    category: 'entertainment',
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale, // Locale dinâmico do usuário
      url: siteUrl,
      siteName: SITE_NAME_FULL,
      title: siteTitle,
      description: siteDescription,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: ogAlt,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: [DEFAULT_OG_IMAGE],
      creator: '@allflixbr',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: [
        { url: '/favicon-180x180.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'icon', url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
        { rel: 'icon', url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    verification: {
      // Adicionar quando disponível:
      // google: 'seu-código-de-verificação',
      // yandex: 'seu-código-yandex',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tA11y = await getTranslations('a11y');
  const tMeta = await getTranslations('metadata');
  const siteDescription = tMeta('siteDescription');
  const organizationJsonLd = generateOrganizationJsonLd(siteDescription);
  const webSiteJsonLd = generateWebSiteJsonLd(siteDescription);
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={localeToDir(locale)}>
      <head>
        {/* Preconnect ao TMDB image CDN - reduz latência em ~100-200ms no primeiro carregamento */}
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        {/* Service Worker Registration - Inline para detecção do PWABuilder */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && typeof window !== 'undefined') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  console.warn('SW registration failed:', err);
                });
              });
            }
          `}
        </Script>
        <JsonLd id="organization-schema" data={organizationJsonLd} />
        <JsonLd id="website-schema" data={webSiteJsonLd} />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <QueryProvider>
            <SessionProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              >
                {tA11y('skipToContent')}
              </a>
              <Toaster
                position="top-right"
                expand={false}
                richColors
                closeButton
                theme="dark"
              />
              <PWAProvider />
              <main id="main-content">
                {children}
              </main>
            </SessionProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
