-- Migration: Add geolocation fields to Session table
-- Gerado em: 2026-02-08
-- Descrição: Adiciona campos para cachear geolocalização de IPs de sessões

-- Adicionar colunas de geolocalização
ALTER TABLE "Session" 
ADD COLUMN IF NOT EXISTS "geoCity" TEXT,
ADD COLUMN IF NOT EXISTS "geoCountry" TEXT,
ADD COLUMN IF NOT EXISTS "geoCountryCode" TEXT;

-- Comentários para documentação
COMMENT ON COLUMN "Session"."geoCity" IS 'Cidade da sessão (cache de IP lookup)';
COMMENT ON COLUMN "Session"."geoCountry" IS 'País da sessão (cache de IP lookup)';
COMMENT ON COLUMN "Session"."geoCountryCode" IS 'Código do país da sessão (ex: BR, US, UK)';
