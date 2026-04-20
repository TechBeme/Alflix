import LoginPageClient from './LoginPageClient';
import { SITE_NAME_FULL } from '@/lib/config';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
    title: 'Entrar ou Criar Conta',
    description: `Faça login ou crie sua conta no ${SITE_NAME_FULL}. Acesse milhares de filmes e séries de todas as plataformas de streaming.`,
    path: '/login',
    keywords: ['login', 'entrar', 'criar conta', 'cadastro', 'registrar'],
    noIndex: true,
});

export default function LoginPage() {
    return <LoginPageClient />;
}
