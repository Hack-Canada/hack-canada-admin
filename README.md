# Hackathon Control (HC) Admin Dashboard

## Overview

A modern admin dashboard for managing hackathon participants, applications, and event logistics. Provides real-time analytics, user management, and communication tools for organizers.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with CSS Variables
- **UI Components**: Shadcn/ui + Radix Primitives
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL + Drizzle ORM
- **Charts**: Recharts
- **Deployment**: Vercel

## Design System

### Colors

**Core Palette (HSL Values):**

- Primary: `hsl(210 100% 56%)` (#0084FF) - Vibrant blue for primary actions
- Secondary: `hsl(33 100% 57%)` (#FF8A00) - Orange for secondary elements
- Destructive: `hsl(0 68% 58%)` (#E53E3E) - Red for errors/destructive actions
- Accent: `hsl(199 84% 55%)` (#1DA1F2) - Twitter-like blue for highlights

**Theme Variables:**

```css
/* Light Mode */
--background: 0 0% 100% (White) --foreground: 215 28% 17% (Dark slate)
  --muted: 220 14% 96% (Light gray) --border: 220 13% 91% (Medium gray)
  /* Dark Mode */ --background: 215 28% 17% (Dark slate) --foreground: 210 40%
  98% (Off white) --muted: 215 28% 25% (Dark gray) --border: 215 28% 25%
  (Medium slate);
```

**Chart Colors:**

- Light Mode: Earth tones (Terracotta, Forest Green, Navy, Mustard, Clay)
- Dark Mode: Vibrant palette (Royal Blue, Emerald, Amber, Violet, Coral)

### Typography

**Font Stack:**

- **Primary Font**: `Fredoka`
- **Secondary Font**: `Rubik`
- Optimal readability for dashboard interfaces with x-height balance

### Animations

- Built-in tailwindcss-animate plugin

## Project Structure

```
hc-admin/
├── app/               # Next.js app router
│   ├── (auth)/        # Authentication routes
│   ├── (dashboard)/   # Protected admin routes
│   └── api/           # API endpoints
├── components/        # Reusable components
│   ├── ui/            # Shadcn/ui primitives
│   ├── Charts/        # Data visualization
├── lib/               # Utilities/config
│   ├── db/            # Database config
│   └── validations/   # Form validations
├── actions/           # Server actions
└── types/             # TypeScript definitions
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- PostgreSQL

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/hc-admin.git
   cd hc-admin
   ```
2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure environment variables:**

   Copy the example environment file and update it with your credentials.

   ```bash
   cp .env.example .env.local
   ```

   **Required variables in `.env.local`:**

   ```env
   DATABASE_URL="postgres://..."
   NEXTAUTH_SECRET="..."
   NEXTAUTH_URL="http://localhost:3000"
   AWS_SES_REGION="..."
   AWS_SES_ACCESS_KEY="..."
   AWS_SES_SECRET_ACCESS_KEY="..."
   ```

4. **Apply database schema:**

   Push the schema to your PostgreSQL database.

   ```bash
   pnpm db:push
   ```

   > **Note:** This command is for development. For production, you should use `drizzle-kit generate` to create migration files.

5. **Create the first admin user:**

   Run the script to create an admin account.

   ```bash
   pnpm tsx scripts/create-admin-user.ts "Your Name" "your-email@example.com" "your-secure-password"
   ```

6. **Run the development server:**

   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`.

> Note: Actual color values are defined in CSS variables via `app/globals.css`
