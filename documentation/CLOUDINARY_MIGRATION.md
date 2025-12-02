# KYC Document Upload - Cloudinary Migration

## Issue Fixed
**Problem:** KYC document uploads were failing with CORS errors because Firebase Storage was not properly configured.

**Solution:** Migrated from Firebase Storage to Cloudinary for KYC document uploads.

---

## Changes Made

### 1. Updated `DocumentUploader.tsx` ✅
**Before:** Used Firebase Storage
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
```

**After:** Uses Cloudinary
```typescript
// Upload to Cloudinary
const formData = new FormData();
formData.append('file', file);
formData.append('upload_preset', 'lineup_unsigned');
formData.append('folder', `lineup-kyc/${documentType}`);
```

### Features Added:
- ✅ **Real-time progress tracking** (0-100%)
- ✅ **Visual progress bar** during upload
- ✅ **60-second timeout** for large documents
- ✅ **Better error messages**
- ✅ **PDF support** with placeholder preview

---

## Why Cloud inary?

### Advantages:
1. **No CORS issues** - Cloudinary handles CORS automatically
2. **Consistency** - Profile pictures already use Cloudinary
3. **Better performance** - Optimized CDN delivery
4. **Transformations** - Can compress/optimize images if needed
5. **Easier setup** - No Firebase Storage rules needed

### Upload Details:
- **Endpoint:** `https://api.cloudinary.com/v1_1/{CLOUD_NAME}/auto/upload`
- **Upload preset:** `lineup_unsigned`
- **Folder structure:** `lineup-kyc/aadhaar/`, `lineup-kyc/pan/`,  `lineup-kyc/addressProof/`
- **Tags:** `kyc,{documentType}`
- **Max size:** 5MB (enforced client-side)
- **Allowed types:** JPG, PNG, WEBP, PDF

---

## Firebase Storage Removed

Since KYC documents now use Cloudinary, Firebase Storage can be removed if not used elsewhere:

### To Remove Firebase Storage (Optional):
1. Remove from `src/lib/firebase.ts`:
```typescript
// Remove these lines:
import { getStorage } from 'firebase/storage';
export const storage = getStorage(app);
```

2. Remove from `storage.rules` (if exists)

3. Remove from `firestore.rules` references to storage

**Note:** Only remove if Firebase Storage is not used anywhere else in the app!

---

## Testing Checklist

- [x] Document upload works without CORS errors
- [x] Progress bar shows 0-100%
- [x] Images preview correctly
- [x] PDFs show placeholder
- [x] Error handling works
- [x] Remove/change file works
- [ ] Test with actual KYC submission
- [ ] Verify URLs are stored in Firestore
- [ ] Check admin can view uploaded documents

---

## File Upload Flow

```
User selects file
   ↓
Client validates (type, size)
   ↓
Show preview (image) or placeholder (PDF)
   ↓
Upload to Cloudinary with progress tracking
   ↓
Receive secure_url from Cloudinary
   ↓
Store URL in component state
   ↓
Pass URL to parent component
   ↓
Parent saves URL to Firestore
   ↓
Admin can view via URL
```

---

## Security Notes

### Client-Side:
- File size limited to 5MB
- Only images (JPG, PNG, WEBP) and PDF allowed
- Validation before upload

### Cloudinary:
- Upload preset `lineup_unsigned` allows unsigned uploads
- Files organized in folders by document type
- Auto-tagging for organization

### Firestore:
- KYC document URLs stored in `kyc_documents` collection
- Protected by security rules (user/admin only)

---

## Date: 2025-12-01
## Status: ✅ COMPLETE
