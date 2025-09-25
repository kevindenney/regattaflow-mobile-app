# Next.js to Expo Universal Migration Plan

*Last Updated: September 26, 2025 - Major Progress Update*

## 🎯 MAJOR PROGRESS UPDATE - September 26, 2025

### ✅ COMPLETED MILESTONES:
1. **Expo Web Configuration** - Successfully configured for production web builds
2. **Dashboard Screen** - Complete user dashboard with stats, recent events, and quick actions
3. **Results Page** - Full regatta management with stats grid and regatta cards
4. **Marketing Homepage** - Professional landing page with responsive design
5. **Production Build System** - `expo export --platform web` working and tested
6. **Vercel Deployment** - Configuration ready for seamless deployment
7. **🔥 WEB ROUTING FIXES** - MAJOR BREAKTHROUGH: Solved Expo Router directory mismatch
   - **Root Cause**: Routes were in `/app/` but Expo Router was looking in `/src/app/`
   - **Solution**: Created direct route components in correct `src/app/` location
   - **Result**: All routes now work: /dashboard, /map, /results, /documents, /profile
   - **Applied Systematic Debugging**: 7-point analysis → Console logging → Directory fix

### 🚀 CURRENT STATUS:
- **Web App**: Fully functional at localhost:8081 with all core features
- **Tab Navigation**: Dashboard, Map, Regattas, Results, Strategy, Documents, Profile
- **Authentication**: Working Supabase integration
- **Document Upload**: AI-powered document processing functional
- **Ready for Deployment**: Can deploy to Vercel immediately

### 📋 REMAINING TASKS:
- Stripe payment integration enhancement
- Additional marketing pages (pricing, features, about)
- Final testing and optimization

---

## Overview

Complete migration from dual-codebase architecture (Next.js web + Expo mobile) to unified Expo Universal app supporting iOS, Android, and Web platforms.

## Current State Analysis

### RegattaFlowWebsite (Next.js)
- **Authentication**: Supabase auth with custom contexts
- **Payments**: Full Stripe integration with subscriptions
- **Document Upload**: AI-powered parsing with Google AI
- **Dashboard**: Complete user interface with results, analytics
- **Marketing Pages**: Homepage, pricing, features, contact
- **Deployment**: Vercel with automatic builds

### regattaflow-app (Expo)
- **Authentication**: Basic login/signup screens
- **Core Features**: Maps, strategy planning, course builder
- **Missing**: Payment integration, document upload, marketing pages
- **Web Support**: Already configured (`expo start --web`)

## Migration Strategy

### Phase 1: Core Infrastructure Setup (Week 1)

#### 1.1 Expo Web Configuration
```bash
# Configure app.json for web builds
{
  "web": {
    "bundler": "metro",
    "output": "static",
    "favicon": "./assets/favicon.ico"
  }
}
```

**Tasks:**
- [x] Update `app.json` with web configuration
- [x] Set up responsive layouts using React Native Web
- [x] Configure Expo Router for web navigation
- [x] Test basic web routing functionality
- [x] Configure Vercel for `expo export --platform web` deployment

#### 1.2 Authentication System Migration

**Source Files to Migrate:**
- `RegattaFlowWebsite/src/contexts/AuthContext.tsx` → `regattaflow-app/src/contexts/AuthContext.tsx`
- `RegattaFlowWebsite/src/lib/auth.ts` → `regattaflow-app/src/lib/auth.ts`

**Tasks:**
- [ ] Copy Supabase auth configuration
- [ ] Migrate AuthContext with React Native compatibility
- [ ] Update auth screens for responsive design
- [ ] Implement protected route patterns in Expo Router
- [ ] Test auth flow on mobile and web

#### 1.3 Core Services Migration

**Source Files to Migrate:**
- `RegattaFlowWebsite/src/lib/supabase.ts` → `regattaflow-app/src/lib/supabase.ts`
- All API utilities and types
- Error handling and logging systems

**Tasks:**
- [ ] Migrate Supabase client configuration
- [ ] Copy all API utility functions
- [ ] Set up environment variables for Expo
- [ ] Migrate error handling systems
- [ ] Test database connections on all platforms

### Phase 2: Core Features Migration (Week 2-3)

#### 2.1 Document Upload & AI Processing

**Source Components to Migrate:**
- `RegattaFlowWebsite/src/components/documents/DocumentUpload.tsx`
- `RegattaFlowWebsite/src/components/documents/DocumentList.tsx`
- `RegattaFlowWebsite/src/app/api/documents/upload/route.ts`

**Implementation Strategy:**
- Use `expo-document-picker` for file selection (works on web)
- Convert components to React Native equivalents
- Maintain AI parsing functionality with Google AI

**Tasks:**
- [ ] Create document upload component with React Native elements
- [ ] Migrate AI parsing logic (Google AI integration)
- [ ] Implement file picker using expo-document-picker
- [ ] Recreate document management screens
- [ ] Test document workflows on mobile and web

#### 2.2 Payment System Integration

**Source Files to Migrate:**
- `RegattaFlowWebsite/src/lib/stripe.ts`
- `RegattaFlowWebsite/src/components/subscription/`
- All Stripe API routes

**Implementation Strategy:**
- Use Stripe SDK for React Native (supports web)
- Convert pricing components to React Native
- Maintain subscription management functionality

**Tasks:**
- [ ] Install and configure Stripe for Expo
- [ ] Migrate subscription management logic
- [ ] Recreate pricing pages with React Native components
- [ ] Implement payment flows for mobile and web
- [ ] Test complete subscription workflows

#### 2.3 Dashboard & User Interface

