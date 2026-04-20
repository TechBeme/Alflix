-- AlterTable: Add trial fields to User
-- trialEndsAt: data de expiração do teste grátis (null = sem trial)
-- trialUsed: impede que o mesmo email use o trial mais de uma vez
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialUsed" BOOLEAN NOT NULL DEFAULT false;
