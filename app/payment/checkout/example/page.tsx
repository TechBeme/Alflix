"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/AnimatedBackground";
import { CreditCard, Loader2, CheckCircle, X, AlertCircle } from "lucide-react";
import { COLORS, GRADIENTS } from "@/lib/theme";
import { SITE_NAME, SITE_NAME_SUFFIX, SITE_NAME_FULL } from "@/lib/config";
import { useTranslations } from 'next-intl';

/**
 * Página de Exemplo de Checkout
 * 
 * Esta página simula um gateway de pagamento para desenvolvimento.
 * Permite testar o fluxo completo de pagamento sem integrar um gateway real.
 * 
 * TODO (i18n): Quando implementar next-intl, esta página e os links de documentação
 * serão automaticamente traduzidos com base no idioma do navegador do usuário.
 */

function ExampleCheckoutForm() {
  const searchParams = useSearchParams();
  const t = useTranslations('checkout');
  const tA11y = useTranslations('a11y');
  const [planId, setPlanId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [successUrl, setSuccessUrl] = useState<string>("");
  const [cancelUrl, setCancelUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [planName, setPlanName] = useState<string>("");

  useEffect(() => {
    const plan = searchParams.get("plan") || "";
    setPlanId(plan);
    setUserId(searchParams.get("userId") || "");
    setSuccessUrl(searchParams.get("success") || "/settings?section=plan");
    setCancelUrl(searchParams.get("cancel") || "/settings?section=plan");

    // Formatar nome do plano
    const name = plan.replace("plan_", "").replace(/_/g, " ");
    setPlanName(name.charAt(0).toUpperCase() + name.slice(1));
  }, [searchParams]);

  const handleSuccess = async () => {
    if (!userId || !planId) {
      window.location.href = successUrl;
      return;
    }

    setLoading(true);

    try {
      // Simula webhook call para atualizar plano do usuário
      await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment.succeeded",
          userId: userId,
          planId: planId,
          transactionId: `test_${Date.now()}`,
        }),
      });

      // Aguarda um pouco para simular processamento
      await new Promise((resolve) => setTimeout(resolve, 800));

      window.location.href = successUrl;
    } catch (err) {
      console.error("Erro ao simular webhook:", err);
      window.location.href = successUrl;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCanceling(true);
    // Pequeno delay para mostrar o spinner
    setTimeout(() => {
      window.location.href = cancelUrl;
    }, 500);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: GRADIENTS.pageAuth }}
    >
      <AnimatedBackground variant="default" withGrid={true} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src="/logo.png"
              alt={tA11y('logoAlt', { siteName: SITE_NAME_FULL })}
              width={50}
              height={50}
              className="w-12 h-12"
            />
            <h1 className="text-5xl font-bold">
              <span
                style={{
                  background: GRADIENTS.primaryText,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {SITE_NAME}
              </span>
              {SITE_NAME_SUFFIX && (
                <span className="text-white">{SITE_NAME_SUFFIX}</span>
              )}
            </h1>
          </div>
        </div>

        {/* Card */}
        <div
          className="border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-black/40"
          style={{ background: GRADIENTS.surface }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${COLORS.primary}20` }}
            >
              <CreditCard className="w-8 h-8" style={{ color: COLORS.primary }} aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('testCheckout')}</h2>
          </div>

          {/* Aviso de modo de desenvolvimento */}
          <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-900/50 bg-yellow-950/30 mb-6">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm text-yellow-400">
                {t('devWarning')}{" "}
                <Link
                  href="https://github.com/techbeme/allflix/wiki/PAYMENT_SETUP.pt-BR.md"
                  target="_blank"
                  className="font-medium hover:opacity-80 transition-colors underline"
                  style={{ color: COLORS.primary }}
                >
                  {t('seeDocumentation')}
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Informações do plano */}
          <div className="mb-6">
            <div
              className="p-4 rounded-xl border border-white/[0.08]"
              style={{ background: GRADIENTS.inputAlt }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-sm">{t('plan')}</span>
                <span className="text-white font-semibold">{planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">{t('status')}</span>
                <span className="text-green-400 font-medium text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {t('testMode')}
                </span>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            <Button
              onClick={handleSuccess}
              disabled={loading || canceling}
              className="w-full text-white py-6 text-base font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: COLORS.primary }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  {t('processing')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  {t('completePayment')}
                </span>
              )}
            </Button>

            <button
              onClick={handleCancel}
              disabled={loading || canceling}
              className="w-full py-3.5 px-4 rounded-xl text-gray-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ background: GRADIENTS.inputAlt }}
            >
              {canceling ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  {t('canceling')}
                </>
              ) : (
                <>
                  <X className="w-5 h-5" aria-hidden="true" />
                  {t('cancelPayment')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExampleCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: GRADIENTS.pageAuth }}
        >
          <Loader2
            className="w-12 h-12 animate-spin"
            style={{ color: COLORS.primary }}
            aria-hidden="true"
          />
        </div>
      }
    >
      <ExampleCheckoutForm />
    </Suspense>
  );
}
