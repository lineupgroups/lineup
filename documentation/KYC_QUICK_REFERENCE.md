# KYC Implementation - Quick Reference

**Last Updated:** 2025-11-30

## 📌 What's Changing?

### Before (Current System)
- ❌ Users can freely switch between Supporter/Creator modes
- ❌ No verification required to access creator dashboard
- ❌ KYC collected per-project (during project creation)
- ❌ Role switcher always visible

### After (New System)
- ✅ Everyone starts as **Supporter** (default)
- ✅ **Creator mode unlocked only after KYC approval**
- ✅ **One-time KYC** at profile level
- ✅ **Role switcher visible only for verified creators**
- ✅ **Projects auto-approved** (KYC pre-verified)

---

## 🎯 Core Concept

```
Supporter (Default)
      │
      │ Clicks "Become a Creator"
      ▼
   KYC Submission
      │
      │ Admin Reviews
      ▼
   ┌────────────┐
   │ Approved?  │
   └────┬───┬───┘
        │   │
    Yes │   │ No → Rejected (can resubmit)
        ▼   ▼
    Creator ✅
    (Role Switcher Appears)
```

---

## 📂 Files to Create (17 new files)

### Types
1. `src/types/kyc.ts` - KYC data structures

### Services
2. `src/lib/kycService.ts` - KYC operations
3. `src/lib/projectValidation.ts` - Creator identity validation

### Hooks
4. `src/hooks/useKYC.ts` - KYC state management

### KYC Pages & Components
5. `src/components/kyc/KYCSubmissionPage.tsx`
6. `src/components/kyc/AgeVerification.tsx`
7. `src/components/kyc/DocumentUploader.tsx`
8. `src/components/kyc/PaymentMethodForm.tsx`
9. `src/components/kyc/ParentConsentForm.tsx`
10. `src/components/kyc/KYCStatusPage.tsx`
11. `src/components/kyc/KYCStatusBadge.tsx`

### Creator CTAs
12. `src/components/creator/BecomeCreatorCTA.tsx`
13. `src/components/creator/UpgradeToCreatorBanner.tsx`

### Admin Components
14. `src/components/admin/KYCReviewPanel.tsx`
15. `src/components/admin/KYCDocumentViewer.tsx`

### Documentation
16. `documentation/KYC_FAQ.md`
17. `documentation/KYC_ADMIN_GUIDE.md`

---

## ✏️ Files to Modify (15 existing files)

### Core Data
1. `src/types/user.ts` - Add KYC fields
2. `src/types/auth.ts` - Update role preferences

### Auth & Context
3. `src/contexts/AuthContext.tsx` - Update user fetching

### Navigation
4. `src/components/common/RoleSwitcher.tsx` - Conditional rendering
5. `src/components/navigation/SupporterNavbar.tsx` - Add Creator CTA
6. `src/components/navigation/CreatorNavbar.tsx` - Update switcher

### Routing & Protection
7. `src/components/auth/ProtectedRoute.tsx` - Add CreatorProtectedRoute
8. `src/router/AppRouter.tsx` - Add KYC routes, protect creator routes

### User-Facing Pages
9. `src/components/EnhancedUserProfile.tsx` - Add KYC status badge
10. `src/components/MyProfilePage.tsx` - Add KYC link
11. `src/components/CreatorDashboard.tsx` - Add welcome message
12. `src/components/SmartHomepage.tsx` - Add Creator CTA

### Project Creation
13. `src/components/projectCreation/ProjectCreationWizard.tsx` - Remove KYC step

### Admin
14. `src/components/admin/EnhancedAdminDashboard.tsx` - Add KYC panel

### Security
15. `firestore.rules` - Add KYC security rules

---

## 🗄️ Database Changes

### New Collection: `kyc_documents`
```javascript
{
  id: "auto-gen",
  userId: "user123",
  kycType: "self" | "parent_guardian",
  selfKYC: {
    aadhaarNumber: "...",
    panCard: "...",
    addressProof: "url",
    verified: true
  },
  paymentMethods: [...],
  status: "approved",
  submittedAt: Timestamp,
  reviewedAt: Timestamp,
  reviewedBy: "adminId"
}
```

### Update Collection: `users`
**Add these fields:**
```javascript
{
  // ... existing fields ...
  
  // NEW KYC Fields
  kycStatus: "not_started" | "submitted" | "approved" | "rejected",
  kycDocumentId: "kyc_doc_123",
  kycSubmittedAt: Timestamp,
  kycApprovedAt: Timestamp,
  isCreatorVerified: boolean,
  canCreateProjects: boolean,
  creatorActivatedAt: Timestamp,
  
  rolePreferences: {
    // ... existing ...
    canAccessCreatorMode: boolean // NEW
  }
}
```

---

## 🔑 Key Functions

### KYC Service (`src/lib/kycService.ts`)

```typescript
// Submit KYC for the first time
submitKYC(userId, kycData) 
  → Creates kyc_document
  → Updates user.kycStatus = 'submitted'

// Get user's KYC
getUserKYC(userId)
  → Returns UserKYCData | null

// Check if approved
hasApprovedKYC(userId)
  → Returns boolean

// Admin approve (grants creator access)
approveKYC(kycDocId, adminId)
  → Updates kyc_document.status = 'approved'
  → Updates user.isCreatorVerified = true ✅
  → Updates user.canCreateProjects = true ✅
  → Shows role switcher

// Admin reject
rejectKYC(kycDocId, adminId, reason)
  → Updates kyc_document.status = 'rejected'
  → User can resubmit
```

---

## 🚪 Route Protection

### Before
```typescript
// Anyone can access creator routes
<Route path="/dashboard" element={<CreatorDashboard />} />
```

