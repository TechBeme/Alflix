/**
 * FormInput Component
 * 
 * Input com integração ao React Hook Form e validação Zod.
 * Mostra mensagens de erro automaticamente abaixo do campo.
 * 
 * @example
 * ```tsx
 * <FormInput
 *   name="email"
 *   label="Email"
 *   type="email"
 *   placeholder="seu@email.com"
 *   register={register}
 *   error={errors.email}
 *   icon={<Mail className="w-5 h-5" />}
 * />
 * ```
 */

import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { GRADIENTS } from '@/lib/theme';
import { AlertCircle } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name: string;
    label: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    error?: FieldError;
    hint?: string;
    icon?: React.ReactNode;
}

export function FormInput({
    name,
    label,
    register,
    error,
    hint,
    icon,
    className = '',
    ...props
}: FormInputProps) {
    const hasError = !!error;

    return (
        <div className="w-full">
            <label htmlFor={name} className="block text-gray-300 mb-2 text-sm font-medium">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <Input
                    id={name}
                    {...register(name)}
                    {...props}
                    className={`
                        w-full border transition-all h-11
                        ${icon ? 'pl-10' : 'px-4'}
                        ${hasError
                            ? 'border-red-500/50 focus-visible:ring-red-500'
                            : 'border-white/[0.06] focus-visible:ring-primary'
                        }
                        text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-0
                        ${className}
                    `}
                    style={{ background: GRADIENTS.input }}
                />
            </div>
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

export default FormInput;