# Firestore Security Rules

## ⚠️ IMPORTANT: Security Rules Setup

Your Firestore security rules are **CRITICAL** for protecting your data. Even though users can see your JavaScript code, they **CANNOT bypass** Firestore security rules.

## Recommended Security Rules

Copy and paste these rules into your Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated as admin
    function isAdmin() {
      // Since you're using localStorage, you'll need to pass adminId in request
      // For now, this is a basic check - you may want to implement Firebase Authentication
      return request.auth != null && request.auth.token.admin == true;
    }
    
    // Helper function to get user ID from request
    function getUserId() {
      return request.auth != null ? request.auth.uid : null;
    }
    
    // ============================================
    // ADMINS COLLECTION
    // ============================================
    match /admins/{adminId} {
      // Only admins can read their own document
      allow read: if request.auth != null && request.auth.uid == adminId;
      // Only authenticated admins can write (create account page)
      allow write: if request.auth != null;
    }
    
    // ============================================
    // BORROWERS COLLECTION
    // ============================================
    match /borrowers/{borrowerId} {
      // Borrowers can read their own data
      // Admins can read all borrower data
      allow read: if request.auth != null && 
                     (request.auth.uid == borrowerId || 
                      request.auth.token.role == 'admin');
      // Only admins can create/update borrowers (via create_account.html)
      allow create: if request.auth != null && request.auth.token.role == 'admin';
      allow update: if request.auth != null && request.auth.token.role == 'admin';
      // No one can delete borrowers
      allow delete: if false;
    }
    
    // ============================================
    // EQUIPMENTS COLLECTION
    // ============================================
    match /equipments/{equipmentId} {
      // Everyone can read equipment (borrowers need to see available equipment)
      allow read: if true;
      // Only admins can create, update, or delete equipment
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // ============================================
    // REQUESTS COLLECTION
    // ============================================
    match /requests/{requestId} {
      // Borrowers can read their own requests
      // Admins can read all requests
      allow read: if request.auth != null && 
                     (resource.data.borrowerId == request.auth.uid || 
                      request.auth.token.role == 'admin');
      // Borrowers can create requests for themselves
      allow create: if request.auth != null && 
                       request.resource.data.borrowerId == request.auth.uid;
      // Borrowers can update their own pending requests (to cancel)
      // Admins can update any request (to approve/reject/return)
      allow update: if request.auth != null && 
                       (request.auth.token.role == 'admin' || 
                        (resource.data.borrowerId == request.auth.uid && 
                         resource.data.status == 'pending' && 
                         request.resource.data.status == 'cancelled'));
      // No one can delete requests
      allow delete: if false;
    }
    
    // ============================================
    // EQUIPMENT HISTORY COLLECTION
    // ============================================
    match /equipmentHistory/{historyId} {
      // Only admins can read equipment history
      allow read: if request.auth != null && request.auth.token.role == 'admin';
      // Only admins can create history entries
      allow create: if request.auth != null && request.auth.token.role == 'admin';
      // No one can update or delete history
      allow update: if false;
      allow delete: if false;
    }
    
    // ============================================
    // NOTIFICATIONS COLLECTION
    // ============================================
    match /notifications/{notificationId} {
      // Users can read their own notifications
      // Admins can read admin notifications
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.userId == 'admin' && request.auth.token.role == 'admin');
      // Only system (admin) can create notifications
      allow create: if request.auth != null && request.auth.token.role == 'admin';
      // Users can update their own notifications (to mark as read)
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      // No one can delete notifications
      allow delete: if false;
    }
  }
}
```

## ⚠️ CURRENT LIMITATION

**Your current implementation uses localStorage for authentication, NOT Firebase Authentication.**

This means the security rules above won't work as-is because:
- `request.auth` will be `null` (no Firebase Auth)
- There's no way to verify user identity server-side with localStorage

## 🔧 Solutions

### Option 1: Implement Firebase Authentication (Recommended)

1. **Enable Firebase Authentication** in Firebase Console
2. **Use Email/Password or Custom Auth** to authenticate users
3. **Update your code** to use Firebase Auth instead of localStorage
4. **Update security rules** to use `request.auth.uid`

### Option 2: Temporary Rules (For Development Only)

If you must use localStorage for now, use these **less secure** rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ WARNING: These rules are LESS SECURE
    // They rely on client-side validation only
    
    // Admins - restrict access
    match /admins/{adminId} {
      allow read, write: if false; // No direct access - use server functions
    }
    
    // Borrowers - read only for now
    match /borrowers/{borrowerId} {
      allow read: if true; // ⚠️ Anyone can read - NOT SECURE
      allow write: if false;
    }
    
    // Equipment - everyone can read
    match /equipments/{equipmentId} {
      allow read: if true;
      allow write: if false; // ⚠️ Restrict writes - use server functions
    }
    
    // Requests - read/write for all (client validates)
    match /requests/{requestId} {
      allow read, write: if true; // ⚠️ NOT SECURE - client-side validation only
    }
    
    // Equipment History - admin only (client validates)
    match /equipmentHistory/{historyId} {
      allow read, write: if true; // ⚠️ NOT SECURE
    }
    
    // Notifications - user-specific (client validates)
    match /notifications/{notificationId} {
      allow read, write: if true; // ⚠️ NOT SECURE
    }
  }
}
```

## 🎯 Best Practice

**For production, you MUST:**
1. Implement Firebase Authentication
2. Use proper security rules with `request.auth`
3. Never rely on client-side validation alone
4. Use server-side validation for sensitive operations

## 📝 Current Security Status

**What's Protected:**
- ✅ Cloudinary API Secret (server-side PHP)
- ✅ Image deletion (server-side)

**What's NOT Protected:**
- ❌ Firestore data (no security rules implemented)
- ❌ Passwords (stored in plain text)
- ❌ User authentication (client-side only)

## 🔒 Next Steps

1. **Set up Firebase Authentication** (Email/Password or Custom)
2. **Update login code** to use Firebase Auth
3. **Implement proper security rules**
4. **Hash passwords** (if not using Firebase Auth)
5. **Test security rules** thoroughly

## 📚 Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)

