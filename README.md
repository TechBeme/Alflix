<div align="center">

# 🎬 ALLFLIX - Modern Streaming Platform

**Professional portfolio project showcasing a full-stack streaming platform with Next.js, TypeScript, and modern web technologies**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-key-features) • [What You Get](#-what-you-get) • [Quick Start](#-quick-start) • [Tech Stack](#%EF%B8%8F-technology-stack) • [Configuration](#%EF%B8%8F-configuration) • [License](#-license)

**Languages:** [🇧🇷 Português](README.pt-BR.md) • [🇪🇸 Español](README.es.md)

</div>

---

## ⚠️ Portfolio Project Disclaimer

**This is a demonstration/portfolio project only.** ALLFLIX does NOT stream actual video content and is not a functional streaming service.

This project represents an **idealized concept** - imagine a scenario where a super-producer acquired rights to all entertainment content and made it available on a single unified platform. It's a "dream scenario" for educational and portfolio purposes.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [About the Developer](#-about-the-developer)
- [Key Features](#-key-features)
- [What You Get](#-what-you-get)
- [Technology Stack](#%EF%B8%8F-technology-stack)
- [Quick Start](#-quick-start)
- [Configuration](#%EF%B8%8F-configuration)
- [License](#-license)
- [Disclaimer](#%EF%B8%8F-disclaimer)

---

## 🎯 Overview

**ALLFLIX** is a professional full-stack portfolio project that demonstrates the implementation of a modern streaming platform interface. Built with cutting-edge technologies, it showcases advanced frontend development, backend architecture, database design, and API integrations.

**Key capabilities:**
- Modern, responsive UI inspired by leading streaming platforms
- Complete authentication system with secure session management
- Integration with TMDB API for 500,000+ movies and TV shows
- Advanced search and filtering functionality
- User profile management and watchlist features
- Performance-optimized with Next.js 16 App Router
- Production-ready code structure and best practices

---

## 👨‍💻 About the Developer

<div align="center">

**Developed by Rafael Vieira (TechBeme)**

[![GitHub](https://img.shields.io/badge/GitHub-TechBeme-181717?logo=github)](https://github.com/TechBeme)
[![Fiverr](https://img.shields.io/badge/Fiverr-Tech__Be-1DBF73?logo=fiverr)](https://www.fiverr.com/tech_be)
[![Upwork](https://img.shields.io/badge/Upwork-Profile-14a800?logo=upwork)](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)
[![Email](https://img.shields.io/badge/Email-contact@techbe.me-EA4335?logo=gmail)](mailto:contact@techbe.me)

**Full-Stack Developer & AI Automation Specialist**

Specialized in **modern web applications**, **automation systems**, **AI integrations**, and **full-stack development**.

### 💼 Core Expertise

- 💻 Full-Stack Development (Next.js, React, TypeScript, Node.js)
- 🎨 Modern UI/UX Development (Tailwind CSS, Framer Motion, shadcn/ui)
- 🗄️ Database Design & Optimization (PostgreSQL, Prisma, Supabase)
- 🔒 Authentication & Security Systems (Better Auth, JWT, OAuth)
- 🤖 AI Integrations (OpenAI, Anthropic, Claude, RAG systems)
- 🚀 Performance Optimization & SEO
- 📱 Responsive Design & Progressive Web Apps

### 🌍 Languages

🇺🇸 **English** • 🇧🇷 **Português** • 🇪🇸 **Español**

### 📬 Contact

**Email**: [contact@techbe.me](mailto:contact@techbe.me)

</div>

---

## ✨ Key Features

### User Interface & Experience
- **Modern Landing Page**: Hero section with smooth animations and compelling CTAs
- **Responsive Navigation**: Mobile-first navbar with search, notifications, and profile menu
- **Content Browsing**: Netflix-style horizontal scrolling rows organized by categories
- **Media Details Pages**: Comprehensive movie/TV show pages with cast, trailers, similar content
- **Advanced Search**: Real-time search with filters by genre, year, rating, and more
- **Dark Mode**: Eye-friendly dark theme with smooth transitions
- **Skeleton Loading**: Professional loading states for better perceived performance

### Authentication & User Management
- Passwordless authentication via Email OTP (one-time code)
- Session management with Better Auth
- Protected routes and API endpoints
- User profile management with avatar upload
- Email change functionality
- Account settings and preferences

### Content Management
- **TMDB Integration**: Access to 500,000+ movies and TV shows metadata
- **Dynamic Catalog**: Browse by trending, popular, top-rated, upcoming
- **My List**: Personal watchlist with add/remove functionality
- **Watch History**: Track viewing progress with resume capability
- **Continue Watching**: Quick access to recently watched content
- **Categories**: Movies, TV Shows, by genre, by decade

### Technical Excellence
- **Server-Side Rendering**: Fast initial page loads with Next.js SSR
- **Image Optimization**: Automatic WebP/AVIF conversion with Next.js Image
- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Handling**: Comprehensive error boundaries and user-friendly error pages
- **API Rate Limiting**: Protection against abuse
- **SEO Optimized**: Meta tags, Open Graph, structured data
- **Core Web Vitals**: Optimized for performance metrics
- **Modular Streaming**: Backend-agnostic video player with secure proxy layer
- **Modular Payments**: Gateway-agnostic payment system (Stripe, Mercado Pago, etc.)

---

## 📦 What You Get

### 1. Complete Web Application
- Next.js 16 application with App Router architecture
- 20+ pages including landing, browse, media details, profile
- 30+ reusable React components
- Full authentication flow (OTP login via email)
- Responsive design working on desktop, tablet, and mobile

### 2. Database Schema (PostgreSQL)
- `User`: User accounts
- `Session`: Secure session management
- `Plan`: Subscription plans (1, 2, 4 screens)
- `Watchlist`: User's saved content
- `WatchHistory`: Viewing history with progress tracking
- `WatchProgress`: Resume capability for each title

### 3. API Integration Layer
- TMDB API client with error handling and retry logic
- Authentication endpoints (OTP send, OTP verify, session)
- Content endpoints (browse, search, details)
- User endpoints (profile, watchlist, history)
- Streaming endpoints (prepared structure)

### 4. Documentation
- Comprehensive docs folder with guides and references
- API documentation and guidelines
- Development guidelines and coding standards
- Project summary and architecture overview
- Setup and configuration guides

### 5. Modular Streaming System 🎬
- **Backend-agnostic streaming architecture**: Connect any video source
- **API proxy layer**: Secure validation before accessing videos
- **Ready for integration**: S3/CloudFront, Cloudflare R2, custom CDN, or any backend
- **Production-ready security**: Authentication, plan validation, rate limiting support
- **Mock mode**: Test with sample videos without configuring backend
- **Complete documentation**: Implementation examples in Python, Node.js, Go

**See**: [`docs/STREAMING_API_IMPLEMENTATION.md`](./docs/STREAMING_API_IMPLEMENTATION.md) for details

### 6. Modular Payment Integration 💳
- **Gateway-agnostic payment system**: Works with any payment provider
- **Zero code changes**: Configure via environment variables only
- **External backend support**: Stripe, Mercado Pago, PayPal, or custom
- **Secure webhooks**: HMAC-SHA256 signature validation, idempotency
- **Development mode**: Built-in checkout example for testing
- **Production-ready**: Rate limiting, transaction logging, automatic plan updates
- **Provider system**: Easily switch between payment providers
- **Complete documentation**: Full implementation guide with examples

**See**: [`docs/PAYMENT_INTEGRATION.md`](./docs/PAYMENT_INTEGRATION.md) for complete guide

---

## 🛠️ Technology Stack

### Frontend (Next.js)

| Technology | Version | Purpose |
|------------|---------|----------|
| ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=next.js&logoColor=white) | 16.1+ | React framework with App Router |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | 5.0+ | Type-safe development |
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) | 19.2+ | UI library with Server Components |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind-38B2AC?logo=tailwind-css&logoColor=white) | 4.0+ | Utility-first CSS framework |
| **Radix UI** | Latest | Unstyled accessible components |
| **Framer Motion** | 12.0+ | Animation library for smooth transitions |
| **Lucide React** | Latest | Beautiful, consistent icon library |
| **React Query** | 5.0+ | Data fetching, caching, and synchronization |
| **React Player** | 3.4+ | Video player component |
| **Sonner** | 2.0+ | Toast notifications |

### Backend (Node.js)

| Technology | Version | Purpose |
|------------|---------|----------|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) | 20+ | JavaScript runtime environment |
| ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?logo=prisma&logoColor=white) | 7.3+ | Next-generation ORM with type safety |
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) | 15+ | Relational database |
| **Better Auth** | 1.4+ | Modern authentication library with Email OTP |
| **Axios** | 1.7+ | HTTP client with interceptors |

### External APIs

| Service | Purpose |
|---------|---------|
| **TMDB API** | Movie and TV show metadata (titles, posters, cast, trailers) |

### Development Tools & Infrastructure

| Tool | Purpose |
|------|---------|
| ![ESLint](https://img.shields.io/badge/-ESLint-4B32C3?logo=eslint&logoColor=white) | Code linting and formatting |
| **Jest** | Unit testing framework |
| **Testing Library** | Component testing utilities |
| **TypeScript** | Static type checking |
| **Prisma Studio** | Database GUI |

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js 20+** installed ([Download](https://nodejs.org/))
- **PostgreSQL database** (local or cloud provider like Neon, Supabase, Railway)
- **TMDB API key** (free at [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))

### Option 1: Local Development (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/TechBeme/allflix.git
cd allflix

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see Configuration section)

# 4. Set up database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # (Optional) Seed with sample data

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Option 2: Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Option 3: Database Management

```bash
# Open Prisma Studio (Database GUI)
npm run db:studio

# Create a new migration
npm run db:migrate

# View database in browser at http://localhost:5555
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database (PostgreSQL)
# Example for Neon: postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/allflix?sslmode=require
# Example for local: postgresql://postgres:password@localhost:5432/allflix
DATABASE_URL="postgresql://user:password@host:5432/allflix"

# TMDB API (get free key at https://www.themoviedb.org/settings/api)
TMDB_API_KEY="your_tmdb_api_key_here"
TMDB_API_BASE_URL="https://api.themoviedb.org/3"

# Authentication (generate random secure strings)
BETTER_AUTH_SECRET="your-secret-key-minimum-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Database Options

The project supports multiple PostgreSQL providers:

| Provider | Type | Best For |
|----------|------|----------|
| **[Neon](https://neon.tech/)** | Serverless | Auto-scaling, generous free tier |
| **[Supabase](https://supabase.com/)** | Managed | PostgreSQL + extras (auth, storage) |
| **[Railway](https://railway.app/)** | Managed | Simple deployment, fair pricing |
| **[Vercel Postgres](https://vercel.com/storage/postgres)** | Serverless | Integrated with Vercel hosting |
| **Local PostgreSQL** | Self-hosted | Full control, zero costs |

### Available Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting errors automatically
npm run type-check       # Run TypeScript type checking

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and apply migrations
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Prisma Studio (database GUI)

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode

# Analysis
npm run analyze          # Analyze bundle size
```

---

## 📝 License

**Proprietary License - All Rights Reserved**

Copyright © 2026 Rafael Vieira (TechBeme)

### ❌ Restrictions

- No commercial use without explicit written permission
- No modifications or derivative works
- No distribution, sublicensing, or public hosting
- No reverse engineering or decompilation
- No removal of copyright notices or attributions

### ✅ Permitted Use

- View source code for educational and learning purposes
- Run locally for personal, non-commercial study
- Fork for private, personal learning (not public repositories)
- Reference in portfolio, resume, or personal website

### 📧 Commercial Licensing

For commercial use, custom development, white-label solutions, or licensing inquiries:

**Contact**: [contact@techbe.me](mailto:contact@techbe.me)

---

## ⚠️ Disclaimer

This project is a **portfolio demonstration** and is **NOT** a functional streaming service. It does NOT:

- Stream actual video content
- Provide access to copyrighted material
- Function as a real streaming platform
- Violate any content distribution rights
- Encourage piracy or illegal content access

**This is an educational project** that demonstrates:
- Modern web development skills
- Full-stack application architecture
- API integration techniques
- UI/UX design capabilities

**TMDB Attribution**: This product uses the TMDB API but is not endorsed or certified by TMDB. All movie and TV show metadata is sourced from [The Movie Database (TMDB)](https://www.themoviedb.org/) under their API terms of service.

Users are solely responsible for compliance with all applicable laws and regulations in their jurisdiction.

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

[Next.js](https://nextjs.org/) • [React](https://reactjs.org/) • [TypeScript](https://www.typescriptlang.org/) • [Tailwind CSS](https://tailwindcss.com/) • [Prisma](https://www.prisma.io/) • [Radix UI](https://www.radix-ui.com/) • [Framer Motion](https://www.framer.com/motion/) • [Lucide Icons](https://lucide.dev/) • [TMDB](https://www.themoviedb.org/)

Special thanks to the open-source community for making projects like this possible.

---

<div align="center">

**Developed by [Rafael Vieira](https://github.com/TechBeme)**

[![GitHub](https://img.shields.io/badge/GitHub-TechBeme-181717?logo=github)](https://github.com/TechBeme)
[![Fiverr](https://img.shields.io/badge/Fiverr-Tech__Be-1DBF73?logo=fiverr)](https://www.fiverr.com/tech_be)
[![Upwork](https://img.shields.io/badge/Upwork-Profile-14a800?logo=upwork)](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)
[![Email](https://img.shields.io/badge/Email-contact@techbe.me-EA4335?logo=gmail)](mailto:contact@techbe.me)

</div>
