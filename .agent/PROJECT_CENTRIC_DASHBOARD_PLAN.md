# Project-Centric Dashboard Implementation Plan

## 📋 Overview

Instead of creating a separate dashboard, we'll add a **Project Selector** to the existing Creator Navbar that allows creators to filter ALL dashboard tabs (Dashboard, Updates, Supporters, Analytics, Earnings) by a specific project. This maintains the familiar UX while adding project-specific context.

---

## 🎯 Goals

1. **Keep Existing Navbar**: The navbar stays the same with all existing tabs
2. **Add Project Selector**: A dropdown to choose a specific project or "All Projects"
3. **Context-Aware Tabs**: All tabs will respect the selected project and show filtered data
4. **Seamless Experience**: Quick switching between projects without page reloads
5. **Persistent Selection**: Remember the selected project across page navigation

---

## 🏗️ Architecture

### Concept Visualization

**Current Navbar:**
```
[Logo] [Dashboard] [Projects] [Updates] [Supporters] [Analytics] [Earnings] [New Project] [🔔] [Creator ▾] [User ▾]
```

**New Navbar with Project Selector:**
```
[Logo] [📁 All Projects ▾] [Dashboard] [Projects] [Updates] [Supporters] [Analytics] [Earnings] [New Project] [🔔] [Creator ▾] [User ▾]
         └── Dropdown:
             - All Projects (default)
             - 🟢 Project A (active)
             - 🟡 Project B (pending)
             - 🔵 Project C (draft)
```

### State Management Approach

We'll use **React Context** to manage the selected project globally:

```typescript
// contexts/ProjectContext.tsx
interface ProjectContextType {
  selectedProjectId: string | null;   // null = "All Projects"
  selectedProject: Project | null;     // Full project object
  setSelectedProject: (projectId: string | null) => void;
  projects: Project[];                 // All user's projects
  loading: boolean;
}
```

---

## 🔧 Implementation Phases

### Phase 1: Create Project Context (Priority: HIGH)
**Estimated Time: 1-2 hours**

#### Files to Create:
- [ ] `src/contexts/ProjectContext.tsx` - Context provider for selected project
- [ ] `src/hooks/useProjectContext.ts` - Custom hook for consuming context

#### Key Features:
- Store selected project ID in context
- Persist selection in localStorage for page refreshes
- Fetch project details when selection changes
- Clear selection when switching to "All Projects"

```typescript
// Example context structure
export const ProjectProvider: React.FC = ({ children }) => {
  const { user } = useAuth();
  const { projects } = useProjectsByCreator(user?.uid || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return localStorage.getItem('selectedProjectId') || null;
  });
  
  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );
  
  // ... rest of implementation
}
```

---

### Phase 2: Create Project Selector Component (Priority: HIGH)
**Estimated Time: 2-3 hours**

#### File to Create:
- [ ] `src/components/navigation/ProjectSelector.tsx`

#### UI Design:
```
┌─────────────────────────────────┐
│ 📁 All Projects           ▼    │  ← Collapsed state
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📁 All Projects           ▼    │  ← Expanded dropdown
├─────────────────────────────────┤
│ ✓ All Projects                  │  ← Default option
├─────────────────────────────────┤
│ 🟢 My Awesome Project           │  ← Active (green dot)
│    ₹2.5L raised • 45 supporters │
├─────────────────────────────────┤
│ 🟡 Another Project              │  ← Pending (yellow dot)
│    Pending approval             │
├─────────────────────────────────┤
│ 🔵 Draft Project                │  ← Draft (blue dot)
│    Draft • 0 supporters         │
└─────────────────────────────────┘
```

#### Features:
- [ ] Dropdown showing all creator's projects
- [ ] Status indicators (colored dots: green=active, yellow=pending, gray=draft)
- [ ] Quick stats preview (raised amount, supporters)
- [ ] Search/filter for many projects
- [ ] Keyboard navigation support
- [ ] "All Projects" option at top
- [ ] Responsive design (collapse on mobile)

---

### Phase 3: Update CreatorNavbar (Priority: HIGH)
**Estimated Time: 1-2 hours**

#### File to Modify:
- [ ] `src/components/navigation/CreatorNavbar.tsx`

#### Changes:
1. Import and add `<ProjectSelector />` after the logo
2. Wrap navbar content with `<ProjectProvider>`
3. Position selector appropriately for desktop and mobile
4. Add mobile-friendly project selector in mobile menu

