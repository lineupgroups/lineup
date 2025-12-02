# KYC System User Flows

Visual representation of user journeys in the KYC-based creator verification system.

---

## Flow 1: New User Journey (Supporter → Creator)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NEW USER SIGNUP                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   Create Account via:    │
                    │   • Email/Password       │
                    │   • Google Sign-in       │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Auto-assigned Role:     │
                    │  ✅ SUPPORTER            │
                    │  ❌ Creator (locked)     │
                    │                          │
                    │  Fields set:             │
                    │  • kycStatus: 'not_started' │
                    │  • isCreatorVerified: false │
                    │  • canCreateProjects: false │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   Browse as Supporter    │
                    │   • Discover projects    │
                    │   • Support projects     │
                    │   • Like/Comment         │
                    │   • Follow creators      │
                    └──────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
           User wants to                User continues
           create projects               as supporter
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────┐
        │  Clicks "Become a    │    │  Stays in        │
        │  Creator" CTA        │    │  Supporter Mode  │
        └──────────────────────┘    └──────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │  Redirected to:              │
        │  /kyc/submit                 │
        └──────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │  KYC SUBMISSION FORM         │
        │  (See Flow 2 for details)    │
        └──────────────────────────────┘
```

---

## Flow 2: KYC Submission Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                      /kyc/submit PAGE                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  STEP 1: Age Verification│
                    │  • Enter date of birth   │
                    │  • Calculate age         │
                    └──────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              Age ≥ 18                    Age 15-17
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  ADULT PATH          │    │  MINOR PATH          │
        │  (Self KYC)          │    │  (Parent/Guardian)   │
        └──────────────────────┘    └──────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  STEP 2: Documents   │    │  STEP 2: Parent Info │
        │  • Aadhaar number    │    │  • Parent name       │
        │  • PAN card          │    │  • Parent phone      │
        │  • Address proof     │    │  • Relationship      │
        │  (image upload)      │    │  • Parent documents  │
        └──────────────────────┘    │    (Aadhaar, PAN)    │
                    │               └──────────────────────┘
                    │                           │
                    │               ┌──────────────────────┐
                    │               │  Parent Consent      │
                    │               │  ☑ Checkbox required │
                    │               └──────────────────────┘
                    │                           │
                    └───────────┬───────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  STEP 3: Payment Setup   │
                    │  Choose one:             │
                    │  ○ UPI ID                │
                    │  ○ Bank Account          │
                    │    • Account holder name │
                    │    • Account number      │
                    │    • IFSC code           │
                    │    • Bank name           │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  STEP 4: Review & Submit │
                    │  • Preview all details   │
                    │  • Confirm accuracy      │
                    │  • Submit button         │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  Firestore Write:        │
                    │  Collection:             │
                    │  kyc_documents           │
                    │                          │
                    │  Status: 'pending'       │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  Update User Document:   │
                    │  kycStatus: 'submitted'  │
                    │  kycDocumentId: [id]     │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  Redirect to:            │
                    │  /kyc/status             │
                    │                          │
                    │  Show: "Under Review"    │
                    │  badge                   │
                    └──────────────────────────┘
```

---

## Flow 3: Admin KYC Review Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                                  │
│                     /admin → KYC Reviews Tab                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  List of Pending KYC     │
                    │  Submissions             │
                    │  • Sort by date          │
                    │  • Filter by status      │
                    │  • Search by name/userId │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Admin Clicks Review     │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────────────┐
                    │  KYC Document Viewer Opens           │
                    │  • User details (name, email, age)   │
                    │  • Document images (zoom/download)   │
                    │  • Payment method details            │
                    │  • Submission timestamp              │
                    └──────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              Documents OK?              Documents Invalid?
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  Admin Clicks        │    │  Admin Clicks        │
        │  "APPROVE"           │    │  "REJECT"            │
        └──────────────────────┘    └──────────────────────┘
                    │                           │
                    │                           ▼
                    │               ┌──────────────────────┐
                    │               │  Enter Rejection     │
                    │               │  Reason (required)   │
                    │               │  • Document unclear  │
                    │               │  • Info mismatch     │
                    │               │  • Invalid ID        │
                    │               └──────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  Update KYC Document:│    │  Update KYC Document:│
        │  status: 'approved'  │    │  status: 'rejected'  │
        │  reviewedAt: now     │    │  rejectionReason: X  │
        │  reviewedBy: adminId │    │  reviewedBy: adminId │
        └──────────────────────┘    └──────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  Update User Profile:│    │  Update User Profile:│
        │  kycStatus: 'approved'│   │  kycStatus: 'rejected'│
        │  isCreatorVerified:  │    │  kycRejectionReason: X│
        │    ✅ TRUE           │    └──────────────────────┘
        │  canCreateProjects:  │                │
        │    ✅ TRUE           │                │
        │  rolePreferences     │                ▼
        │   .canAccessCreator  │    ┌──────────────────────┐
        │    Mode: ✅ TRUE     │    │  Send Email:         │
        │  creatorActivatedAt: │    │  "KYC Rejected"      │
        │    now               │    │  Include reason      │
        └──────────────────────┘    │  Allow resubmission  │
                    │               └──────────────────────┘
                    ▼
        ┌──────────────────────┐
        │  Send Email:         │
        │  "KYC Approved! 🎉"  │
        │  • Creator unlocked  │
        │  • Start creating    │
        └──────────────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │  User sees:          │
        │  • Role Switcher     │
        │    now visible       │
        │  • Can switch to     │
        │    Creator mode      │
        └──────────────────────┘
