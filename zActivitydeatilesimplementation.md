# 🚀 Future Planned Features & Improvements

**Last Updated:** November 28, 2025  
**Project:** Lineup - Crowdfunding Platform

---

## 📋 Activity System - Pending Integrations

### **1. Checkout Flow Integration**
**Priority:** High  
**Time Estimate:** 30 minutes  

**What to Do:**
When a user backs a project through the checkout flow, log two activities:

```typescript
// In checkout completion handler:
// 1. For the backer
await logActivity(
  userId,
  'project_backed',
  { 
    amount: backingAmount,
    projectName: project.title,
    anonymous: isAnonymous
  },
  projectId,
  project.title
);

// 2. For the creator (shows in their dashboard)
await logActivity(
  projectCreatorId,
  'new_backer',
  { 
    amount: backingAmount,
    displayName: isAnonymous ? 'Anonymous Supporter' : user.displayName,
    anonymous: isAnonymous
  },
  projectId,
  project.title
);
```

**Files to Modify:**
- Find the checkout/payment completion handler
- Add the two activity logs above
- Test with both anonymous and non-anonymous backing

---

### **2. Achievement System Integration**
**Priority:** Medium  
**Time Estimate:** 20 minutes  

**What to Do:**
When achievements are unlocked, log the activity:

```typescript
// In checkAndUnlockAchievements function (src/lib/userProfile.ts)
await logActivity(
  userId,
  'achievement_unlocked',
  { 
    achievementName: achievement.title,
    achievementType: achievement.type,
    rarity: achievement.rarity
  },
  achievement.id,
  achievement.title
);
```

**Files to Modify:**
- `src/lib/userProfile.ts` → `checkAndUnlockAchievements` function
- Add activity logging after achievement is saved

---

### **3. Profile Update Logging**
**Priority:** Low  
**Time Estimate:** 15 minutes  

**What to Do:**
Log when users update their profiles:

```typescript
// In updateUserProfile function
await logActivity(
  userId,
  'profile_updated',
  { 
    fieldsUpdated: Object.keys(updates).join(', ')
  }
);
```

**Files to Modify:**
- `src/lib/userProfile.ts` → `updateUserProfile` function
- Add activity logging after profile update

---

### **4. User Follow Logging** (Optional)
**Priority:** Low  
**Time Estimate:** 10 minutes  

**What to Do:**
```typescript
// In followUser function
await logActivity(
  followerUserId,
  'user_followed',
  { },
  followedUserId,
  followedUserDisplayName
);
```

---

### **5. Project Like Logging** (Optional)
**Priority:** Low  
**Time Estimate:** 10 minutes  

**What to Do:**
```typescript
// In likeProject function
await logActivity(
  userId,
  'project_liked',
  { },
  projectId,
  projectName
);
```

---

## 🎨 Activity Feed Enhancements

### **Real-Time Updates**
**Priority:** Medium  
**Time Estimate:** 2 hours  

**What to Do:**
- Add Firestore realtime listeners to ActivityFeed
- Show new activities automatically without refresh
- Add notification dot when new activities arrive