**Proposed Location in Navbar:**
```jsx
{/* Logo */}
<Link to="/dashboard">
  <Logo size="md" tagline="Creator Studio" />
</Link>

{/* NEW: Project Selector */}
<ProjectSelector className="hidden md:flex" />

{/* Desktop Navigation - unchanged */}
<div className="hidden lg:flex items-center...">
  {navItems.map(...)}
</div>
```

---

### Phase 4: Update Dashboard Components (Priority: HIGH)
**Estimated Time: 3-4 hours**

Each dashboard tab needs to consume the project context and filter data accordingly:

#### Files to Modify:

##### 4.1 `CreatorDashboard.tsx` (Main Dashboard)
- [ ] Import `useProjectContext`
- [ ] When project selected: Show single project stats
- [ ] When "All Projects": Show aggregated stats (current behavior)
- [ ] Update header to show selected project name

##### 4.2 `CreatorUpdatesPage.tsx` (Updates Tab)
- [ ] Pre-select project from context in the dropdown
- [ ] Auto-filter updates list by selected project
- [ ] If "All Projects", show all updates with project labels

##### 4.3 `CreatorSupportersPage.tsx` (Supporters Tab)
- [ ] Filter supporters by selected project
- [ ] If "All Projects", show all supporters with project info

##### 4.4 `CreatorAnalyticsPage.tsx` (Analytics Tab)
- [ ] Pass `selectedProjectId` to analytics components
- [ ] If "All Projects", show aggregated analytics

##### 4.5 `EarningsDashboard.tsx` (Earnings Tab)
- [ ] Filter earnings by selected project
- [ ] Show project-specific payouts and breakdowns

---

### Phase 5: Update Hook Usage (Priority: MEDIUM)
**Estimated Time: 2-3 hours**

Create wrapper hooks that respect project context:

#### Files to Create/Modify:
- [ ] `src/hooks/useContextualDonations.ts` - Uses selected project
- [ ] `src/hooks/useContextualAnalytics.ts` - Uses selected project
- [ ] `src/hooks/useContextualSupporters.ts` - Uses selected project

```typescript
// Example: useContextualDonations.ts
export function useContextualDonations() {
  const { selectedProjectId } = useProjectContext();
  const { user } = useAuth();
  
  // If project selected, get project-specific donations
  // If "All Projects", get all creator's donations
  const donations = useProjectDonations(
    selectedProjectId || null,
    user?.uid
  );
  
  return donations;
}
```

---

### Phase 6: Visual Indicators (Priority: MEDIUM)
**Estimated Time: 1-2 hours**

Add visual cues to show which project is selected:

#### Changes:
- [ ] Add subtle banner below navbar when project is selected
- [ ] Update page titles to include project name
- [ ] Highlight selected project in Projects list page
- [ ] Add "Clear filter" button when project is selected

**Project Context Banner:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📌 Viewing: "My Awesome Project" • ₹2.5L raised • 45 supporters  ✕ │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Phase 7: Mobile Optimization (Priority: MEDIUM)
**Estimated Time: 2 hours**

#### Mobile Menu Changes:
- [ ] Add project selector at top of mobile menu
- [ ] Show current project name in collapsed state
- [ ] Easy switching between projects
- [ ] Clear visual indicator of selected project

---

## 📁 File Structure

```
src/
├── contexts/
│   ├── AuthContext.tsx (existing)
│   ├── AdminContext.tsx (existing)
│   └── ProjectContext.tsx (NEW)
│
├── components/
│   ├── navigation/
│   │   ├── CreatorNavbar.tsx (MODIFY)
│   │   ├── ProjectSelector.tsx (NEW)
│   │   └── ProjectContextBanner.tsx (NEW)
│   │
│   ├── CreatorDashboard.tsx (MODIFY)
│   └── ...
│
├── hooks/
│   ├── useProjectContext.ts (NEW)
│   ├── useContextualDonations.ts (NEW)
│   ├── useContextualAnalytics.ts (NEW)
│   └── useContextualSupporters.ts (NEW)
```

---

## 🎨 UI/UX Design

### Project Selector Styling

```css
/* Collapsed State */
.project-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(to right, #f97316, #ef4444); /* orange-red gradient */
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
}

/* When project selected - different style */
.project-selector--active {
  background: #f3f4f6; /* gray-100 */
  color: #374151; /* gray-700 */
  border: 1px solid #e5e7eb;
}
```

