# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a graduation requirement tracking system for Seoul National University students. The system allows students to track credit progress with bucket-based credit management (전필/전선/교양/공대공통/복수전공), dynamic semester management, and course name tracking.

## Development Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Project Structure

```
src/
├── components/          # UI components
│   ├── Header.tsx      # App header with simplified title
│   ├── RequirementCards.tsx  # Progress cards with detailed breakdowns
│   └── SemesterGrid.tsx      # Dynamic semester grid with add/remove functionality
├── stores/
│   └── creditStore.ts  # Zustand stores for state management (credit + profile)
├── types/
│   └── index.ts        # TypeScript type definitions and graduation rules
├── utils/
│   └── calculations.ts # Credit calculation logic with dual major support
└── index.css          # Global styles
```

## Key Requirements

### Performance Targets
- Credit input → update response: <150ms
- User interaction: <30 clicks to completion
- Real-time progress updates

### Core Features
- **Dynamic Semester Management**: Add/remove semesters beyond default 8
- **Course Name Input**: Optional course naming for better tracking
- **Bucket-based Credit System**: 6 buckets (MR, ME, LB, EC, OMR, OME)
- **Dual Major Support**: Toggles main major requirement (62↔48 credits)
- **Real-time Progress**: Live calculation with detailed breakdowns
- **Major-specific Tracking**: 주전공/복수전공 distinction for courses

### Current Graduation Requirements
- **전공**: 62학점 (단일전공) / 48학점 (복수전공시)
  - 전공필수: 36학점, 전공선택: 26학점
- **교양**: 50학점 (기본소양·교양 + 수학·과학·전산 통합)
- **공대공통**: 3학점
- **복수전공**: 39학점 (복수전공 활성화시)
  - 복수전공필수: 20학점, 복수전공선택: 19학점
- **졸업**: 130학점 (전체)

### Business Rules
- No negative credit values
- 0.5 credit increments supported
- Default credit input: 3
- Manual bucket classification only
- Dual major credits count toward graduation total
- Cannot delete semesters with existing courses

## Technical Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand with persist middleware
- **Data Storage**: LocalStorage (`snu-credit-store`, `snu-profile-store`)
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Build Tool**: Vite

### Enhanced Data Models
```typescript
interface CreditTxn {
  id: string
  term: SemesterType      // "1-1", "1-2", etc. (expandable)
  bucket: BucketType      // MR, ME, LB, EC, OMR, OME
  credits: number         // 0.5 increments
  courseName?: string     // Optional course name
  major?: MajorType       // "주전공" | "복수전공" for MR/ME buckets
  note?: string
  createdAt: Date
}

interface RequirementStatus {
  bucket: string
  current: number
  required: number
  remaining: number
  isComplete: boolean
  percentage: number
}

// 6 Bucket System
type BucketType = 'MR' | 'ME' | 'LB' | 'EC' | 'OMR' | 'OME'
// MR: 전공필수, ME: 전공선택, LB: 교양, EC: 공대공통
// OMR: 복수전공필수, OME: 복수전공선택

type MajorType = '주전공' | '복수전공'
```

### State Management Architecture
- **useCreditStore**: 
  - Credit transactions with CRUD operations
  - Dynamic semester management (add/remove)
  - Real-time calculation engine
  - Totals tracking for all buckets
- **useProfileStore**: 
  - Dual major toggle functionality
  - Triggers recalculation when toggled

## Implementation Status

### ✅ Enhanced Features (Current)
- **Dynamic Semester System**: Unlimited semester addition/removal
- **Course Name Integration**: Optional course naming throughout UI
- **Major-specific Classification**: 주전공/복수전공 selection for relevant buckets
- **Detailed Progress Cards**: In-card breakdown of 전공필수/전공선택
- **Simplified Interface**: Merged categories, cleaner bucket system
- **Dual Major Logic**: Automatic requirement adjustment (62↔48 credits)
- **Enhanced UX**: Default 3-credit input, improved header text
- **Browser Integration**: Custom tab title "SNU 졸업요건"

### Core Architecture Features
1. **Real-time Calculations**: Sub-150ms response with automatic recalculation
2. **Data Persistence**: LocalStorage with versioning and migration support
3. **Type Safety**: Full TypeScript integration with verbatimModuleSyntax compliance
4. **Component Architecture**: Modular design with clear separation of concerns
5. **Error Handling**: Credit validation, semester conflict prevention

### Key Implementation Details
- **Dual Major Logic**: `const majorRequired = dualMajorEnabled ? 48 : rules.majorMin`
- **Dynamic Semesters**: Expandable beyond default 8 semesters with transaction checking
- **Bucket Labels**: Korean labels with simplified category system
- **Progress Visualization**: Cards with progress bars and detailed breakdowns
- **Default Values**: 3-credit default input for faster data entry

### Development Notes
- Use `--legacy-peer-deps` for npm install due to dependency conflicts
- Type-only imports required for verbatimModuleSyntax compliance
- LocalStorage automatic persistence with Zustand middleware
- Components use inline styles for rapid prototyping
- Real-time state synchronization between stores
- Semester management prevents deletion of semesters with active transactions

### Performance Optimizations
- Efficient recalculation only when state changes
- Minimal re-renders through proper state management
- Optimized component updates with React patterns
- LocalStorage batching for persistence

When working on this project, maintain the established patterns for dynamic semester management, dual major logic, and real-time calculations. Focus on user experience improvements while preserving data integrity and performance targets.