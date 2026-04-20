import { prisma } from '../lib/prisma';

async function main() {
    console.log('🌱 Seeding database...');

    // Criar planos com IDs fixos (upsert para evitar duplicação)
    const plans = [
        {
            id: 'plan_individual',
            name: 'Individual',
            screens: 1,
            priceMonthly: 19.90,
            priceYearly: 199.00,
            active: true,
        },
        {
            id: 'plan_duo',
            name: 'Duo',
            screens: 2,
            priceMonthly: 29.90,
            priceYearly: 299.00,
            active: true,
        },
        {
            id: 'plan_familia',
            name: 'Família',
            screens: 4,
            priceMonthly: 39.90,
            priceYearly: 399.00,
            active: true,
        },
    ];

    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { id: plan.id },
            update: plan,
            create: plan,
        });
        console.log(`✅ Created/Updated plan: ${plan.name} (${plan.id})`);
    }

    console.log('✨ Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
