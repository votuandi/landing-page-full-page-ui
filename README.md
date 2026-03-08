# Trọng Tín Solar - Landing Page

A modern, responsive landing page for a solar energy distribution company built with Next.js, TypeScript, and TailwindCSS.

## Features

- ✅ **Modern Stack**: Next.js 15, TypeScript, TailwindCSS
- ✅ **State Management**: Redux Toolkit for centralized state
- ✅ **SEO Optimized**: Meta tags, structured data, sitemap
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Component-Based**: Modular, reusable components
- ✅ **Performance**: Optimized images, fonts, and loading
- ✅ **Accessibility**: WCAG compliant

## Components

### Layout Components

- `Header` - Navigation with mobile menu and search
- `Footer` - Contact info, links, and social media
- `Hero` - Main banner with call-to-action

### Content Components

- `ProductSection` - Product categories showcase
- `ProductCard` - Individual product display
- `NewsSection` - Latest news and articles
- `NewsCard` - News article preview

## Getting Started

### Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized setup)
- npm or yarn

### Installation

#### Option 1: Docker Setup (Recommended)

1. **Create environment file**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your database settings if needed.

2. **Start services with Docker**

   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Next.js application on port 3000

3. **Run database migrations**

   ```bash
   docker-compose exec nextjs npm run db:push
   ```

   Or generate Prisma client:
   ```bash
   docker-compose exec nextjs npm run db:generate
   ```

4. **Seed database with sample data** (Optional)

   ```bash
   docker-compose exec nextjs npm run db:seed
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

#### Option 2: Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Setup environment**

   ```bash
   cp .env.example .env
   ```

   Update `DATABASE_URL` in `.env` to point to your PostgreSQL database.

3. **Setup database**

   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Seed database with sample data** (Optional)

   ```bash
   npm run db:seed
   ```

   This will populate your database with:
   - 6 sample projects
   - 10 news articles
   - 8 services (household, business, maintenance, consultation)

5. **Run development server**

   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

### Database Scripts

- Generate Prisma client: `npm run db:generate`
- Push schema to database: `npm run db:push`
- Run migrations: `npm run db:migrate`
- Reset database (with safety checks): `npm run db:reset` ⚠️ See [DATABASE_SAFETY.md](./DATABASE_SAFETY.md)
- Open Prisma Studio: `npm run db:studio`
- Seed database: `npm run db:seed`

### Docker Commands

- Start services: `npm run docker:up` or `docker-compose up -d`
- Stop services: `npm run docker:down` or `docker-compose down`
- View logs: `npm run docker:logs` or `docker-compose logs -f`
- Rebuild containers: `npm run docker:build` or `docker-compose build`
- Access database: `docker-compose exec postgres psql -U postgres -d landing_page_db`

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/             # API routes
│   │   └── banners/     # Banner CRUD API
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout with SEO
│   ├── page.tsx         # Home page
│   └── sitemap.ts       # Dynamic sitemap
├── components/          # React components
│   ├── Header.tsx       # Main navigation
│   ├── Hero.tsx         # Hero section
│   ├── ProductSection.tsx
│   ├── ProductCard.tsx
│   ├── NewsSection.tsx
│   ├── NewsCard.tsx
│   └── Footer.tsx
├── lib/                 # Utility libraries
│   ├── store.ts         # Redux store configuration
│   ├── hooks.ts         # Typed Redux hooks
│   ├── StoreProvider.tsx # Redux Provider wrapper
│   ├── prisma.ts        # Prisma client instance
│   └── features/        # Redux slices
│       ├── banners/     # Banner state management
│       ├── introduction/ # Introduction state
│       └── database/    # Database status state
└── prisma/              # Database schema
    └── schema.prisma    # Prisma schema
```

## Key Features

### SEO Optimization

- Comprehensive meta tags
- Open Graph and Twitter Card support
- Structured data for search engines
- Automatic sitemap generation
- Robots.txt configuration

### Performance

- Next.js Image optimization
- Font optimization with Google Fonts
- TailwindCSS for efficient styling
- Component code splitting

### Responsive Design

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## Customization

### Colors

The color scheme is defined in `tailwind.config.ts`:

- Primary: Blue theme for professionalism
- Solar colors: Orange, blue, green, yellow
- Semantic colors for different states

### Content

- Update company information in components
- Modify product data in `ProductSection.tsx`
- Update news articles in `NewsSection.tsx`
- Customize contact details in `Footer.tsx`

### Styling

- Global styles in `src/app/globals.css`
- Component-specific styling using TailwindCSS
- Custom utilities for solar-themed effects

## Deployment

This project is ready for deployment on:

- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Any Node.js hosting service

## API Endpoints

### Banners API

- `GET /api/banners` - Get all banners (optional query params: `?isActive=true&orderBy=order`)
- `GET /api/banners/[id]` - Get a single banner by ID
- `POST /api/banners` - Create a new banner
- `PUT /api/banners/[id]` - Update a banner
- `DELETE /api/banners/[id]` - Delete a banner

#### Example: Create Banner

```bash
curl -X POST http://localhost:3000/api/banners \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Sale",
    "description": "Get 20% off on all solar panels",
    "imageUrl": "/images/banner.jpg",
    "linkUrl": "/products",
    "isActive": true,
    "order": 1
  }'
```

## Database

The project uses PostgreSQL with Prisma ORM. The database schema includes:

- **Product** - Product information
- **News** - News articles
- **Banner** - Banner/slider content

### Database Commands

- Generate Prisma Client: `npm run db:generate`
- Push schema changes: `npm run db:push`
- Create migration: `npm run db:migrate`
- Open Prisma Studio: `npm run db:studio`

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **TailwindCSS** - Utility-first CSS framework
- **React 19** - Latest React features
- **Redux Toolkit** - State management with RTK
- **React-Redux** - Official React bindings for Redux
- **Prisma** - Modern ORM for database access
- **PostgreSQL** - Relational database
- **Docker** - Containerization
- **ESLint** - Code linting and formatting

## State Management

This project uses **Redux Toolkit** for centralized state management. See [REDUX_SETUP.md](./REDUX_SETUP.md) for detailed documentation on:

- Redux store configuration
- Feature slices (banners, introduction, database)
- Typed hooks usage
- Best practices and patterns
- Integration with Next.js App Router

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

This project is proprietary software for Trọng Tín Solar.

## Support

For technical support or questions:

- Email: info@phanphoisolar.com
- Phone: 0909 019 234