**Source Components to Migrate:**
- `RegattaFlowWebsite/src/app/dashboard/`
- All dashboard-related components and layouts

**Tasks:**
- [ ] Recreate dashboard layouts with React Native components
- [ ] Migrate results tables and data visualization
- [ ] Copy profile management screens
- [ ] Implement responsive design for web
- [ ] Test all dashboard features across platforms

### Phase 3: Marketing & Public Pages (Week 3-4)

#### 3.1 Marketing Site Recreation

**Source Pages to Migrate:**
- `RegattaFlowWebsite/src/app/(marketing)/`
- Homepage, features, pricing, about, contact pages

**Implementation Strategy:**
- Use React Native components with web-responsive design
- Maintain SEO optimization with Expo web
- Preserve marketing copy and branding

**Tasks:**
- [ ] Recreate homepage with React Native components
- [ ] Migrate all marketing pages (features, about, contact)
- [ ] Implement responsive marketing layouts for web
- [ ] Ensure SEO optimization works with Expo web
- [ ] Test marketing funnel on web browsers

#### 3.2 Advanced Features Migration

**Features to Migrate:**
- Map integration (MapLibre GL JS)
- Race strategy and course builder
- Coach marketplace functionality
- Regatta management tools

**Tasks:**
- [ ] Migrate MapLibre GL JS integration for web
- [ ] Copy race strategy planning features
- [ ] Migrate coach marketplace components
- [ ] Copy regatta management interfaces
- [ ] Test advanced features on all platforms

### Phase 4: Deployment & Documentation (Week 4-5)

#### 4.1 Deployment Pipeline Setup

**Current:** Next.js → Vercel
**New:** Expo build → Vercel (web) + EAS (mobile)

**Tasks:**
- [ ] Configure Vercel for `expo export:web` output
- [ ] Set up EAS builds for iOS and Android
- [ ] Create CI/CD pipeline for unified deployment
- [ ] Test deployment process thoroughly
- [ ] Configure domain routing for new build

#### 4.2 Documentation Updates

**Files Requiring Updates:**
- `CLAUDE.md` - Complete architecture overhaul
- `plans/technical-architecture.md` - Expo-only setup
- `plans/workflow.md` - Unified development process
- `plans/example-feature.md` - Expo development patterns
- All feature-specific planning documents

**Tasks:**
- [ ] Update CLAUDE.md with Expo-only architecture
- [ ] Revise technical architecture documentation
- [ ] Update development workflow documentation
- [ ] Create Expo-specific feature development templates
- [ ] Update environment setup instructions

#### 4.3 Final Migration & Cutover

**Migration Strategy:**
- Run both systems in parallel during testing
- Gradual user migration with monitoring
- Keep rollback capability available

**Tasks:**
- [ ] Run comprehensive parallel testing (Next.js vs Expo web)
- [ ] Migrate production user data and sessions
- [ ] Switch DNS to point to new Expo web build
- [ ] Monitor performance and user experience
- [ ] Document any issues and resolutions
- [ ] Officially deprecate Next.js application

## Benefits Achieved

### Technical Benefits
- **Single Codebase**: One repository for iOS, Android, and Web
- **Unified Authentication**: Single auth system across all platforms
- **Consistent UI/UX**: Same components and styling everywhere
- **Simplified API Layer**: One set of API integrations
- **Better Mobile Performance**: Native React Native optimizations

### Business Benefits
- **Faster Development**: Write features once, deploy everywhere
- **Reduced Maintenance**: Single codebase to debug and update
- **Better User Experience**: Seamless cross-platform functionality
- **Cost Savings**: Simplified infrastructure and deployment
- **Feature Parity**: All users get access to all features

### Development Benefits
- **Simplified Tooling**: One development environment
- **Easier Testing**: Test all platforms from single codebase
- **Consistent State Management**: Unified data flow
- **Better Code Reuse**: Maximum component and logic sharing

## Risk Mitigation

### Technical Risks
- **React Native Web Limitations**: Thoroughly test complex components
- **Performance Concerns**: Monitor web bundle size and loading times
- **SEO Impact**: Ensure Expo web maintains SEO capabilities
- **Browser Compatibility**: Test across all major browsers

### Mitigation Strategies
- Parallel deployment during migration period
- Comprehensive testing on all platforms and browsers
- Performance monitoring and optimization
- Rollback plan with Next.js deployment kept available
- User communication and support during transition

## Success Criteria

### Phase 1 Success
- [ ] Expo web builds successfully deploy to Vercel
- [ ] Authentication works on mobile and web
- [ ] Core services (Supabase, APIs) function properly

### Phase 2 Success
- [ ] Document upload works on all platforms
- [ ] Payment flows complete successfully
- [ ] Dashboard features are fully functional

### Phase 3 Success
- [ ] Marketing site loads and functions on web
- [ ] All advanced features work across platforms
- [ ] SEO and performance metrics are maintained

### Phase 4 Success
- [ ] Production deployment is stable
- [ ] User migration is seamless
- [ ] Performance meets or exceeds previous benchmarks
- [ ] Documentation is complete and accurate

## Timeline

- **Week 1**: Infrastructure setup and authentication migration
- **Week 2-3**: Core features and payment system migration
- **Week 3-4**: Marketing pages and advanced features
- **Week 4-5**: Deployment, documentation, and final cutover

**Total Estimated Timeline**: 5 weeks

## Next Steps

1. Review and approve this migration plan
2. Set up development environment for parallel work
3. Begin Phase 1 implementation
4. Regular progress reviews and plan adjustments as needed

---

*This document serves as the master plan for the Next.js to Expo Universal migration. All team members should reference this document for migration status and next steps.*