### Status Colors
| Status | Dot Color | Hex |
|--------|-----------|-----|
| Active | Green | `#10B981` |
| Pending | Yellow | `#F59E0B` |
| Funded | Blue | `#3B82F6` |
| Draft | Gray | `#9CA3AF` |
| Expired | Red | `#EF4444` |

---

## 🔄 Data Flow

```
┌──────────────────┐
│ ProjectProvider  │  ← Wraps entire creator dashboard area
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ ProjectSelector  │  ← User selects project
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ localStorage     │  ← Persist selection
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│                    Dashboard Tabs                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Dashboard │ │ Updates  │ │Supporters│ │Analytics │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │
│       │            │            │            │           │
│       └────────────┼────────────┼────────────┘           │
│                    ▼                                      │
│           Read selectedProjectId                         │
│           Filter data accordingly                        │
└──────────────────────────────────────────────────────────┘
```

---

## ⏱️ Implementation Timeline

| Day | Tasks | Hours |
|-----|-------|-------|
| **Day 1** | Phase 1: ProjectContext + Phase 2: ProjectSelector | 4-5 hrs |
| **Day 2** | Phase 3: Update Navbar + Phase 4: Update Dashboard Components | 4-6 hrs |
| **Day 3** | Phase 5: Hook updates + Phase 6: Visual indicators | 3-4 hrs |
| **Day 4** | Phase 7: Mobile optimization + Testing + Polish | 3-4 hrs |

**Total Estimated Time: 14-19 hours (~2-3 days)**

---

## ✅ Checklist

### Phase 1: Context Setup ✅ COMPLETED
- [x] Create `ProjectContext.tsx`
- [x] Add localStorage persistence
- [x] Create `useProjectContext` hook
- [x] Test context with dummy data

### Phase 2: Selector Component ✅ COMPLETED
- [x] Create `ProjectSelector.tsx`
- [x] Add dropdown functionality
- [x] Add project status indicators
- [x] Add quick stats in dropdown
- [x] Style for desktop

### Phase 3: Navbar Integration ✅ COMPLETED
- [x] Add ProjectSelector to CreatorNavbar
- [x] Position appropriately
- [x] Add to mobile menu
- [x] Test navigation
- [x] Move ProjectProvider to Layout.tsx for proper context scope

### Phase 4: Dashboard Updates ✅ COMPLETED
- [x] Update CreatorDashboard.tsx
- [x] Update CreatorUpdatesPage.tsx
- [x] Update CreatorSupportersPage.tsx
- [x] Update Analytics page
- [x] Update Earnings page

### Phase 5: Hook Updates ✅ COMPLETED
- [x] Create `useContextualProjects.ts`
- [x] Create `useContextualDonations.ts`
- [x] Create `useContextualAnalytics.ts`
- [x] Create `useContextualSupporters.ts`
- [x] Create `useContextualEarnings.ts`
- [x] Create `contextual.ts` index file
- [ ] Refactor dashboard components to use contextual hooks (optional optimization)

### Phase 6: Visual Polish ✅ COMPLETED
- [x] Add context banner (ProjectContextBanner.tsx integrated into Layout.tsx)
- [x] Update page titles (PageTitle.tsx component with dynamic project names)
- [x] Added PageTitle to Dashboard, Supporters, Analytics, Earnings, and Updates pages
- [x] Clear filter option (included in context banner)

### Phase 7: Mobile
- [x] Mobile project selector (added to mobile menu)
- [ ] Test on various screen sizes

---

## 📝 Notes

### Why This Approach?

1. **Minimal Disruption**: Keeps existing navbar structure
2. **Familiar UX**: Users already know the tabs
3. **Flexible**: Easy to switch between project-specific and global views
4. **Scalable**: Works for creators with 1 or 100 projects
5. **Maintainable**: Single source of truth for project selection

### Edge Cases to Handle

1. **No Projects**: Show message to create first project
2. **Deleted Project**: Clear selection, show "All Projects"
3. **Project Status Change**: Update selector in real-time
4. **Deep Links**: Allow URLs like `/dashboard?project=abc123`

### Future Enhancements

1. **Recent Projects**: Show recently selected projects at top
2. **Favorite Projects**: Pin frequently used projects
3. **Project Search**: For creators with many projects
4. **Keyboard Shortcuts**: Quick project switching

---

*Created: December 19, 2025*
*Last Updated: December 19, 2025*
