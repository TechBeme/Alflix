/**
 * FormTextarea Component
 * 
 * Textarea com integração ao React Hook Form e validação Zod.
 * Mostra mensagens de erro automaticamente abaixo do campo.
 * 
 * @example
 * ```tsx
 * <FormTextarea
 *   name="message"
 *   label="Mensagem"
 *   placeholder="Descreva sua dúvida..."
 *   rows={4}
 *   register={register}
 *   error={errors.message}
 * />
 * ```
 */

import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { GRADIENTS } from '@/lib/theme';
import { AlertCircle } from 'lucide-react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    name: string;
    label: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    error?: FieldError;
    hint?: string;
}

export function FormTextarea({
    name,
    label,
    register,
    error,
    hint,
    className = '',
    ...props
}: FormTextareaProps) {
    const hasError = !!error;

    return (
        <div className="w-full">
            <label htmlFor={name} className="block text-gray-300 mb-2 text-sm font-medium">
                {label}
            </label>
            <textarea
                id={name}
                {...register(name)}
                {...props}
                className={`
                    w-full border rounded-md px-4 py-3 text-white transition-all resize-none
                    focus:outline-none focus:ring-1 focus:ring-offset-0
                    ${hasError
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/[0.06] focus:border-primary focus:ring-primary'
                    }
                    ${className}
                `}
                style={{ background: GRADIENTS.input }}
            />
            {hasError && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                </div>
            )}
            {hint && !hasError && (
                <p className="mt-2 text-gray-500 text-sm">{hint}</p>
            )}
        </div>
    );
}
