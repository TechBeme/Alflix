import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Cores principais
                primary: "var(--primary)",
                'primary-hover': "var(--primary-hover)",
                'primary-light': "var(--primary-light)",
                danger: "var(--danger)",
                
                // Backgrounds
                background: "var(--background)",
                foreground: "var(--foreground)",
                'bg-darkest': "var(--bg-darkest)",
                'bg-darker3': "var(--bg-darker3)",
                'bg-darker2': "var(--bg-darker2)",
                'bg-darker': "var(--bg-darker)",
                'bg-dark1': "var(--bg-dark1)",
                'bg-dark2': "var(--bg-dark2)",
                'bg-dark3': "var(--bg-dark3)",
                'bg-dark4': "var(--bg-dark4)",
                'bg-dark5': "var(--bg-dark5)",
                'bg-elevated': "var(--bg-elevated)",
                'bg-elevated2': "var(--bg-elevated2)",
                'bg-card': "var(--bg-card)",
                'bg-card2': "var(--bg-card2)",
                'bg-card3': "var(--bg-card3)",
                'bg-muted': "var(--bg-muted)",
                'bg-gray': "var(--bg-gray)",
                
                // Borders
                'border-default': "var(--border-default)",
                'border-light': "var(--border-light)",
                'border-lighter': "var(--border-lighter)",
                
                // Text
                'text-gray': "var(--text-gray)",
                'text-gray-light': "var(--text-gray-light)",
                'text-gray-dark': "var(--text-gray-dark)",
            },
            backgroundImage: {
                // Gradientes de texto comuns
                'gradient-text-white': 'linear-gradient(to right, var(--text-white), var(--text-gray-200), var(--text-gray-300))',
                'gradient-text-gray': 'linear-gradient(to right, var(--text-white), var(--text-gray))',
                'gradient-text-primary': 'linear-gradient(to right, var(--primary), var(--primary-light))',

                // Gradientes de fundo
                'gradient-primary': 'linear-gradient(to right, var(--primary), var(--primary-light))',
                'gradient-primary-hover': 'linear-gradient(to right, var(--primary-hover), var(--primary))',
                'gradient-hero-overlay': 'linear-gradient(to top, var(--background), rgba(0, 0, 0, 0.5), transparent)',
                'gradient-card-overlay': 'linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent)',
                'gradient-background-subtle': 'linear-gradient(to bottom right, rgba(139, 0, 0, 0.05), rgba(90, 0, 0, 0.03), var(--background))',

                // Gradientes radiais
                'gradient-radial-red': 'radial-gradient(circle at 20% 50%, rgba(139, 0, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(90, 0, 0, 0.05) 0%, transparent 50%)',
            },
        },
    },
    plugins: [],
};

export default config;
