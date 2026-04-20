/**
 * FormCheckbox Component
 * 
 * Checkbox com integração ao React Hook Form e validação Zod.
 * Mostra mensagens de erro automaticamente.
 * 
 * @example
 * ```tsx
 * <FormCheckbox
 *   name="acceptTerms"
 *   label="Aceito os termos de uso"
 *   register={register}
 *   error={errors.acceptTerms}
 * />
 * ```
 */

import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

interface FormCheckboxProps {
    name: string;
    label: React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    error?: FieldError;
    disabled?: boolean;
}

export function FormCheckbox({
    name,
    label,
    register,
    error,
    disabled = false,
}: FormCheckboxProps) {
    const hasError = !!error;

    return (
        <div className="w-full">
            <div className="flex items-start gap-3">
                <Checkbox
                    id={name}
                    {...register(name)}
                    disabled={disabled}
                    className={hasError ? 'border-red-500/50' : ''}
                />
                <label
                    htmlFor={name}
                    className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${hasError ? 'text-red-400' : 'text-gray-300'
                        }`}
                >
                    {label}
                </label>
            </div>
            {hasError && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                </div>
            )}
        </div>
    );
}
