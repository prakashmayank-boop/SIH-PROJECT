---
name: UFIS Climate Resilience Design System
colors:
  surface: '#FFFFFF'
  surface-dim: '#F1F5F9'
  surface-bright: '#FFFFFF'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F8FAFC'
  surface-container: '#F6F9FC'
  surface-container-high: '#EEF2F6'
  surface-container-highest: '#E2E8F0'
  on-surface: '#0F172A'
  on-surface-variant: '#64748B'
  inverse-surface: '#0B1F3A'
  inverse-on-surface: '#F8FAFC'
  outline: '#CBD5E1'
  outline-variant: '#E2E8F0'
  surface-tint: '#2563EB'
  primary: '#2563EB'
  on-primary: '#FFFFFF'
  primary-container: '#DBEAFE'
  on-primary-container: '#1E40AF'
  inverse-primary: '#93C5FD'
  secondary: '#0B1F3A'
  on-secondary: '#FFFFFF'
  secondary-container: '#123B63'
  on-secondary-container: '#E0F2FE'
  tertiary: '#38BDF8'
  on-tertiary: '#082F49'
  tertiary-container: '#E0F2FE'
  on-tertiary-container: '#0369A1'
  error: '#DC2626'
  on-error: '#FFFFFF'
  error-container: '#FEE2E2'
  on-error-container: '#991B1B'
  background: '#F6F9FC'
  on-background: '#0F172A'
  surface-variant: '#F1F5F9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.025em
  display-md:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  2xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  grid-gutter: 24px
  card-padding: 32px
  section-gap: 80px
---

# UFIS — UrbanFlood Intelligence System
## Design System & Visual Specification (SIH 2026 • Team Kalki)

### 1. Brand Identity & Principles
- **Project**: UFIS — UrbanFlood Intelligence System
- **Team**: Team Kalki
- **Problem Statement**: Urban Flood Nowcasting System (Drainage and Rainfall Coupling) — Smart India Hackathon 2026
- **Tone**: Trustworthy, Calm, Professional, Modern, Technology-Forward, Human-Centered
- **Style Direction**: Light-first Smart City & Climate-Resilience portal with deep navy authority anchors, civic blue actions, and clear risk/safe semantics. Avoids dark cyberpunk or stock-photo disaster imagery.

### 2. Color Palette & Semantic Tokens
- **Background**: `#F6F9FC` (Soft off-white canvas)
- **Card Surface**: `#FFFFFF` with `#E2E8F0` crisp 1px borders
- **Deep Navy Anchor**: `#0B1F3A` (Headers, admin badges, institutional authority)
- **Navy Secondary**: `#123B63`
- **Primary Civic Blue**: `#2563EB` (Interactive primary CTAs, links)
- **Sky Accent**: `#38BDF8` (Hydraulic flows, water elements, highlights)
- **Safe State Green**: `#16A34A` (Passable roads, safe routes, nominal status)
- **Warning Amber**: `#F59E0B` (Cautionary advisory, intermediate alert)
- **Critical Risk Red**: `#DC2626` (Overland flooding, overcapacity warning)
- **Text Main**: `#0F172A` (Slate 900)
- **Text Secondary**: `#64748B` (Slate 500)

### 3. Typography Rules
- **Primary Typeface**: Inter (or system sans fallback)
- **Eyebrow Badges**: Uppercase, 11px/12px, tracking `0.05em`, semibold
- **Hero Title**: 48px desktop / 32px mobile, tight tracking `-0.025em`
- **Body Copy**: 15px/16px with relaxed line height (`1.6`) for effortless readability

### 4. Component Inventory
- **Navigation Bar**: Clean top bar with UFIS mark, subtitle, smooth-scroll links, and SIH 2026 status pill.
- **Hero Visual**: Two-column layout with value proposition on the left and a conceptual system visualization card on the right labeled *"Conceptual model output"*.
- **Portal Entry Cards**:
  - **Citizen Portal**: `#2563EB` primary theme, community pin/water icon, *"Enter Citizen Portal"* (`/citizen`), targeting residents and volunteers.
  - **Admin Portal**: `#0B1F3A` deep navy theme, shield/analytics icon, *"Open Admin Portal"* (`/admin`), targeting authorized municipal responders.
- **Process Step Cards**: 4-stage horizontal pipeline (Observe ➔ Understand ➔ Explain ➔ Respond).
- **Capabilities Grid**: 5 compact feature cards (0–3h Nowcasting, Drainage Coupling, Explainability, Citizen Ground Truth, Flood-Aware Routing).
- **Trust & Responsible Use Banner**: 3 clear cards covering Data Lineage, Uncertainty Communication, and Human Verification.
- **Institutional Footer**: Complete attribution, quick navigation links, and decision-support disclaimer.

### 5. Content Governance & Terminology
- Use: *"Lowest predicted flood-risk route"*, *"Possible hydraulic anomaly"*, *"Model confidence"*, *"Citizen observation"*, *"Field verification required"*, *"Conceptual model output"*.
- Avoid: *"Guaranteed flood prediction"*, *"100% safe route"*, *"AI solves flooding"*, *"Live IMD data"* (unless authorized).
