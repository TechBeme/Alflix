/**
 * Schemas de validação reutilizáveis usando Zod
 * 
 * Todos os schemas de validação do projeto são centralizados aqui
 * para garantir consistência e reutilização.
 * 
 * @see https://zod.dev/
 */

import { z } from 'zod';
import { validationMessages as msg } from './messages';

/**
 * Schema base para email
 * Usado em login, registro, contato, alteração de email
 */
export const emailSchema = z
    .string()
    .min(1, msg.email.required)
    .email(msg.email.invalid)
    .toLowerCase()
    .trim();

/**
 * Schema base para nome
 * Usado em registro e perfil
 */
export const nameSchema = z
    .string()
    .min(1, msg.name.required)
    .min(3, msg.name.min(3))
    .max(100, msg.name.max(100))
    .trim();

/**
 * Schema para formulário de OTP (envio de código)
 */
export const otpEmailSchema = z.object({
    email: emailSchema,
});

export type OtpEmailData = z.infer<typeof otpEmailSchema>;

/**
 * Schema para formulário de contato
 */
export const contactSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    subject: z
        .string()
        .min(1, msg.subject.required)
        .min(5, msg.subject.min(5))
        .max(200)
        .trim(),
    message: z
        .string()
        .min(1, msg.message.required)
        .min(10, msg.message.min(10))
        .max(1000, msg.message.max(1000))
        .trim(),
});

export type ContactData = z.infer<typeof contactSchema>;

/**
 * Schema para alteração de email
 */
export const changeEmailSchema = z.object({
    newEmail: emailSchema,
});

export type ChangeEmailData = z.infer<typeof changeEmailSchema>;

/**
 * Schema para atualização de perfil
 */
export const updateProfileSchema = z.object({
    name: nameSchema,
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
