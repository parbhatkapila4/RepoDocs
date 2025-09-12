# Landing Page Components

This directory contains all the components for the RepoDoc landing page, organized into separate, reusable components.

## Component Structure

### Navigation.tsx
- Sticky navigation bar with logo and CTA buttons
- Responsive design with mobile-friendly layout
- GitHub OAuth integration ready

### Hero.tsx
- Main hero section with headline and subheadline
- Primary and secondary CTAs
- Visual mockup showing repo input → generated README
- Gradient text effects and modern styling

### Features.tsx
- 4 feature cards showcasing key capabilities
- AI-driven README & Docs
- Repo Intelligence
- One-click PR & Share
- Secure & Fast

### HowItWorks.tsx
- 3-step process explanation
- Visual step indicators
- Clear, developer-friendly language

### Demo.tsx
- Interactive demo section
- Repo URL input field
- Demo buttons for different frameworks
- Animated progress states

### DashboardPreview.tsx
- Repository analysis view
- Public documentation management
- Action buttons (view, download, create PR)
- Mock data for demonstration

### SocialProof.tsx
- Customer testimonials with 5-star ratings
- Target audience indicators
- Professional avatars and quotes

### FinalCTA.tsx
- Final call-to-action section
- Primary and secondary buttons
- Conversion-focused messaging

### Footer.tsx
- Complete footer with navigation links
- Legal pages and social media links
- Brand consistency

## Usage

```tsx
import {
  Navigation,
  Hero,
  Features,
  HowItWorks,
  Demo,
  DashboardPreview,
  SocialProof,
  FinalCTA,
  Footer
} from '@/components/landing'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <Demo />
      <DashboardPreview />
      <SocialProof />
      <FinalCTA />
      <Footer />
    </div>
  )
}
```

## Design System

- **Colors**: Deep navy text (#0b1226), accent teal (#06b6d4), purple (#7c3aed)
- **Typography**: System fonts with proper hierarchy
- **Components**: shadcn/ui components with custom styling
- **Responsive**: Mobile-first approach with Tailwind CSS
- **Accessibility**: ARIA labels, keyboard navigation, proper contrast

## Benefits of Component Structure

1. **Maintainability**: Each section is isolated and easy to modify
2. **Reusability**: Components can be used in other pages
3. **Testing**: Individual components can be tested separately
4. **Performance**: Better code splitting and lazy loading opportunities
5. **Collaboration**: Multiple developers can work on different sections
6. **Scalability**: Easy to add new sections or modify existing ones
