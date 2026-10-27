# SnapIT — Intelligent Campus Service Platform (Mobile Frontend)

A high-performance Android mobile application built with **React Native**, **Expo (Expo Router)**, and **TypeScript** for the **SnapIT** campus maintenance and automated service platform.

---

## 📱 Features Implemented (Phase 1: Interactive Prototype)

1. **Student Portal**
   - **Student Authentication & Registration**: Validated form inputs, preloaded demo accounts, role distinction.
   - **Home Dashboard**: Quick metric counters (Submitted, In Progress, Resolved), immediate "Snap & Report" hero action, recent ticket list, campus emergency contacts.
   - **Interactive Complaint Submission**:
     - Image capture via native Camera & selection from Gallery (`expo-image-picker`).
     - Image preview with retake and removal options.
     - Simulated **Ollama Vision AI** pre-screening (detected object tags, hazard confidence %, severity rating).
     - Department classification, location selector with quick campus presets, and description.
   - **My Complaints List**:
     - Real-time search across ticket IDs, descriptions, and campus locations.
     - Horizontal status filter chips (`Submitted`, `In Progress`, `Resolved`, `Rejected`).
     - Priority severity sub-filters (`Critical`, `High`, `Medium`, `Low`).
   - **Complaint Details & Timeline**:
     - High-resolution photo viewer with status and severity badges.
     - Ollama Vision model evidence breakdown.
     - Interactive resolution history audit log with the ability for students to add follow-up notes.
   - **Student Profile**: Campus credentials display, quick demo switch to Admin portal, data reset tool.

2. **Facilities & Admin Console**
   - **Admin Bottom Navigation Tabs**: Dedicated navigation bar matching student experience (`Overview`, `Managed Tickets`, `Profile`).
   - **Admin Authentication**: Preloaded credentials with campus official security badge.
   - **Admin Overview / Dashboard**:
     - Campus-wide metric overview (Total Received, Unseen, In Progress, Completed, Critical Alerts).
     - Interactive metric cards that navigate directly to the filtered tab.
     - Global search across student names, ticket IDs, and issue descriptions.
   - **Managed Complaints Section (`app/(admin)/complaints/index.tsx`)**:
     - **3 Primary Sub-Sections with Live Count Badges**:
       1. **Unseen**: Tickets submitted by students awaiting admin triage.
       2. **In Progress**: Active work orders assigned to maintenance crews.
       3. **Completed**: Resolved issues with verification notes.
       *(Plus quick toggles for All and Rejected tickets).*
     - **Quick Status Edit Modal**: Directly edit complaint status (`in_progress`, `completed`, `rejected`, `unseen`) from the list with custom supervisor comments.
     - Search bar and Department filtering chips.
   - **Administrative Triage Controls (`app/(admin)/complaint/[id].tsx`)**:
     - Change ticket status (`in_progress`, `completed`, `rejected`, `unseen`) with custom resolution remarks.
     - Reassign departments with 1 tap.
     - Adjust priority severity based on on-site inspection.
     - Live reactive updates to the audit timeline.
   - **Admin Profile & Quick Switch**: Instant role switching between Student and Admin for live presentations.

3. **Academic Design System**
   - Clean, professional Academic Navy (`#1E3A8A`, `#0F172A`) and Sky Blue theme on neutral Slate background (`#F8FAFC`).
   - Consistent typography, touch targets, elevation shadows, and status indicators.
   - Accessible Lucide React Native icons.
   - Explicit demo banner labeling prototype state without pretending mock data is saved to live backends.

---

## 📂 Project Architecture

