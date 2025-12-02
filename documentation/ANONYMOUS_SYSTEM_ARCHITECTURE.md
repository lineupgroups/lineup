# Anonymous System - System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ANONYMOUS DONATION SYSTEM                         │
│                         Lineup Crowdfunding Platform                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│ Profile Settings     │          │ Project Detail Page  │
│ ─────────────────── │          │ ─────────────────── │
│ Privacy Tab:         │          │                      │
│ ☐ Donate            │          │ [Back This Project]  │
│   Anonymously       │          │       Button         │
│   by Default        │          │                      │
└──────────────────────┘          └──────────────────────┘
        │                                   │
        │                                   ├─ Opens Modal
        │                                   ▼
        │              ┌────────────────────────────────────┐
        │              │   BackProjectModal                 │
        │              │   ─────────────────────────────   │
        │              │                                    │
        │              │   Step 1: Amount Selection         │
        │              │   ┌──────────────────────────┐    │
        │              │   │ ☐ Make this donation    │    │
        │              │   │   anonymous              │    │
        │              │   │                          │    │
        │              │   │ Preview: anonymous_      │    │
        │              │   │         user3284#2       │    │
        │              │   └──────────────────────────┘    │
        │              │                                    │
        │              │   Step 2: Payment Form             │
        │              │   Step 3: Success Screen           │
        │              └────────────────────────────────────┘
        │                            │
        └────────────────────────────┼────────────────────────┐
                                     ▼                        │
┌─────────────────────────────────────────────────────────────v──────────┐
│                          BUSINESS LOGIC LAYER                           │
└─────────────────────────────────────────────────────────────────────────┘

                     ┌────────────────────────────┐
                     │ shouldDisplayAsAnonymous() │
                     │ ───────────────────────── │
                     │                            │
                     │  IF isPublic === false:    │
                     │    → ALWAYS ANONYMOUS      │
                     │                            │
                     │  ELSE IF override !== null:│
                     │    → USE OVERRIDE          │
                     │                            │
                     │  ELSE:                     │
                     │    → USE DEFAULT PREF      │
                     └────────────────────────────┘
                                  │
                                  ▼
                     ┌────────────────────────────┐
                     │    getDisplayInfo()        │
                     │ ───────────────────────── │
                     │                            │
                     │  IF anonymous:             │
                     │    name = anonymous_user#  │
                     │    image = undefined       │
                     │  ELSE:                     │
                     │    name = real name        │
                     │    image = profile pic     │
                     └────────────────────────────┘
                                  │
                                  ▼
                     ┌────────────────────────────┐
                     │ recordProjectBacking()     │
                     │ ───────────────────────── │
                     │                            │
                     │  1. Fetch user profile     │
                     │  2. Calculate isAnonymous  │
                     │  3. Get display info       │
                     │  4. Store to Firestore     │
                     │  5. Log activity           │
                     └────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                 │
└─────────────────────────────────────────────────────────────────────────┘

     ┌────────────────────┐              ┌────────────────────┐
     │ users collection   │              │ backed-projects    │
     │ ────────────────── │              │ ────────────────── │
     │                    │              │                    │
     │ {                  │              │ {                  │
     │   id: "abc123"     │              │   userId: "abc123" │
     │   isPublic: true   │              │   projectId: "..." │
     │   donateAnon...    │◄─────────────┤   amount: 1000     │
     │     ByDefault:     │  references  │   anonymous: true  │
     │       false        │              │   displayName:     │
     │ }                  │              │    "anonymous_     │
     │                    │              │     user3284#2"    │
     │                    │              │   displayProfile   │
     │                    │              │     Image: null    │
     │                    │              │ }                  │
     └────────────────────┘              └────────────────────┘
              │                                    │
              │                                    │
              ▼                                    ▼
     ┌─────────────────────────────────────────────────────┐
     │           FIRESTORE SECURITY RULES                   │
     │ ──────────────────────────────────────────────────  │
     │                                                      │
     │  ✅ Privacy enforcement (isPublic check)            │
     │  ✅ Blocked users cannot view profiles              │
     │  ✅ Private profiles show minimal data              │
     │  ✅ Creators must have public profiles              │
     └─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        DISPLAY LAYER                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────┐
