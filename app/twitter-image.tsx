import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_NAME_FULL } from '@/lib/config';

export const alt = `${SITE_NAME_FULL} - Todos os Streamings em Uma Assinatura`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        fontSize: 96,
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '-2px',
                        marginBottom: 16,
                        display: 'flex',
                    }}
                >
                    {SITE_NAME}
                </div>

                <div
                    style={{
                        width: 320,
                        height: 4,
                        background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                        borderRadius: 2,
                        marginBottom: 24,
                        display: 'flex',
                    }}
                />

                <div
                    style={{
                        fontSize: 32,
                        color: '#a0a0a0',
                        display: 'flex',
                    }}
                >
                    Todos os Streamings em Uma Assinatura
                </div>
            </div>
        ),
        { ...size }
    );
}