### After
```typescript
// Only KYC-verified users can access
<Route path="/dashboard" element={
  <CreatorProtectedRoute>
    <CreatorDashboard />
  </CreatorProtectedRoute>
} />

// CreatorProtectedRoute checks:
if (!user.isCreatorVerified) {
  toast.error("Complete KYC first");
  navigate('/kyc/submit');
}
```

---

## 🎨 UI Changes

### Navbar (Not Verified)
```
Before: [Supporter ▼] [Creator ▼]
After:  [🚀 Become a Creator]
```

### Navbar (Verified)
```
Before: [Supporter ▼] [Creator ▼]  (always visible)
After:  [Supporter ▼] [Creator ▼]  (only if verified)
```

### Profile Page (Not Verified)
```
NEW:
┌─────────────────────────────────────┐
│ Want to create projects?            │
│ Complete KYC to unlock creator mode │
│              [Become a Creator] →   │
└─────────────────────────────────────┘
```

### Profile Page (Verified)
```
NEW:
┌─────────────────────────┐
│ ✅ Verified Creator     │
└─────────────────────────┘
```

---

## 🔒 Security Rules (Firestore)

```javascript
// KYC documents - SENSITIVE
match /kyc_documents/{kycId} {
  // Only owner and admin can read
  allow read: if isOwner() || isAdmin();
  
  // Only owner can create (status must be 'pending')
  allow create: if isOwner() && 
    request.resource.data.status == 'pending';
  
  // Only admin can approve/reject
  allow update: if isAdmin();
}

// Projects - Creator verification required
match /projects/{projectId} {
  allow create: if isCreatorVerified();
}

function isCreatorVerified() {
  return request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid))
      .data.isCreatorVerified == true;
}
```

---

## 📊 User States

| State | kycStatus | isCreatorVerified | canCreateProjects | Role Switcher | Can Create Projects |
|-------|-----------|-------------------|-------------------|---------------|---------------------|
| **New User** | not_started | ❌ false | ❌ false | ❌ Hidden | ❌ No |
| **KYC Submitted** | submitted | ❌ false | ❌ false | ❌ Hidden | ❌ No |
| **KYC Approved** | approved | ✅ true | ✅ true | ✅ Visible | ✅ Yes |
| **KYC Rejected** | rejected | ❌ false | ❌ false | ❌ Hidden | ❌ No |

---

## 🚀 Implementation Priority

### Must Do First (Critical Path)
1. ⭐ **Phase 1**: Data models (`types/kyc.ts`, `types/user.ts`)
2. ⭐ **Phase 1**: Services (`lib/kycService.ts`)
3. ⭐ **Phase 2**: KYC submission page
4. ⭐ **Phase 3**: Role switcher conditional logic
5. ⭐ **Phase 3**: Route protection
6. ⭐ **Phase 7**: Firestore rules

### Can Do Later (Important)
7. Phase 4: Project creation updates
8. Phase 5: UI polish (CTAs, badges)
9. Phase 6: Admin panel

### Nice to Have
10. Phase 8: Testing
11. Phase 9: Documentation
12. Phase 11: User communication

---

## ✅ Quick Validation Checklist

After implementation, verify:

- [ ] New user has `isCreatorVerified: false`
- [ ] Role switcher is hidden for new users
- [ ] "Become a Creator" CTA is visible
- [ ] KYC form submits successfully
- [ ] Admin can review KYC submissions
- [ ] Admin approval sets `isCreatorVerified: true`
- [ ] Role switcher appears after approval
- [ ] User can switch to creator mode
- [ ] Creator dashboard is accessible
- [ ] Project creation doesn't ask for KYC
- [ ] Payment methods are pre-filled from KYC
- [ ] Non-verified user is blocked from `/dashboard`
- [ ] Redirect to `/kyc/submit` works

---

## 🆘 Common Issues & Solutions

### Issue 1: Role switcher not appearing after KYC approval
**Solution:** Check `user.isCreatorVerified` field in Firestore. Admin must approve KYC.

### Issue 2: User can access creator dashboard without KYC
**Solution:** Ensure `CreatorProtectedRoute` is wrapping the route. Check route configuration.

### Issue 3: Project creation still asks for KYC
**Solution:** Remove Step4Verification from wizard. Update `ProjectCreationWizard.tsx`.

### Issue 4: Payment methods not pre-filling
**Solution:** Ensure `getUserKYC()` is called in project wizard. Check `userKYC.paymentMethods`.

---

## 📞 Need Help?

### Documentation
- 📄 **Full Plan:** `documentation/KYC_CREATOR_VERIFICATION_PLAN.md`
- ✅ **Checklist:** `documentation/KYC_IMPLEMENTATION_CHECKLIST.md`
- 🔄 **User Flows:** `documentation/KYC_USER_FLOWS.md`
- ⚡ **Quick Ref:** `documentation/KYC_QUICK_REFERENCE.md` (this file)

### Key Decision Points
1. **Where to put "Become Creator" button?**
   - Navbar, Profile page, Homepage

2. **When to show role switcher?**
   - Only when `user.isCreatorVerified === true`

3. **How to handle KYC rejection?**
   - Show reason, allow resubmission

4. **What about existing projects without KYC?**
   - Run migration to link existing projects to KYC docs

---

## 🎉 Success Criteria

✅ All users start as supporters
✅ KYC required to become creator
✅ Role switcher only for verified users
✅ One-time KYC process
✅ Projects auto-approved for verified creators
✅ No repeated KYC during project creation
✅ Secure storage of KYC documents
✅ Admin approval workflow functional
✅ Smooth user experience

---

**Ready to implement? Start with Phase 1!** 🚀