```
frontend/
├── app/                              # Expo Router filesystem routing
│   ├── _layout.tsx                   # Global Root Layout (SafeArea, AuthProvider, Stack)
│   ├── index.tsx                     # Portal Gateway (Welcome & Role Routing)
│   ├── (auth)/                       # Authentication Route Group
│   │   ├── _layout.tsx
│   │   ├── student-login.tsx         # Student Login
│   │   ├── student-register.tsx      # Student Registration
│   │   └── admin-login.tsx           # Admin / Facilities Login
│   ├── (student)/                    # Student Tab Navigator & Screens
│   │   ├── _layout.tsx               # Bottom Tab Bar
│   │   ├── home.tsx                  # Student Dashboard & Hero Action
│   │   ├── submit.tsx                # Issue Reporter (Camera, Gallery, AI Preview)
│   │   ├── complaints/
│   │   │   ├── index.tsx             # My Complaints List with search & filters
│   │   │   └── [id].tsx              # Complaint Detail & Timeline View
│   │   └── profile.tsx               # Student Profile & Role Switcher
│   └── (admin)/                      # Admin Route Group
│       ├── _layout.tsx
│       ├── dashboard.tsx             # Admin Control Center (Stats, Search, Triage)
│       ├── complaint/
│       │   └── [id].tsx              # Admin Triage & Status Update Screen
│       └── profile.tsx               # Admin Settings & Reset Tools
├── src/
│   ├── components/                   # Reusable UI Design System
│   │   ├── Button.tsx                # Multi-variant button with loading state
│   │   ├── Input.tsx                 # Form inputs with icons & error handling
│   │   ├── Card.tsx                  # Elevated & outlined card containers
│   │   ├── ComplaintCard.tsx         # Shared complaint item card
│   │   ├── StatusBadge.tsx           # Status indicators (Submitted, In Progress, etc.)
│   │   ├── SeverityBadge.tsx         # Priority indicators (Low, Med, High, Critical)
│   │   ├── DepartmentBadge.tsx       # Department tag
│   │   ├── Header.tsx                # Screen headers with back navigation
│   │   ├── FilterChips.tsx           # Horizontal pill filters with counts
│   │   ├── Timeline.tsx              # Vertical resolution audit log
│   │   ├── EmptyState.tsx            # Friendly empty search/list states
│   │   └── DemoBanner.tsx            # Clear prototype indicator banner
│   ├── context/
│   │   └── AuthContext.tsx           # Local auth state & quick role switching
│   ├── data/
│   │   └── mockData.ts               # Realistic campus complaints, departments & users
│   ├── services/
│   │   ├── supabase.ts               # Supabase JS client configuration
│   │   ├── authService.ts            # Auth service layer (mock + Supabase ready)
│   │   └── complaintService.ts       # Complaint service layer (mock + API ready)
│   ├── theme/
│   │   └── index.ts                  # Navy/Blue colors, spacing, typography, radii
│   └── types/
│       └── index.ts                  # TypeScript definitions for tickets, users, AI analysis
├── app.json                          # Expo configuration
├── package.json                      # Project dependencies
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🚀 How to Run and Test on Android

### Prerequisites
1. Install **Node.js** (v18 or higher) on your machine.
2. Install the **Expo Go** app on your Android phone from Google Play Store (or run an Android Emulator via Android Studio).

### Starting the Development Server
From the project root:
```bash
cd frontend
npm start
```
*(Or `npx expo start`)*

### Testing with Expo Go on Android
1. When Expo starts, it will display a **QR code** in your terminal.
2. Ensure your Android phone is connected to the **same Wi-Fi network** as your computer.
3. Open the **Expo Go** app on your Android phone.
4. Tap **"Scan QR code"** and scan the QR code shown in your terminal.
5. The Metro bundler will build the JavaScript bundle and the app will load immediately on your device.

*(If using an Android emulator on the same PC, press `a` in the terminal to launch on the emulator).*

---

## 🔌 Future Backend Integration Guide

The frontend has been specifically decoupled into a clean service layer:
- `src/services/authService.ts`: Replace the mock fallback with `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`.
- `src/services/complaintService.ts`: Replace in-memory queries with calls to your existing FastAPI endpoints (`/complaints/upload`, `/complaints`, `/admin/complaints/{id}/status`).
- All screen components remain 100% unchanged when switching to the live API!
