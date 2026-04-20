import { NextResponse } from 'next/server';
import { expireTrials } from '@/lib/trial';

/**
 * POST /api/cron/expire-trials
 * 
 * Endpoint para expirar trials vencidos.
 * Pode ser chamado por um cron job externo (ex: Vercel Cron, GitHub Actions).
 * 
 * Segurança: Protegido por CRON_SECRET no header Authorization.
 */
export async function POST(request: Request) {
    try {
        // Verificar secret do cron
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Em produção, CRON_SECRET é obrigatório
        if (process.env.NODE_ENV === 'production' && (!cronSecret || cronSecret.trim() === '')) {
            console.error('❌ [Cron] ERRO: CRON_SECRET não configurada em produção!');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // Valida o secret (obrigatório em qualquer ambiente)
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            console.warn('⚠️  [Cron] Tentativa de acesso não autorizado ao endpoint expire-trials');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const expiredCount = await expireTrials();

        console.info(`✅ [Cron] Trials expirados: ${expiredCount}`);
        return NextResponse.json({
            success: true,
            expiredCount,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Cron] Erro ao expirar trials:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
