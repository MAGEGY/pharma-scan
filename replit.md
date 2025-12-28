# MedScan Egypt

## Overview

MedScan Egypt is a mobile application that allows users to scan handwritten medical prescriptions using their device camera, extract medicine names using AI-powered OCR, and receive detailed information about Egyptian pharmaceutical drugs including dosing, interactions, contraindications, and recommendations.

The app is built as a React Native/Expo application with an Express.js backend, using OpenAI's vision capabilities for prescription analysis against a local Egyptian drug database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React Native/Expo)
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation with native stack and bottom tabs
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Approach**: Custom themed components with dark/light mode support via `useTheme` hook
- **Animations**: React Native Reanimated for smooth interactions
- **Storage**: AsyncStorage for persisting scan history locally on device

**Key Design Patterns:**
- Path aliases: `@/` maps to `./client`, `@shared/` maps to `./shared`
- Themed components (`ThemedText`, `ThemedView`, `Card`, `Button`) for consistent styling
- Screen-specific hooks (`useScanHistory`, `useTheme`, `useScreenOptions`)
- 4-tab navigation (Home, History, Library, Profile) with floating action button for camera

### Backend (Express.js)
- **Server**: Express.js with TypeScript
- **AI Integration**: OpenAI API (via Replit AI Integrations) for prescription OCR and analysis
- **Database**: PostgreSQL with Drizzle ORM (currently using in-memory storage for users)
- **Architecture**: Route handlers in `server/routes.ts`, modular integrations in `server/replit_integrations/`

**Core API Endpoint:**
- `POST /api/analyze-prescription` - Accepts base64 image, returns extracted medicines and recommendations

**Drug Matching:**
- Local Egyptian drug database (`server/egyptianDrugs.ts`) with 12 common medications
- AI extracts medicine names from prescription images
- Server matches against database for detailed drug information

**Drug Database includes:**
- Augmentin, Panadol Extra, Concor, Glucophage, Zyrtec, Cipro
- Amaryl, Nexium, Lipitor, Ventolin, Aspirin Protect, Januvia
- Each drug has: Arabic name, active ingredient, dosing, interactions, contraindications, side effects

### Data Layer
- **Schema**: Drizzle ORM with PostgreSQL dialect (`shared/schema.ts`)
- **Current Tables**: `users` table for authentication (not yet fully implemented)
- **Chat Models**: Additional conversation/message tables for chat integration feature
- **Storage Pattern**: Interface-based storage abstraction (`IStorage`) allowing swap between memory and database

### Build System
- **Development**: Concurrent Expo and Express dev servers
- **Production**: Static Expo web build with esbuild for server bundling
- **Scripts**: Custom build script (`scripts/build.js`) for deployment

## External Dependencies

### AI Services
- **OpenAI API** (via Replit AI Integrations): GPT-4.1 for prescription OCR and medicine extraction, gpt-image-1 for image generation
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Database
- **PostgreSQL**: Connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and migrations (`drizzle-kit push`)

### Mobile Platform Services
- **expo-camera**: Prescription photo capture
- **expo-image-picker**: Gallery image selection
- **expo-print** / **expo-sharing**: PDF report generation and sharing
- **expo-haptics**: Tactile feedback on interactions

### Third-Party Libraries
- **TanStack React Query**: API request caching and state management
- **React Native Reanimated**: Gesture-driven animations
- **React Native Gesture Handler**: Touch handling
- **React Native Keyboard Controller**: Keyboard-aware scrolling
- **p-limit** / **p-retry**: Rate limiting and retry logic for batch AI requests