**Implementation:**
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'user-activities'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    ),
    (snapshot) => {
      // Update activities state
    }
  );
  
  return () => unsubscribe();
}, [userId]);
```

---

### **Activity Filtering**
**Priority:** Low  
**Time Estimate:** 1 hour  

**What to Do:**
- Add filter dropdown to ActivityFeed
- Allow filtering by activity type (Projects, Achievements, Social, etc.)
- Remember user's filter preference

---

### **Activity Notifications**
**Priority:** Medium  
**Time Estimate:** 3 hours  

**What to Do:**
- Show notification badge when new activities happen
- Add "Unread" indicator on new activities
- Mark activities as "seen" after viewing

---

## 🔒 Privacy & Security Enhancements

### **Activity Privacy Settings**
**Priority:** Medium  
**Time Estimate:** 2 hours  

**What to Do:**
- Add user settings for activity visibility
- Options:
  - "Public" - Everyone can see
  - "Followers Only" - Only followers can see
  - "Private" - Only you can see

**Implementation:**
- Add `activityVisibility` field to user settings
- Update activity queries to respect this setting

---

## 📊 Analytics & Insights

### **Activity Stats Dashboard**
**Priority:** Low  
**Time Estimate:** 3 hours  

**What to Do:**
- Create analytics page showing:
  - Most active days/times
  - Activity type breakdown (pie chart)
  - Engagement trends over time
  - Comparison with other users

---

## 🚀 Performance Optimizations

### **Activity Caching**
**Priority:** Medium  
**Time Estimate:** 1.5 hours  

**What to Do:**
- Implement React Query for activity caching
- Cache activity feed for 5 minutes
- Automatic background refresh
- Optimistic updates for new activities

**Implementation:**
```typescript
const { data, isLoading } = useQuery(
  ['activities', userId, mode],
  () => getUserActivities(userId),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000 // 30 seconds
  }
);
```

---

### **Batch Activity Logging**
**Priority:** Low  
**Time Estimate:** 1 hour  

**What to Do:**
- Queue multiple activity logs
- Write to Firestore in batches
- Reduces write costs

---

## 📱 Mobile App Features

### **Push Notifications for Activities**
**Priority:** High (when mobile app is built)  
**Time Estimate:** 4 hours  

**What to Do:**
- Send push notifications for important activities:
  - "Someone backed your project!"
  - "You unlocked a new achievement!"
  - "User X started following you"

---

## 🎯 Integration Opportunities

### **Email Digest**
**Priority:** Medium  
**Time Estimate:** 3 hours  

**What to Do:**
- Weekly email digest of activities
- "Your week on Lineup" summary
- Customizable frequency (daily/weekly/off)

---

### **Social Sharing**
**Priority:** Low  
**Time Estimate:** 2 hours  

**What to Do:**
- Share achievements on social media
- "I just created my 10th project on Lineup!"
- Auto-generate share cards with stats

---

## 🧪 Testing & Quality

### **Unit Tests for Activity System**
**Priority:** High  
**Time Estimate:** 3 hours  

**What to Do:**
- Test `logActivity` function
- Test activity queries
- Test privacy settings
- Test pagination

---

### **E2E Tests**
**Priority:** Medium  
**Time Estimate:** 2 hours  

**What to Do:**
- Test complete user flows:
  - Create project → See in activity feed
  - Back project → See in both feeds
  - Follow user → See in activity feed

---

## 🔄 Migration & Cleanup

### **Historical Activity Backfill** (Optional)
**Priority:** Low  
**Time Estimate:** 4 hours  

**What to Do:**
- Create migration script to backfill activities
- Analyze existing backed-projects and projects collections
- Generate historical activities for existing users
- One-time script

**Warning:** This could be expensive on Firestore writes!

---

## 📚 Documentation

### **Activity API Documentation**
**Priority:** Medium  
**Time Estimate:** 1 hour  

**What to Do:**
- Document all activity types
- Document `logActivity` function
- Add JSDoc comments
- Create usage examples

---

## 🎁 Nice-to-Have Features

### **Activity Reactions**
**Priority:** Low  
Users can react to activities with emojis (👏, ❤️, 🎉)

### **Activity Comments**
**Priority:** Low  
Users can comment on activities (like LinkedIn)

### **Activity Sharing**
**Priority:** Low  
Share specific activities on social media

### **Activity Bookmarking**
**Priority:** Low  
Bookmark important activities for later

---

## 📝 Notes

### **Current Limitations:**
1. No real-time updates (manual refresh required)
2. Activities are public by default
3. No filtering or search within activities
4. Limited to 20 activities per page load

### **Known Issues:**
- None currently

### **Future Considerations:**
- Consider activity retention policy (delete old activities after X months)
- Consider activity archive feature for power users
- May need Firestore composite indexes for complex queries

---

**Total Estimated Time for All Items:** ~30-35 hours  
**Recommended Priority Order:**
1. Checkout flow integration (30 min) ⭐
2. Achievement integration (20 min) ⭐
3. Real-time updates (2 hours)
4. Activity privacy (2 hours)
5. Everything else as needed

---

*This document will be updated as new ideas emerge and priorities change.*