│ Backed Projects Tab  │     │ Supporter Lists      │     │ Activity Feed│
│ ─────────────────── │     │ ─────────────────── │       │ ──────────── │
│                      │     │                      │     │              │
│ ✅ Project A         │     │ Supporters (25):     │    │ Recent:       │
│    ₹1,000           │     │                      │     │               │
│    🕶️ Backed        │     │ 1. anonymous_user    │     │ anonymous_   │
│       Anonymously    │     │    3284#2 - ₹1,000  │     │  user3284#2  │
│                      │     │ 2. John Doe - ₹500  │     │  backed      │
│ ✅ Project B         │     │ 3. anonymous_user    │     │  Project X   │
│    ₹500             │     │    7651#8 - ₹2,000  │     │              │
└──────────────────────┘     └──────────────────────┘     └──────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     ANONYMOUS ID GENERATION                              │
└─────────────────────────────────────────────────────────────────────────┘

   Input: userId = "abc123xyz"
      │
      ▼
   Hash Function (deterministic)
      │
      ▼
   Extract 4-digit number: 3284
   Calculate check digit: 2
      │
      ▼
   Output: "anonymous_user3284#2"

   Properties:
   ✅ Same user → Same ID (consistent)
   ✅ Different users → Different IDs
   ✅ Cannot reverse to get real userId
   ✅ Human-readable format
   ✅ Easy to type and share

┌─────────────────────────────────────────────────────────────────────────┐
│                       DATA FLOW EXAMPLE                                  │
└─────────────────────────────────────────────────────────────────────────┘

1. USER ACTION:
   User clicks "Back This Project"
   Checks "Make this donation anonymous"
   Enters ₹1,000
   Clicks "Complete Backing"

2. FRONTEND:
   BackProjectModal calls recordProjectBacking(userId, projectId, 1000, null, true)
                                                                          ↑
                                                                  isAnonymousOverride

3. BACKEND:
   a) Fetch user profile → { isPublic: true, donateAnonymousByDefault: false }
   b) Calculate anonymous → shouldDisplayAsAnonymous(true, false, true) → TRUE
   c) Get display info → { displayName: "anonymous_user3284#2", image: null }
   d) Store to Firestore

4. DATABASE:
   backed-projects/{backingId}:
   {
     userId: "abc123xyz",           // Real ID (private)
     amount: 1000,
     anonymous: true,
     displayName: "anonymous_user3284#2",  // Public display
     displayProfileImage: null
   }

5. DISPLAY:
   When showing supporters:
   - Use displayName from record
   - Show "anonymous_user3284#2" instead of real name
   - No profile picture
   - No link to profile

┌─────────────────────────────────────────────────────────────────────────┐
│                      PRIVACY LEVELS                                      │
└─────────────────────────────────────────────────────────────────────────┘

Level 1: FULLY PUBLIC
─────────────────────
• isPublic: true
• donateAnonymousByDefault: false
• Per-transaction: false
→ RESULT: Shows real identity everywhere

Level 2: ANONYMOUS BY DEFAULT
──────────────────────────────
• isPublic: true
• donateAnonymousByDefault: true
• Per-transaction: (can override)
→ RESULT: Anonymous unless unchecked per transaction

Level 3: FULLY PRIVATE
──────────────────────
• isPublic: false
• donateAnonymousByDefault: N/A
• Per-transaction: N/A (forced)
→ RESULT: Always anonymous, no exceptions

┌─────────────────────────────────────────────────────────────────────────┐
│                        TESTING SCENARIOS                                 │
└─────────────────────────────────────────────────────────────────────────┘

Scenario 1: Public user, no default, checks box
────────────────────────────────────────────────
Setup: isPublic=true, default=false, override=true
Result: ✅ Anonymous
Display: "anonymous_user3284#2"

Scenario 2: Public user, with default, unchecks box
────────────────────────────────────────────────────
Setup: isPublic=true, default=true, override=false
Result: ❌ Not Anonymous
Display: "John Doe" + profile pic

Scenario 3: Private user, wants to be public
──────────────────────────────────────────────
Setup: isPublic=false, (checkbox disabled)
Result: ✅ Always Anonymous (forced)
Display: "anonymous_user3284#2"

Scenario 4: Public user, with default, doesn't change
──────────────────────────────────────────────────────
Setup: isPublic=true, default=true, override=null
Result: ✅ Anonymous (uses default)
Display: "anonymous_user3284#2"