```

---

## Flow 4: Verified Creator Creates Project

```
┌─────────────────────────────────────────────────────────────────────┐
│            VERIFIED CREATOR (isCreatorVerified: true)                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Clicks "Create Project" │
                    │  OR                      │
                    │  Navigates to:           │
                    │  /dashboard/projects/    │
                    │  create                  │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  CreatorProtectedRoute   │
                    │  Checks:                 │
                    │  user.isCreatorVerified  │
                    └──────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                Verified?                   Not Verified?
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  ✅ Allow Access     │    │  ❌ Redirect to      │
        │  to Project Wizard   │    │  /kyc/submit         │
        └──────────────────────┘    │  Show error toast    │
                    │               └──────────────────────┘
                    ▼
        ┌──────────────────────────────┐
        │  Load User's KYC Data:       │
        │  const kyc = await           │
        │    getUserKYC(userId)        │
        │                              │
        │  Extract:                    │
        │  • Payment methods           │
        │  • KYC document ID           │
        └──────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │  PROJECT CREATION WIZARD     │
        │  (Simplified - No KYC step!) │
        └──────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │  STEP 1: Project Basics      │
        │  • Title                     │
        │  • Category                  │
        │  • Funding goal              │
        │  • Duration                  │
        │  • Cover image               │
        └──────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │  STEP 2: Project Story       │
        │  • Description               │
        │  • Why it matters            │
        │  • Fund breakdown            │
        │  • Gallery images            │
        └──────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │  STEP 3: Review & Launch     │
        │  • Preview project           │
        │  • Launch settings           │
        │  • Notification preferences  │
        │  • NO KYC REQUIRED ✅        │
        └──────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │  Submit Project              │
        │  Auto-fill from KYC:         │
        │  • kycDocumentId             │
        │  • paymentMethod (from KYC)  │
        │  • creatorName (verified)    │
        │                              │
        │  Set status:                 │
        │  • status: 'active' ✅       │
        │  • approvalStatus: 'approved'│
        │    (KYC already verified!)   │
        └──────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │  PROJECT PUBLISHED! 🎉       │
        │  • No waiting for approval   │
        │  • Goes live immediately     │
        │  • Redirect to dashboard     │
        └──────────────────────────────┘
```

---

## Flow 5: Non-Verified User Tries Creator Features

```
┌─────────────────────────────────────────────────────────────────────┐
│         USER WITHOUT KYC (isCreatorVerified: false)                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Tries to access:        │
                    │  • /dashboard            │
                    │  • /dashboard/projects   │
                    │  • /dashboard/analytics  │
                    │  etc.                    │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  CreatorProtectedRoute   │
                    │  Runs check:             │
                    │  if (!user.isCreator     │
                    │      Verified)           │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  ❌ Access Denied        │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Show Toast Message:     │
                    │  "Please complete KYC    │
                    │   verification to access │
                    │   creator features"      │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Redirect to:            │
                    │  /kyc/submit             │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  User can now submit KYC │
                    │  (See Flow 2)            │
                    └──────────────────────────┘
