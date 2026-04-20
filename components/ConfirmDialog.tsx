'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

/**
 * Interface de Props do ConfirmDialog
 */
export interface ConfirmDialogProps {
    /** Título do diálogo */
    title: string;
    /** Mensagem/descrição do diálogo */
    message: string;
    /** Callback executado ao confirmar */
    onConfirm: () => void | Promise<void>;
    /** Callback executado ao cancelar (opcional) */
    onCancel?: () => void;
    /** Estado de abertura controlado externamente */
    open: boolean;
    /** Callback para mudar estado de abertura */
    onOpenChange: (open: boolean) => void;
    /** Texto do botão de confirmação (padrão: "Confirmar") */
    confirmText?: string;
    /** Texto do botão de cancelamento (padrão: "Cancelar") */
    cancelText?: string;
    /** Mostrar ícone de alerta (padrão: true) */
    showIcon?: boolean;
    /** Estado de loading durante confirmação */
    loading?: boolean;
}

/**
 * ConfirmDialog - Modal de confirmação para ações destrutivas
 * 
 * Componente reutilizável baseado em Radix UI Dialog que solicita
 * confirmação do usuário antes de executar ações importantes ou destrutivas
 * (como logout, exclusão de conta, cancelamento de assinatura, etc).
 * Fecha ao clicar fora ou pressionar ESC.
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Confirmar Logout"
 *   message="Tem certeza que deseja sair da sua conta?"
 *   onConfirm={handleLogout}
 * />
 * ```
 */
export default function ConfirmDialog({
    title,
    message,
    onConfirm,
    onCancel,
    open,
    onOpenChange,
    confirmText,
    cancelText,
    showIcon = true,
    loading = false,
}: ConfirmDialogProps) {
    const t = useTranslations('confirm');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            console.error(t('errorConfirming'), error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        onOpenChange(false);
    };



    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                <Dialog.Content
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
                        'w-full max-w-md rounded-2xl p-8',
                        'border border-white/[0.06]',
                        'shadow-2xl shadow-black/40',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        'focus:outline-none'
                    )} style={{ background: GRADIENTS.surface }}                >
                    {/* Header com ícone */}
                    {showIcon && (
                        <div className="flex justify-center mb-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${COLORS.primary}20` }}
                            >
                                <AlertTriangle
                                    className="w-8 h-8"
                                    style={{ color: COLORS.primary }}
                                    aria-hidden="true"
                                />
                            </div>
                        </div>
                    )}

                    {/* Título */}
                    <Dialog.Title className="text-2xl font-bold text-white text-center mb-3">
                        {title}
                    </Dialog.Title>

                    {/* Mensagem */}
                    <Dialog.Description className="text-gray-400 text-center mb-6 leading-relaxed">
                        {message}
                    </Dialog.Description>

                    {/* Botões */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                            onClick={handleCancel}
                            disabled={isLoading || loading}
                            className={cn(
                                'flex-1 px-6 py-3 rounded-lg font-medium transition-colors',
                                'bg-white/[0.08] text-white hover:bg-white/[0.12]',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                            )}
                        >
                            {cancelText || t('defaultCancel')}
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={isLoading || loading}
                            className={cn(
                                'flex-1 px-6 py-3 rounded-lg font-medium transition-colors text-white',
                                'bg-primary hover:bg-primary-hover',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'flex items-center justify-center gap-2',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                            )}
                        >
                            {(isLoading || loading) ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" />
                                    {t('wait')}
                                </>
                            ) : (
                                confirmText || t('defaultConfirm')
                            )}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

