# Medical Prescription Scanner - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - This app handles sensitive medical data and requires user accounts for:
- Storing prescription history
- Syncing analysis results across devices
- Compliance with medical data regulations

**Implementation:**
- Use Google Sign-In (primary for Android)
- Include email/password as backup option
- Mock auth flow in prototype
- Required screens:
  - Login/Signup with privacy policy & terms links
  - Account screen with logout and delete account options (nested under Settings > Account > Delete with double confirmation)

### Navigation
**Tab Navigation (4 tabs + FAB):**
- **Home Tab**: Dashboard showing recent scans and quick stats
- **History Tab**: List of all analyzed prescriptions
- **Library Tab**: Searchable Egyptian drug database
- **Profile Tab**: User settings and account management
- **Floating Action Button (FAB)**: Camera scan (core action) - positioned bottom-right

### Screen Specifications

#### 1. Home Screen (Dashboard)
- **Purpose**: Quick access to scan and view recent analyses
- **Layout**:
  - Custom header with app logo and notification bell icon (right)
  - Non-scrollable main content with:
    - Large "Scan New Prescription" card with camera icon
    - "Recent Scans" section (last 3 items, scrollable horizontal cards)
    - Quick stats (total scans, last scan date)
  - Safe area: top: headerHeight + 16px, bottom: tabBarHeight + 16px

#### 2. Camera/Scan Screen (Modal)
- **Purpose**: Capture prescription image and process
- **Layout**:
  - Full-screen camera view
  - Transparent header with close button (left) and flash toggle (right)
  - Bottom overlay with:
    - Capture button (center, large circular)
    - Gallery icon (left of capture)
    - Guide text: "Align prescription within frame"
  - Processing overlay after capture with loading spinner
  - Safe area: top: insets.top + 16px, bottom: insets.bottom + 80px

#### 3. Analysis Results Screen
- **Purpose**: Display recognized medicines and AI recommendations
- **Layout**:
  - Default header with "Analysis Results" title, back button (left), PDF export icon (right)
  - Scrollable content with sections:
    - Original image thumbnail (tappable to expand)
    - "Recognized Medicines" cards (each showing drug name, confidence %)
    - "AI Recommendations" expandable section per medicine:
      - Dosing information
      - Interactions warning (red badge if present)
      - Contraindications (yellow badge if present)
      - General recommendations
    - "Export as PDF" button at bottom
  - Safe area: top: 16px, bottom: tabBarHeight + 16px

#### 4. History Screen
- **Purpose**: Browse all past prescription analyses
- **Layout**:
  - Default header with "History" title and search icon (right)
  - Search bar (hidden by default, appears when search icon tapped)
  - Scrollable list of prescription cards showing:
    - Date scanned
    - Thumbnail image
    - Number of medicines recognized
    - Tap to view full analysis
  - Empty state: "No scans yet" with scan button
  - Safe area: top: headerHeight + 16px, bottom: tabBarHeight + 16px

#### 5. Drug Library Screen
- **Purpose**: Search Egyptian drug database
- **Layout**:
  - Custom header with search bar (no title)
  - Filter chips below search (Category, Manufacturer)
  - Scrollable list of drug cards:
    - Drug name (Arabic & English)
    - Active ingredient
    - Manufacturer
    - Tap to view full details
  - Safe area: top: headerHeight + 16px, bottom: tabBarHeight + 16px

#### 6. Profile/Settings Screen
- **Purpose**: Account management and app preferences
- **Layout**:
  - Default header with "Profile" title
  - Scrollable form with sections:
    - User avatar (circular, tappable) and display name
    - "Account" section (email, logout, delete account)
    - "Preferences" section (language: Arabic/English, notifications)
    - "About" section (version, privacy policy, terms)
  - Safe area: top: 16px, bottom: tabBarHeight + 16px

## Design System

### Color Palette
**Medical Professional Theme (Trustworthy & Clean)**
- **Primary**: #2563EB (Medical Blue) - for CTAs and key actions
- **Secondary**: #059669 (Safe Green) - for success, confirmations
- **Warning**: #F59E0B (Amber) - for contraindications
- **Danger**: #DC2626 (Red) - for critical interactions
- **Background**: #F8FAFC (Light Gray)
- **Surface**: #FFFFFF (White)
- **Text Primary**: #1E293B
- **Text Secondary**: #64748B
- **Border**: #E2E8F0

### Typography
- **Headings**: Roboto Bold (24/20/18px)
- **Body**: Roboto Regular (16/14px)
- **Small**: Roboto Regular (12px)
- **Arabic Support**: Ensure RTL support for Egyptian users

### Visual Design
- **Icons**: Use Material Design icons (standard system icons for navigation, medical-specific icons from @expo/vector-icons)
- **Cards**: White background with subtle border (1px, borderColor), 12px border radius, no drop shadow
- **Touchable Feedback**: Ripple effect for all interactive elements (Android native)
- **FAB Specifications**:
  - 56x56dp circular button
  - Camera icon in white
  - Primary color background
  - Drop shadow: elevation: 6 (Android standard)
- **Critical Assets Needed**:
  - App logo (medical cross or prescription symbol)
  - Camera viewfinder frame overlay
  - 3 default user avatars with medical theme (stethoscope, prescription, pill bottle)
  - Empty state illustrations (no history, no results)

### Accessibility
- Minimum touch target: 48x48dp (Material Design standard)
- High contrast text ratios (WCAG AA)
- Support for TalkBack screen reader
- Large text scaling support
- Clear focus indicators

### Key Interactions
- **Image Capture**: Smooth camera to processing transition with loading state
- **Expandable Cards**: Smooth accordion animation for AI recommendations
- **Confidence Indicators**: Visual progress bars or percentage badges
- **Warning Highlights**: Red/yellow left border on interaction/contraindication cards
- **PDF Export**: Show toast notification on success with option to share