/**
 * Watchlist API Validation Schemas
 * 
 * Schemas Zod para validação das APIs de watchlist.
 */

import { z } from 'zod';

/**
 * Schema para adicionar item à watchlist
 */
export const addToWatchlistSchema = z.object({
    mediaId: z.number().int().positive('api.validation.mediaIdPositive'),
    mediaType: z.enum(['movie', 'tv'], {
        message: 'api.validation.mediaTypeMovieOrTv',
    }),
    title: z.string().min(1, 'api.validation.titleRequired').max(500, 'api.validation.titleTooLong'),
    posterPath: z.string().nullable().optional(),
    overview: z.string().max(2000, 'api.validation.descriptionTooLong').nullable().optional(),
    releaseDate: z.string().nullable().optional(),
    voteAverage: z.number().min(0).max(10).nullable().optional(),
});

export type AddToWatchlistData = z.infer<typeof addToWatchlistSchema>;

/**
 * Schema para remover item da watchlist
 */
export const removeFromWatchlistSchema = z.object({
    mediaId: z.number().int().positive('api.validation.mediaIdPositive'),
    mediaType: z.enum(['movie', 'tv'], {
        message: 'api.validation.mediaTypeMovieOrTv',
    }),
});

export type RemoveFromWatchlistData = z.infer<typeof removeFromWatchlistSchema>;

/**
 * Schema para query de watchlist
 */
export const watchlistQuerySchema = z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 20)),
    mediaType: z.enum(['movie', 'tv', 'all']).optional().default('all'),
});

export type WatchlistQueryData = z.infer<typeof watchlistQuerySchema>;

/**
 * Schema para histórico de visualização
 */
export const watchHistorySchema = z.object({
    mediaId: z.number().int().positive(),
    mediaType: z.enum(['movie', 'tv']),
    title: z.string().min(1).max(500),
    posterPath: z.string().nullable().optional(),
    progress: z.number().min(0).max(100).default(0),
    currentTime: z.number().min(0).default(0),
    totalTime: z.number().min(0).default(0),
    seasonNumber: z.number().int().positive().nullable().optional(),
    episodeNumber: z.number().int().positive().nullable().optional(),
});

export type WatchHistoryData = z.infer<typeof watchHistorySchema>;

// ============================================================================
// FAMILY API SCHEMAS
// ============================================================================

/**
 * Schema para criar convite de família
 * 
 * Valida:
 * - Email opcional (deve ser válido se fornecido)
 * - Máximo de 254 caracteres (RFC 5321)
 * - Formato válido (usando Zod .email())
 */
export const createFamilyInviteSchema = z.object({
    email: z
        .string()
        .email('api.validation.emailInvalid')
        .max(254, 'api.validation.emailTooLong')
        .toLowerCase()
        .trim()
        .optional()
        .nullable(),
});

export type CreateFamilyInviteData = z.infer<typeof createFamilyInviteSchema>;

/**
 * Schema para aceitar convite de família
 * 
 * Valida:
 * - Token obrigatório (CUID format do Prisma)
 * - Mínimo de segurança contra brute-force
 */
export const acceptFamilyInviteSchema = z.object({
    token: z
        .string()
        .min(20, 'api.validation.inviteTokenInvalid')
        .max(30, 'api.validation.inviteTokenInvalid')
        .trim(),
});

export type AcceptFamilyInviteData = z.infer<typeof acceptFamilyInviteSchema>;

/**
 * Schema para revogar convite de família
 * 
 * Valida:
 * - ID do convite obrigatório (CUID format do Prisma)
 */
export const revokeFamilyInviteSchema = z.object({
    inviteId: z
        .string()
        .min(20, 'api.validation.inviteIdInvalid')
        .max(30, 'api.validation.inviteIdInvalid')
        .trim(),
});

export type RevokeFamilyInviteData = z.infer<typeof revokeFamilyInviteSchema>;

/**
 * Schema para remover membro de família
 * 
 * Valida:
 * - ID do membro obrigatório (UUID format)
 */
export const removeFamilyMemberSchema = z.object({
    memberId: z
        .string()
        .min(1, 'api.validation.memberIdRequired')
        .uuid('api.validation.memberIdInvalid')
        .trim(),
});

export type RemoveFamilyMemberData = z.infer<typeof removeFamilyMemberSchema>;

/**
 * Schema para remover membro ou sair de família
 * 
 * Valida:
 * - OU memberId (owner removendo) OU leave=true (membro saindo)
 * - Exatamente uma dessas opções deve ser fornecida
 */
export const manageFamilyMemberSchema = z.object({
    memberId: z
        .string()
        .min(20, 'api.validation.memberIdInvalid')
        .max(30, 'api.validation.memberIdInvalid')
        .trim()
        .optional(),
    leave: z
        .boolean()
        .optional(),
}).refine(
    (data) => (data.memberId && !data.leave) || (!data.memberId && data.leave),
    {
        message: 'Deve fornecer memberId (owner) ou leave: true (membro)',
    }
);

export type ManageFamilyMemberData = z.infer<typeof manageFamilyMemberSchema>;
