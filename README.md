# RR Book Store

An online book store application built with React, TypeScript, Vite, and shadcn/ui. Features user authentication, product catalog, shopping cart, wishlist, checkout, and admin dashboard.

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API, TanStack React Query
- **Routing**: React Router DOM
- **Backend/Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth
- **Testing**: Vitest
- **Code Quality**: ESLint

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── layout/       # Layout components (Header, Footer)
│   ├── products/     # Product-related components
│   └── ui/          # shadcn/ui components
├── contexts/        # React contexts (Authentication)
├── hooks/          # Custom React hooks (useCart, useProducts, etc.)
├── integrations/   # Third-party integrations (Firebase config)
├── lib/           # Utility functions
├── pages/         # Page components (Auth, Products, Checkout, Admin, etc.)
└── test/         # Test files
```

## Features

- **User Authentication** - Sign up, login, and account management via Firebase Auth
- **Product Catalog** - Browse books and supplies with filtering using Firestore
- **Shopping Cart** - Add/remove items, manage quantities (stored in Firestore)
- **Wishlist** - Save favorite items for later
- **Checkout** - Address entry, payment method selection, coupon codes
- **Order Management** - View order history and track orders via Firestore
- **Admin Dashboard** - Manage products, orders, and promotional coupons in Firestore
- **Responsive Design** - Mobile-friendly interface with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- A [Firebase Project](https://console.firebase.google.com)

### Firebase Setup

Before running the app, you **must** set up Firebase:

1. Follow the [Firebase Setup Guide](./FIREBASE_SETUP.md) for step-by-step instructions
2. Create a `.env` file in the root directory with your Firebase credentials
3. See `.env.example` for the template

### Installation

1. Clone the repository:
```bash
git clone <YOUR_REPO_URL>
cd "rr book store"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm preview

# Run ESLint
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## Environment Variables

Create a `.env` file in the root directory with your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Get these values from your Firebase project settings in the Firebase Console.

## Authentication

The app uses Firebase Auth for user management. Users can:
- Sign up with email and password
- Sign in to their account
- Manage their profile and shipping addresses

User profiles are stored in Firestore for easy access and updates.

## Admin Features

Admin users have access to:
- **Products Management** - Create, edit, and delete products
- **Orders Management** - View and update order status
- **Coupons Management** - Create and manage discount codes

## Testing

Run the test suite:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Code Quality

The project uses ESLint for code quality. Run the linter:
```bash
npm run lint
```

## Build & Deployment

To create a production build:
```bash
npm run build
```

This generates optimized files in the `dist/` directory ready for deployment to any static hosting service (Vercel, Netlify, GitHub Pages, etc.)

## License

MIT
# rk-book-store
# rk-book-store
