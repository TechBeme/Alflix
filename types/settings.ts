/**
 * Tipos compartilhados para Settings
 */

export interface SessionData {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    geoCity: string | null;
    geoCountry: string | null;
    geoCountryCode: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UserPreferencesData {
    id: string;
    userId: string;
    language: string;
    autoplayNext: boolean;
    autoplayTrailer: boolean;
    subtitleEnabled: boolean;
    subtitleLang: string;
    subtitleSize: string;
    subtitleColor: string;
    subtitleBg: string;
    subtitleFont: string;
    emailNewReleases: boolean;
    emailRecommendations: boolean;
    emailAccountAlerts: boolean;
    emailMarketing: boolean;
    pushNewReleases: boolean;
    pushRecommendations: boolean;
    pushAccountAlerts: boolean;
}
