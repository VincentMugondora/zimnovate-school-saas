# Zimnovate School Management SaaS

A comprehensive, offline-first school management system built for African schools operating in low-bandwidth environments. Enables administrators, teachers, and parents to manage student enrollment, attendance, grades, and parent communication in real-time with full offline functionality.

## 🚀 Features

### Core Functionality
- **👥 Multi-Role System**: Administrators, Teachers, and Parents with role-based access
- **📱 Offline-First**: Work without internet, sync automatically when reconnected
- **⚡ Real-Time Sync**: Changes sync across devices instantly when online
- **📊 Attendance Tracking**: Quick mark attendance with bulk import capabilities
- **📝 Grade Management**: Enter grades by class with automatic status calculations
- **👨‍👩‍👧‍👦 Parent Portal**: Real-time access to child's progress and reports
- **📈 Analytics Dashboard**: Track enrollment trends, attendance rates, and grade distributions

### Technical Features
- **🌐 Low-Bandwidth Optimized**: Fast first page load (<3s on 3G)
- **📱 PWA Ready**: Installable as a mobile app
- **🔒 Secure**: JWT authentication with role-based access control
- **🏗️ Multi-Tenant**: Each school is completely isolated
- **♿ Accessible**: WCAG 2.1 AA compliant

## 🛠️ Tech Stack

### Frontend
- **Astro** - Static site generator with SSR for optimal performance
- **HTMX** - Dynamic updates without JavaScript bundles
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

### Backend & Database
- **Supabase** - PostgreSQL database with real-time API
- **Node.js/Express** - Optional backend for advanced caching
- **JWT** - Secure authentication tokens

### Offline & Sync
- **RxDB** - Offline-first JavaScript database with real-time sync
- **IndexedDB** - Browser local storage for structured data

### Deployment
- **Vercel** - Primary deployment platform
- **Netlify** - Alternative deployment option

## 📋 Prerequisites

- **Node.js** 18+ (check with: `node --version`)
- **npm** or **yarn** (check with: `npm --version`)
- **Git** (for version control)
- **Supabase** account (create at [supabase.com](https://supabase.com))

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/VincentMugondora/zimnovate-school-saas.git
cd zimnovate-school-saas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the project root:

```env
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Secret (change in production)
JWT_SECRET=your-secret-key-here-change-in-production

# API
PUBLIC_API_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

### 4. Set Up Supabase Database
1. Create a new project at [supabase.com](https://supabase.com)
2. Get your API credentials from Supabase → Settings → API
3. Run the SQL schema in Supabase SQL Editor (see `context/system_design.prd` for complete schema)

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
school-saas/
├── src/
│   ├── components/          # Reusable Astro/HTMX components
│   ├── layouts/             # Role-based layout wrappers
│   ├── pages/              # Page routes and API endpoints
│   ├── lib/                # Utilities and database clients
│   └── styles/             # Global styles
├── public/                 # Static assets
├── .env.local             # Environment variables
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind configuration
└── package.json           # Dependencies and scripts
```

## 🎯 User Roles & Permissions

### School Administrator
- ✅ Manage school settings and user accounts
- ✅ View analytics and reports
- ✅ Create teacher and parent accounts
- ✅ Full access to all student data

### Teacher
- ✅ Manage own classes and students
- ✅ Mark attendance quickly
- ✅ Enter and manage grades
- ✅ View class-specific analytics

### Parent & Student
- ✅ View child's/own attendance and grades
- ✅ Receive notifications
- ✅ Access progress reports
- ✅ Read-only access to academic data

## 🔄 Offline Sync Strategy

The application uses RxDB for offline-first functionality:

1. **Local First**: All data is stored locally in IndexedDB
2. **Automatic Sync**: Changes sync when internet is available
3. **Conflict Resolution**: Last-write-wins with timestamps
4. **Real-time Updates**: Changes sync across connected devices

## 📊 Performance Targets

- **First Contentful Paint**: <3 seconds on 3G
- **Sync Latency**: <5 seconds (P95) when online
- **Offline Uptime**: 100% data access when offline
- **Bundle Size**: <200KB gzipped (excluding assets)

## 🧪 Testing

### Test Offline Mode
1. Open Chrome DevTools
2. Go to Network tab
3. Select "Offline" throttling
4. Test all functionality - everything should work

### Test Sync
1. Make changes offline
2. Go back online
3. Verify changes sync to Supabase

## 🚀 Deployment

### Deploy to Vercel
```bash
npm run build
verly deploy
```

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Check TypeScript types
```

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" error**
```bash
npm install
npm run dev
```

**Port 3000 already in use**
```bash
npm run dev -- --port 3001
```

**Supabase connection fails**
- Check `.env.local` has correct URL and keys
- Verify Supabase project is active

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Astro** - For the amazing static site generator
- **Supabase** - For the excellent backend-as-a-service
- **RxDB** - For the offline-first database solution
- **HTMX** - For the simple yet powerful interactivity

---

**Built with ❤️ by Zimnovate for African schools**
