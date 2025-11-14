# Khatm App

A web application for organizing collective Quran reading campaigns (Khatm Jama'i).

## Features

- Create and manage Quran reading campaigns
- Read Quran verses with Arabic text and Persian translation
- Audio playback with recitation by Mishary Rashid Alafasy
- Continuous auto-play mode for verses
- Track completion progress
- Share campaigns with others
- Admin panel for campaign management

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Supabase** - Database and authentication
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible UI components
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd khatm
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials.

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

Run the SQL scripts in the `scripts/` folder in order to set up your Supabase database:

1. `001_initial_schema.sql` - Create tables
2. `002_sample_data.sql` - Add sample data (optional)
3. Continue with remaining migration scripts

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and Supabase clients
- `/scripts` - Database migration scripts
- `/public` - Static assets

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## License

This project is private and proprietary.
