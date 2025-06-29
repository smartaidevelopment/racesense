# RaceSense Components & UI Library

## Custom Components:

### **Core Application Components:**

1. **Layout.tsx** - Main application layout structure
2. **Navigation.tsx** - Application navigation and routing
3. **SimpleThemeProvider.tsx** - Theme management (racing dark theme)
4. **ResponsiveContainer.tsx** - Responsive layout container

### **Racing-Specific Components:**

5. **RacingButton.tsx** - Racing-themed button with animations
6. **DataCard.tsx** - Telemetry data display cards
7. **RacingNotifications.tsx** - Racing-specific notification system
8. **OfflineIndicator.tsx** - Network status indicator

### **PWA & Mobile Components:**

9. **PWAInstallPrompt.tsx** - Progressive Web App installation prompt
10. **MobileOptimizations.tsx** - Mobile-specific optimizations
11. **LoadingStates.tsx** - Professional loading indicators

## shadcn/ui Component Library (47 Components):

### **Layout & Navigation:**

- accordion.tsx
- breadcrumb.tsx
- navigation-menu.tsx
- sidebar.tsx
- sheet.tsx
- menubar.tsx

### **Data Display:**

- card.tsx
- table.tsx
- chart.tsx
- badge.tsx
- avatar.tsx
- aspect-ratio.tsx

### **Form Components:**

- form.tsx
- input.tsx
- input-otp.tsx
- label.tsx
- checkbox.tsx
- radio-group.tsx
- select.tsx
- slider.tsx
- switch.tsx
- textarea.tsx

### **Feedback & Interaction:**

- alert.tsx
- alert-dialog.tsx
- dialog.tsx
- drawer.tsx
- hover-card.tsx
- popover.tsx
- tooltip.tsx
- toast.tsx
- toaster.tsx
- use-toast.ts

### **Content Organization:**

- tabs.tsx
- collapsible.tsx
- carousel.tsx
- separator.tsx
- scroll-area.tsx
- resizable.tsx

### **Controls & Actions:**

- button.tsx
- toggle.tsx
- toggle-group.tsx
- dropdown-menu.tsx
- context-menu.tsx
- command.tsx

### **Data Entry:**

- calendar.tsx
- pagination.tsx
- progress.tsx

### **Utility Components:**

- skeleton.tsx
- sonner.tsx

## Component Architecture:

```
RaceSense Component Structure
├── Custom Racing Components
│   ├── RacingButton (Animated racing button)
│   ├── DataCard (Telemetry displays)
│   ├── RacingNotifications (Alert system)
│   └── Layout/Navigation (App structure)
│
├── shadcn/ui Library
│   ├── Form Components (Input, Select, etc.)
│   ├── Data Display (Card, Table, Chart)
│   ├── Feedback (Dialog, Toast, Alert)
│   └── Layout (Tabs, Accordion, etc.)
│
└── PWA Components
    ├── PWAInstallPrompt (App installation)
    ├── OfflineIndicator (Network status)
    └── MobileOptimizations (Mobile UX)
```

## Key Features:

### **Racing-Themed Design:**

- **Custom CSS Variables** - Racing-specific color scheme
- **Animations** - Speed-inspired transitions and effects
- **Professional Styling** - F1-grade interface design
- **Dark Theme Optimized** - Racing-friendly low-light interface

### **Professional UI Components:**

- **Comprehensive Form Library** - All form inputs with validation
- **Data Visualization** - Charts, tables, and telemetry displays
- **Interactive Elements** - Dialogs, tooltips, and feedback
- **Responsive Design** - Mobile and tablet optimization

### **PWA Features:**

- **Offline Support** - Service worker integration
- **Install Prompts** - Native app installation
- **Mobile Optimization** - Touch-friendly interface
- **Network Awareness** - Connection status monitoring

## Custom Styling Features:

### **Racing Theme Colors:**

```css
--racing-red: 0 84% 55% --racing-orange: 20 100% 50% --racing-yellow: 48 100%
  50% --racing-green: 120 100% 40% --racing-blue: 200 100% 50%
  --racing-purple: 270 100% 50% --racing-dark: 220 13% 7%;
```

### **Racing Animations:**

- **pulse-glow** - Racing indicator animations
- **speed-lines** - Motion blur effects
- **fadeIn** - Smooth component transitions
- **backgroundShift** - Dynamic background animations

### **Custom Component Classes:**

- **racing-button** - Animated racing buttons
- **data-card** - Telemetry data displays
- **telemetry-grid** - Real-time data grids
- **modern-panel** - Professional panel styling

## Integration Features:

- **TypeScript Support** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Responsive Design** - Mobile-first approach
- **Accessibility** - ARIA compliance
- **Theme Consistency** - Unified design system
- **Performance Optimized** - Minimal bundle size

The component library provides a complete professional racing interface with enterprise-grade components and racing-specific customizations.
