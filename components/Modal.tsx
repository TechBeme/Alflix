import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

export interface ModalProps {
    /** Estado de abertura controlado externamente */
    open: boolean;
    /** Callback para mudar estado de abertura */
    onOpenChange: (open: boolean) => void;
    /** Título do modal */
    title: string;
    /** Conteúdo do modal */
    children: React.ReactNode;
    /** Mostrar botão de fechar (padrão: true) */
    showCloseButton?: boolean;
    /** Classe customizada para o container do conteúdo */
    className?: string;
}

/**
 * Modal - Componente de modal reutilizável
 * 
 * Baseado em Radix UI Dialog, fornece um modal consistente
 * com overlay, animações e comportamento padrão.
 * 
 * @example
 * ```tsx
 * <Modal open={isOpen} onOpenChange={setIsOpen} title="Título">
 *   <div>Conteúdo do modal</div>
 * </Modal>
 * ```
 */
export default function Modal({
    open,
    onOpenChange,
    title,
    children,
    showCloseButton = true,
    className,
}: ModalProps) {
    const tA11y = useTranslations('a11y');
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                <Dialog.Content
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
                        'w-full max-w-lg rounded-2xl p-8',
                        'border border-white/[0.06]',
                        'shadow-2xl shadow-black/40',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        'focus:outline-none',
                        className
                    )}
                    style={{ background: GRADIENTS.surface }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-semibold text-white">
                            {title}
                        </Dialog.Title>
                        {showCloseButton && (
                            <Dialog.Close className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm" aria-label={tA11y('closeDialog')}>
                                <X className="w-5 h-5" aria-hidden="true" />
                            </Dialog.Close>
                        )}
                    </div>

                    {/* Content */}
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
