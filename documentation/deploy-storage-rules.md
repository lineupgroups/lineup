# Firebase Storage Setup Instructions

## 1. Deploy Storage Rules

Run this command in your terminal:

```bash
firebase deploy --only storage
```

## 2. Configure CORS for Storage

Run this command to configure CORS:

```bash
gsutil cors set firebase-storage-cors.json gs://line-up-d9edf.firebasestorage.app
```

If you don't have `gsutil` installed, you can:
1. Go to Firebase Console > Storage > Rules
2. Copy the contents of `storage.rules` and paste them there
3. Click "Publish"

## 3. Alternative CORS Setup (if gsutil doesn't work)

You can also set CORS via the Google Cloud Console:
1. Go to https://console.cloud.google.com/storage/browser
2. Select your bucket: `line-up-d9edf.firebasestorage.app`
3. Go to "Permissions" tab
4. Click "Edit CORS configuration"
5. Paste the contents of `firebase-storage-cors.json`

## 4. Verify Authentication

Make sure you're signed in to Firebase:
```bash
firebase login
firebase use line-up-d9edf
```

## Troubleshooting

If you're still getting CORS errors:
1. Clear browser cache and cookies
2. Try in incognito mode
3. Check Firebase Console > Authentication to ensure user is signed in
4. Verify the storage bucket name in `.env.local` matches your Firebase project

