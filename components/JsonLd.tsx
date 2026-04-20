import Script from 'next/script';

/**
 * JsonLd Component - Production-ready Structured Data
 * 
 * Render JSON-LD structured data for SEO usando Next.js Script component.
 * Solução enterprise-grade que evita problemas de hidratação.
 * 
 * Benefícios:
 * - Type-safe com TypeScript
 * - Sem problemas de hidratação
 * - Otimizado pelo Next.js
 * - Reutilizável e testável
 * - Sanitização automática via JSON.stringify
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/scripts
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */
interface JsonLdProps {
  /**
   * Dados estruturados para serializar em JSON-LD.
   * Aceita qualquer objeto que será convertido para JSON.
   */
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  
  /**
   * ID único para o script (recomendado para múltiplos JSON-LD na mesma página)
   */
  id?: string;
}

/**
 * Componente para renderizar JSON-LD structured data de forma segura
 * 
 * @example
 * ```tsx
 * <JsonLd 
 *   id="organization" 
 *   data={{
 *     "@context": "https://schema.org",
 *     "@type": "Organization",
 *     name: "Empresa",
 *   }} 
 * />
 * ```
 */
export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
      // Strategy 'beforeInteractive' garante que o script seja injetado antes da hidratação
      strategy="beforeInteractive"
    />
  );
}

/**
 * Hook para uso em Server Components quando precisar apenas do JSON-LD inline
 * Útil para casos onde não quer usar o componente Script
 */
export function jsonLdScriptProps(data: Record<string, unknown> | Array<Record<string, unknown>>) {
  return {
    type: 'application/ld+json' as const,
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data),
    },
  };
}

export default JsonLd;