```

---

## Flow 6: Role Switcher Visibility Logic

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER LOGGED IN                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  RoleSwitcher Component  │
                    │  Renders in Navbar       │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Check:                  │
                    │  user.isCreatorVerified? │
                    └──────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              Yes (verified)              No (not verified)
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  ✅ SHOW SWITCHER    │    │  ❌ HIDE SWITCHER    │
        │                      │    │                      │
        │  Display:            │    │  Instead show:       │
        │  ┌────────────────┐ │    │  ┌────────────────┐ │
        │  │ 👥 Supporter  ▼│ │    │  │ 🚀 Become a   │ │
        │  └────────────────┘ │    │  │    Creator     │ │
        │  ┌────────────────┐ │    │  └────────────────┘ │
        │  │ 🚀 Creator    ▼│ │    │  (Links to /kyc/   │
        │  └────────────────┘ │    │   submit)          │
        └──────────────────────┘    └──────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  User can switch     │    │  User clicks CTA     │
        │  between modes       │    │  → Start KYC flow    │
        │  freely              │    │  (See Flow 2)        │
        └──────────────────────┘    └──────────────────────┘
```

---

## Flow 7: KYC Status Tracking

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER KYC STATUS STATES                           │
└─────────────────────────────────────────────────────────────────────┘

State 1: NOT STARTED
├─ kycStatus: 'not_started'
├─ isCreatorVerified: false
├─ canCreateProjects: false
├─ UI: "Become a Creator" CTA visible
└─ Action: Start KYC submission

              │ User submits KYC
              ▼

State 2: SUBMITTED (Under Review)
├─ kycStatus: 'submitted'
├─ kycDocumentId: [doc_id]
├─ kycSubmittedAt: [timestamp]
├─ isCreatorVerified: false
├─ canCreateProjects: false
├─ UI: "KYC Under Review" badge
└─ Action: Wait for admin review

              │ Admin reviews
              ▼
        ┌─────┴─────┐
        │           │
    Approved    Rejected
        │           │
        ▼           ▼

State 3A: APPROVED
├─ kycStatus: 'approved'
├─ kycApprovedAt: [timestamp]
├─ isCreatorVerified: ✅ TRUE
├─ canCreateProjects: ✅ TRUE
├─ rolePreferences.canAccessCreatorMode: ✅ TRUE
├─ creatorActivatedAt: [timestamp]
├─ UI: 
│  • Role Switcher visible
│  • "Verified Creator" badge
│  • Can create projects
└─ Action: Create projects freely

State 3B: REJECTED
├─ kycStatus: 'rejected'
├─ kycRejectedAt: [timestamp]
├─ kycRejectionReason: [text]
├─ isCreatorVerified: false
├─ canCreateProjects: false
├─ UI:
│  • "KYC Rejected" message
│  • Show rejection reason
│  • "Resubmit KYC" button
└─ Action: Fix issues and resubmit
              │
              ▼
        (Back to State 2)
```

---

## Flow 8: Payment Method Usage

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PAYMENT METHOD FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

During KYC Submission:
┌──────────────────────────────┐
│  User submits payment method │
│  • UPI: user@upi             │
│  OR                          │
│  • Bank: Account details     │
└──────────────────────────────┘
              │
              ▼
┌──────────────────────────────┐
│  Stored in kyc_documents:    │
│  paymentMethods: [{          │
│    type: 'upi',              │
│    upiId: 'user@upi',        │
│    isPrimary: true           │
│  }]                          │
└──────────────────────────────┘
              │
              │ KYC Approved
              ▼
┌──────────────────────────────┐
│  User creates project        │
└──────────────────────────────┘
              │
              ▼
┌──────────────────────────────┐
│  System auto-fills:          │
│  • Fetch userKYC data        │
│  • Use paymentMethods[0]     │
│  • No need to re-enter       │
└──────────────────────────────┘
              │
              ▼
┌──────────────────────────────┐
│  Project document stores:    │
│  • kycDocumentId: [ref]      │
│  • paymentMethodType: 'upi'  │
│  (References KYC data)       │
└──────────────────────────────┘
              │
              ▼
┌──────────────────────────────┐
│  When funds are withdrawn:   │
│  • Look up kycDocumentId     │
│  • Get payment method        │
│  • Process to that account   │
└──────────────────────────────┘
```

---

## Summary of Key Decision Points

1. **Signup** → Always Supporter
2. **KYC Status Check** → Show/Hide Creator Features
3. **Admin Review** → Approve or Reject KYC
4. **Creator Access** → Only if KYC Approved
5. **Project Creation** → No repeated KYC
6. **Role Switcher** → Conditional Visibility
7. **Payment** → Linked to KYC Document

---

**End of User Flows** ✅
