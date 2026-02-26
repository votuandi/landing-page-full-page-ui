# Trọng Tín Solar - Landing Page

A modern, responsive landing page for a solar energy distribution company built with Next.js, TypeScript, and TailwindCSS.

## Features

- ✅ **Modern Stack**: Next.js 15, TypeScript, TailwindCSS
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

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run development server**

   ```bash
   npm run dev
   ```

3. **Open browser**
   ```
   http://localhost:3000
   ```

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

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **TailwindCSS** - Utility-first CSS framework
- **React 19** - Latest React features
- **ESLint** - Code linting and formatting

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
