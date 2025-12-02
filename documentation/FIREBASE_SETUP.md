# 🔥 Firebase Setup Guide for Lineup

## Prerequisites
- Node.js installed
- Firebase account
- Git (optional)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `Line-up`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Enable
   - **Google**: Enable (optional but recommended)

## Step 3: Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Click "Done"

## Step 4: Get Firebase Configuration

1. In Firebase Console, go to "Project Settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" icon (`</>`)
4. Register your app with nickname: `lineup-web`
5. Copy the Firebase configuration object

## Step 5: Update Environment Variables

1. Open `.env.local` file in your project root
2. Replace the placeholder values with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
```

## Step 6: Set Up Firestore Security Rules

1. In Firebase Console, go to "Firestore Database"
2. Click "Rules" tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects are readable by all, writable by creator
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.creatorId || 
         request.auth.uid == request.resource.data.creatorId);
    }
    
    // Supporters are readable by project creator and supporter
    match /supporters/{supporterId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.creatorId);
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

4. Click "Publish"

## Step 7: Test the Application

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and go to `http://localhost:5173`

3. Test the following features:
   - ✅ Sign up with email/password
   - ✅ Sign in with email/password
   - ✅ Sign in with Google (if enabled)
   - ✅ Create a new project
   - ✅ View projects on homepage
   - ✅ Edit project details
   - ✅ View user profile
   - ✅ Access protected routes

## Step 8: Production Deployment (Optional)

### Deploy to Vercel:
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Update environment variables in Vercel dashboard

### Deploy to Netlify:
1. Build the project: `npm run build`
2. Upload `dist` folder to Netlify
3. Update environment variables in Netlify dashboard

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Check your `.env.local` file has correct values
   - Restart your development server

2. **"Permission denied" errors**
   - Check Firestore security rules
   - Ensure user is authenticated

3. **"Project not found" errors**
   - Verify project ID in environment variables
   - Check Firebase project is active

4. **Authentication not working**
   - Enable Email/Password in Firebase Console
   - Check domain is authorized

## Next Steps

After successful setup, you can:

1. **Add Payment Integration** (Razorpay/Stripe)
2. **Implement File Upload** (Firebase Storage)
3. **Add Email Notifications** (Firebase Functions)
4. **Set up Analytics** (Firebase Analytics)
5. **Add Push Notifications** (Firebase Messaging)

## Support

If you encounter any issues:
1. Check Firebase Console for error logs
2. Check browser console for client-side errors
3. Verify all environment variables are set correctly
4. Ensure Firestore security rules are properly configured

---

🎉 **Congratulations!** Your Lineup crowdfunding platform is now ready with Firebase backend!
