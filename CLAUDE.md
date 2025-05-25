# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiraiCare 360 is a React Native (Expo) healthcare SaaS application targeting elderly users (65-79) and their families in Japan. It provides integrated fall/frailty/mental health risk assessment and family notification via LINE Notify.

## Common Development Commands

```bash
# Development
npm start                 # Start Expo development server
npm run ios              # Run on iOS simulator (macOS required)
npm run android          # Run on Android emulator/device
npm run web              # Run on web browser

# Quality Assurance
npm run lint             # Run ESLint for code quality
npm test                 # Run Jest tests

# Package Management
npm install              # Install dependencies
```

## Architecture & Core Structure

### App Flow & Navigation
- **App.tsx**: Main entry point handling authentication state and conditional rendering
- **src/navigation/AppNavigator.tsx**: Navigation structure with Tab navigator for main screens and Stack navigator for modal screens
- Authentication gates: LoginScreen → OnboardingScreen (new users) → Main Tab Navigator

### Key Architectural Patterns

1. **Firebase-First Architecture**
   - Firebase Auth for authentication with Firestore user document sync
   - Real-time Firestore listeners for live data updates
   - Centralized Firebase configuration in `src/config/firebase.ts`
   - Type-safe Firestore operations with defined collections (`COLLECTIONS` constant)

2. **Type System Organization**
   - All types centralized in `src/types/index.ts`
   - Separate interfaces for User, VitalData, MoodData, RiskScore, Badge, Reminder
   - Navigation types (RootStackParamList, TabParamList) for type-safe navigation
   - Accessibility-focused design tokens (Colors, FontSizes, TouchTargets, Spacing)

3. **Screen Architecture**
   - Tab-based main navigation: Home, Activity, Mood, Settings
   - Stack-based modal screens: Reminders, Badges, Reminiscence, CBTCoach
   - Each screen component follows consistent naming: `[Name]Screen.tsx`

4. **Service Layer**
   - `src/services/authService.ts`: Authentication operations with user-friendly Japanese error messages
   - Real-time Firebase Auth state subscription with Firestore user sync
   - Centralized error handling for elderly users (simplified, clear messages)

### Accessibility & Elderly-First Design
- **High Contrast**: All colors meet WCAG 4.5:1 contrast requirements
- **Large Touch Targets**: Minimum 56dp, recommended 64dp+ for buttons
- **Large Fonts**: Minimum 20pt, standard 24pt, important content 36pt+
- **Clear Navigation**: Simple tab structure, emoji icons for visual clarity
- **Japanese Localization**: All user-facing text in Japanese

### Development Workflow Rules
- Follow project-specific conventions from `.cursor/rules/miraicare-rule.mdc`
- Reference requirements (`doc/requirements.md`), features (`doc/features.md`), and screen designs (`doc/screen_design.md`) before implementing
- Confirm requirements before implementation - do not proceed without 95%+ confidence
- Firebase-first approach for all backend operations
- TypeScript strict mode enabled - maintain type safety
- Focus on simplicity and clarity for elderly users

### Key Firebase Collections
```typescript
COLLECTIONS = {
  USERS: 'users',
  VITALS: 'vitals', 
  MOODS: 'moods',
  REMINDERS: 'reminders',
  BADGES: 'badges'
}
```

### Environment & Dependencies
- Expo ~53.0.9 with React Native 0.79.2
- Firebase 11.8.1 for backend services
- React Navigation 7.x for navigation
- TypeScript ~5.8.3 with strict mode
- Development on Windows environment

When implementing new features, always check existing patterns in similar components, maintain the established Firebase-first architecture, and prioritize accessibility for elderly users.

特に、エラーが発生してそれを解決しようとしている時は、よく調べてよくThinkしてメタ認知を働かせてコードの修正を行ってください。95%の確証を得るまでsequential thinkingを行ってください。