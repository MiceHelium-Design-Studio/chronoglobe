# News Map Platform

A production-ready MVP for a real-time map-based news platform built with Next.js, TypeScript, and modern web technologies.

## Features

- **Interactive Map**: Leaflet-powered map with location markers
- **Real-time News**: Server-side NewsAPI integration with filtering
- **User Authentication**: Firebase Auth with protected routes
- **Advanced Filters**: Category, date range, and location-based filtering
- **Bookmark System**: Save favorite articles (authenticated users)
- **Responsive Design**: Mobile-first layout with collapsible filters
- **State Management**: Redux Toolkit for complex state handling
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Maps**: Leaflet, React-Leaflet
- **Authentication**: Firebase Auth
- **News API**: NewsAPI.org
- **Deployment**: Ready for Vercel/Netlify

## Project Structure

```
src/
├── app/
│   ├── api/news/          # Server-side news API routes
│   ├── dashboard/         # Protected dashboard page
│   ├── login/            # Authentication pages
│   ├── signup/
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Home redirect
├── components/
│   ├── map/              # Map-related components
│   ├── news/             # News display components
│   ├── filters/          # Filter UI components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── features/
│   ├── auth/             # Authentication features
│   ├── news/             # News-related features
│   ├── map/              # Map features
│   └── bookmarks/        # Bookmark functionality
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # External service integrations
├── store/                # Redux store and slices
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## Getting Started

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd news-map-platform
   npm install
   ```

2. **Environment Setup**:
   - Copy `.env.local.example` to `.env.local`
   - Add your NewsAPI key: `NEWS_API_KEY=your_key_here`
   - Configure Firebase credentials

3. **Firebase Setup**:
   - Create a Firebase project
   - Enable Authentication
   - Add your Firebase config to `.env.local`

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

```env
# News API (Server-side only)
NEWS_API_KEY=your_news_api_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Optional: Stripe for future subscriptions
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Key Features Implementation

### Server-Side News API
- Secure API key handling on server-side
- Request deduplication and error handling
- Rate limiting ready

### Authentication Flow
- Firebase Auth integration
- Protected routes with middleware
- Persistent sessions

### Advanced Filtering
- Debounced search inputs
- Category and date range filters
- Location-based news queries

### Bookmark System
- Redux-persisted bookmarks
- User-specific saved articles
- Local storage fallback

### Responsive Design
- Mobile-first approach
- Collapsible filter panel
- Touch-friendly interactions

## Future Enhancements

- **Stripe Subscriptions**: Premium features integration
- **Real-time Updates**: WebSocket connections for live news
- **Offline Support**: Service worker and caching
- **Push Notifications**: Browser notifications for breaking news
- **Social Features**: Article sharing and comments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Redux Toolkit
- Leaflet
- Firebase
- NewsAPI
