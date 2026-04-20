/**
 * Mensagens de erro de validação customizadas
 * 
 * Centraliza todas as mensagens de erro para manter consistência
 * e facilitar manutenção e internacionalização futura.
 */

export const validationMessages = {
    // Campo obrigatório
    required: (field: string) => `${field} é obrigatório`,

    // Email
    email: {
        invalid: 'Digite um email válido',
        required: 'Email é obrigatório',
    },

    // Nome
    name: {
        required: 'Nome é obrigatório',
        min: (min: number) => `Nome deve ter no mínimo ${min} caracteres`,
        max: (max: number) => `Nome deve ter no máximo ${max} caracteres`,
    },

    // Assunto
    subject: {
        required: 'Assunto é obrigatório',
        min: (min: number) => `Assunto deve ter no mínimo ${min} caracteres`,
    },

    // Mensagem
    message: {
        required: 'Mensagem é obrigatória',
        min: (min: number) => `Mensagem deve ter no mínimo ${min} caracteres`,
        max: (max: number) => `Mensagem deve ter no máximo ${max} caracteres`,
    },

    // Genérico
    string: {
        min: (field: string, min: number) => `${field} deve ter no mínimo ${min} caracteres`,
        max: (field: string, max: number) => `${field} deve ter no máximo ${max} caracteres`,
    },
};
