import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, AuthContextType, UserMode, UserRole, UserRolePreferences } from '../types/auth';
import { generateUniqueUsername } from '../lib/usernameGenerator';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentMode, setCurrentMode] = useState<UserMode>('supporter');
  const [loading, setLoading] = useState(true);

  // Create or update user document in Firestore
  const createUserDocument = async (firebaseUser: FirebaseUser, additionalData?: any) => {
    if (!firebaseUser) return;

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = firebaseUser;
      const createdAt = new Date();

      try {
        const defaultRolePreferences: UserRolePreferences = {
          primaryRole: 'supporter',
          defaultMode: 'supporter',
          hasCreatedProjects: false,
          hasBackedProjects: false,
          roleHistory: [],
          preferredStartMode: 'supporter',
          canAccessCreatorMode: false // NEW: Only true after KYC approval
        };

        // Generate unique username from display name
        const generatedUsername = await generateUniqueUsername(displayName || '');

        await setDoc(userRef, {
          uid: firebaseUser.uid,
          displayName: displayName || additionalData?.displayName || '',
          email,
          photoURL: '', // Don't use Google photo, we'll use our own system
          profileImage: '', // Empty - will use initials
          bio: '',
          location: '',
          // New onboarding fields
          username: generatedUsername, // Auto-generated username
          isProfileComplete: false,
          profileCompletionScore: 25, // Some progress since we have name and username
          onboardingStep: 1,
          isEmailVerified: firebaseUser.emailVerified,
          createdAt,
          updatedAt: createdAt,
          socialLinks: {},
          stats: {
            projectsCreated: 0,
            projectsSupported: 0,
            totalRaised: 0,
            totalSupported: 0
          },
          // NEW: Role management
          rolePreferences: defaultRolePreferences,
          currentMode: 'supporter',
          // NEW: KYC and Creator Verification (default values)
          kycStatus: 'not_started',
          isCreatorVerified: false,
          canCreateProjects: false
        });
      } catch (error) {
        console.error('Error creating user document:', error);
        toast.error('Error creating user profile');
      }
    }

    return userRef;
  };

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userObj = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          username: userData.username || '', // NEW: Include username
          photoURL: userData.profileImage || '', // Only use our profileImage, not Google photoURL
          profileImage: userData.profileImage || '', // NEW: Add profileImage field for components
          bio: userData.bio,
          location: userData.location,
          isProfileComplete: userData.isProfileComplete || false, // NEW: Onboarding status
          profileCompletionScore: userData.profileCompletionScore || 0, // NEW: Completion score
          onboardingStep: userData.onboardingStep || 0, // NEW: Onboarding step
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          socialLinks: userData.socialLinks || {},
          stats: userData.stats || {
            projectsCreated: 0,
            projectsSupported: 0,
            totalRaised: 0,
            totalSupported: 0
          },
          // NEW: Role management
          rolePreferences: userData.rolePreferences || {
            primaryRole: 'supporter',
            defaultMode: 'supporter',
            hasCreatedProjects: false,
            hasBackedProjects: false,
            roleHistory: [],
            preferredStartMode: 'supporter',
            canAccessCreatorMode: userData.isCreatorVerified || false // NEW: Based on KYC approval
          },
          currentMode: userData.currentMode || 'supporter',
          // NEW: Supporter preferences
          interests: userData.interests || [],
          supporterOnboardingComplete: userData.supporterOnboardingComplete || false,

          // NEW: KYC and Creator Verification
          kycStatus: userData.kycStatus || 'not_started',
          kycSubmittedAt: userData.kycSubmittedAt?.toDate(),
          kycApprovedAt: userData.kycApprovedAt?.toDate(),
          kycRejectedAt: userData.kycRejectedAt?.toDate(),
          kycRejectionReason: userData.kycRejectionReason,
          kycDocumentId: userData.kycDocumentId,
          isCreatorVerified: userData.isCreatorVerified || false,
          canCreateProjects: userData.canCreateProjects || false,
          creatorActivatedAt: userData.creatorActivatedAt?.toDate(),
        };

        // Set the current mode based on user preferences
        setCurrentMode(userObj.rolePreferences?.preferredStartMode || userObj.currentMode || 'supporter');

        return userObj;
      }
    } catch (error) {
      // Error fetching user data
    }
    return null;
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(firebaseUser);
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Update Firebase profile
      await firebaseUpdateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      await createUserDocument(firebaseUser, { displayName });

      // Fetch user data
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Map Firebase error codes to user-friendly messages
      let errorMessage = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Try signing in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password sign up is not enabled. Contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      await createUserDocument(firebaseUser);
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
      toast.success('Welcome to Lineup!');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    if (!firebaseUser) return;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const updatedUser = await fetchUserData(firebaseUser);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userData = await fetchUserData(firebaseUser);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false); // Only set loading false after all async operations complete
    });

    return unsubscribe;
  }, []);

  // Refresh user data from Firestore
  const refreshUserData = async () => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
    }
  };

  // Switch between supporter and creator modes
  const switchMode = async (mode: UserMode) => {
    if (!user || !firebaseUser) return;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);

      // Update the mode history
      const newModeSwitch = {
        from: currentMode,
        to: mode,
        switchedAt: new Date()
      };

      const updatedRoleHistory = [...(user.rolePreferences?.roleHistory || []), newModeSwitch];

      // Update role preferences
      const updatedRolePreferences: UserRolePreferences = {
        ...user.rolePreferences!,
        preferredStartMode: mode,
        roleHistory: updatedRoleHistory
      };

      await updateDoc(userRef, {
        currentMode: mode,
        rolePreferences: updatedRolePreferences,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setCurrentMode(mode);

      // Update user object
      const updatedUser = {
        ...user,
        currentMode: mode,
        rolePreferences: updatedRolePreferences
      };
      setUser(updatedUser);

      toast.success(`Switched to ${mode} mode`);
    } catch (error) {
      console.error('Error switching mode:', error);
      toast.error('Failed to switch mode');
    }
  };

  // Get user's current role based on their activity
  const getUserRole = (): UserRole => {
    if (!user?.rolePreferences) return 'supporter';

    const { hasCreatedProjects, hasBackedProjects } = user.rolePreferences;

    if (hasCreatedProjects && hasBackedProjects) return 'hybrid';
    if (hasCreatedProjects) return 'creator';
    return 'supporter';
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    currentMode,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updateProfile,
    refreshUserData,
    switchMode,
    getUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
