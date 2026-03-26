// Firebase Security Rules for Project Updates
// =============================================
// 
// Add these rules to your firestore.rules file in the Firebase Console
// or in your local firestore.rules file.
//
// These rules ensure:
// 1. Only authenticated users can create updates
// 2. Only the creator can edit/delete their updates
// 3. Supporters-only updates are only visible to backers
// 4. Like/comment operations require authentication
// 5. Comments can be soft-deleted by owner or project creator

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is a supporter of the project
    function isSupporterOf(projectId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/backed-projects/$(request.auth.uid + '_' + projectId));
    }
    
    // Helper function to check if user is the creator of a project
    function isCreatorOf(projectId) {
      let project = get(/databases/$(database)/documents/projects/$(projectId));
      return isAuthenticated() && project.data.creatorId == request.auth.uid;
    }
    
    // Project Updates Collection
    match /project-updates/{updateId} {
      // Allow read if:
      // - Update is public (visibility !== 'supporters-only')
      // - OR user is the creator
      // - OR user is a supporter
      allow read: if
        resource.data.visibility != 'supporters-only' ||
        resource.data.creatorId == request.auth.uid ||
        isSupporterOf(resource.data.projectId) ||
        isCreatorOf(resource.data.projectId);
      
      // Allow create if authenticated and user is the creator of the project
      allow create: if 
        isAuthenticated() &&
        isCreatorOf(request.resource.data.projectId) &&
        request.resource.data.creatorId == request.auth.uid;
      
      // Allow update if:
      // - User is the creator (for editing)
      // - OR authenticated user is liking/unliking (only likes/likedBy fields)
      allow update: if
        isAuthenticated() && (
          resource.data.creatorId == request.auth.uid ||
          (
            // Allow like/unlike operations for any authenticated user
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'likedBy']) &&
            (
              // User is adding themselves to likedBy
              (request.resource.data.likedBy.hasAny([request.auth.uid]) && 
               !resource.data.likedBy.hasAny([request.auth.uid])) ||
              // User is removing themselves from likedBy
              (!request.resource.data.likedBy.hasAny([request.auth.uid]) && 
               resource.data.likedBy.hasAny([request.auth.uid]))
            )
          )
        );
      
      // Allow delete only if user is the creator
      allow delete: if 
        isAuthenticated() && 
        resource.data.creatorId == request.auth.uid;
    }
    
    // Update Comments Collection
    match /update-comments/{commentId} {
      // Allow read for authenticated users
      allow read: if isAuthenticated();
      
      // Allow create for authenticated users
      allow create: if 
        isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
      
      // Allow update if:
      // - User is the comment owner (for editing)
      // - OR user is the project creator (for toggling creatorHeart)
      // - OR authenticated user is liking/unliking
      allow update: if
        isAuthenticated() && (
          resource.data.userId == request.auth.uid ||
          isCreatorOf(resource.data.projectId) ||
          (
            // Allow like/unlike operations
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'likedBy'])
          )
        );
      
      // Soft delete - only owner or creator can mark as deleted
      allow delete: if 
        isAuthenticated() && (
          resource.data.userId == request.auth.uid ||
          isCreatorOf(resource.data.projectId)
        );
    }
    
    // ... your other rules ...
  }
}
*/

// IMPORTANT NOTES:
// ================
// 
// 1. The above rules use the `isSupporterOf` helper which checks for a
//    document in 'backed-projects' collection. Make sure this matches
//    your actual data structure for tracking supporters.
//
// 2. The `isCreatorOf` helper fetches the project document to check
//    the creatorId. This uses a read operation, so be mindful of billing.
//
// 3. For the like/unlike transaction to work correctly, the client code
//    uses arrayUnion/arrayRemove which the rules validate.
//
// 4. These rules assume you're using soft-delete (isDeleted: true) for
//    comments rather than actually deleting documents.
//
// 5. Test these rules thoroughly in the Firebase Emulator before deploying
//    to production.
//
// To deploy these rules:
// 1. Copy the rules (inside the /* */ block) to your firestore.rules file
// 2. Run: firebase deploy --only firestore:rules
// OR
// 1. Go to Firebase Console > Firestore Database > Rules
// 2. Paste the rules and publish
