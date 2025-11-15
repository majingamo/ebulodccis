# Firebase Setup for New Collections (equipmentHistory & notifications)

This guide explains what you need to do in Firebase Console for the new collections we just added.

## 🎯 Quick Answer

**Good News:** The collections (`equipmentHistory` and `notifications`) will be **automatically created** when the app first writes data to them. However, you need to:

1. ✅ **Create Composite Indexes** (Required - Firebase will prompt you)
2. ✅ **Update Security Rules** (Recommended)

---

## 📋 Step-by-Step Setup

### Step 1: Let Firebase Auto-Create the Collections

**You don't need to manually create these collections!** They will be created automatically when:
- A request is approved → creates `equipmentHistory` entry
- Equipment is returned → creates `equipmentHistory` entry  
- A notification is created → creates `notifications` entry

**What happens:**
1. Use the app normally (approve requests, return equipment, etc.)
2. Firebase will automatically create the collections
3. If an index is needed, Firebase will show an error with a link to create it

---

## 🔍 Step 2: Create Composite Indexes (IMPORTANT!)

Firebase requires **composite indexes** for queries that use both `where()` and `orderBy()` on different fields.

### Index 1: equipmentHistory Collection

**Query Used:**
```javascript
db.collection("equipmentHistory")
  .where("equipmentId", "==", equipmentId)
  .orderBy("timestamp", "desc")
```

**How to Create:**
1. Go to Firebase Console → Firestore Database
2. Click on **Indexes** tab
3. Click **Create Index**
4. Set up:
   - **Collection ID:** `equipmentHistory`
   - **Fields to index:**
     - `equipmentId` → **Ascending**
     - `timestamp` → **Descending**
   - **Query scope:** Collection
5. Click **Create**

**OR** - Firebase will show an error link when you first use this query:
- Look for error message like: "The query requires an index"
- Click the link in the error
- Firebase will auto-generate the index URL for you

### Index 2: notifications Collection

**Query Used:**
```javascript
db.collection("notifications")
  .where("userId", "==", "admin")
  .orderBy("timestamp", "desc")
```

**How to Create:**
1. Go to Firebase Console → Firestore Database
2. Click on **Indexes** tab
3. Click **Create Index**
4. Set up:
   - **Collection ID:** `notifications`
   - **Fields to index:**
     - `userId` → **Ascending**
     - `timestamp` → **Descending**
   - **Query scope:** Collection
5. Click **Create**

### Index 3: requests Collection (If Not Already Created)

**Query Used:**
```javascript
db.collection("requests")
  .where("borrowerId", "==", borrowerId)
  .orderBy("timestamp", "desc")
```

**How to Create:**
1. Go to Firebase Console → Firestore Database
2. Click on **Indexes** tab
3. Click **Create Index**
4. Set up:
   - **Collection ID:** `requests`
   - **Fields to index:**
     - `borrowerId` → **Ascending**
     - `timestamp` → **Descending**
   - **Query scope:** Collection
5. Click **Create**

---

## 🔒 Step 3: Update Security Rules

Update your Firestore Security Rules to include the new collections.

### Current Rules (Update These)

Go to **Firebase Console → Firestore Database → Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing collections...
    match /borrowers/{borrowerId} {
      allow read: if true; // Adjust based on your security needs
      allow write: if false; // Only admins
    }
    
    match /admins/{adminId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /equipments/{equipmentId} {
      allow read: if true;
      allow write: if false; // Only admins
    }
    
    match /requests/{requestId} {
      allow read: if true;
      allow create: if true; // Borrowers can create requests
      allow update: if false; // Only admins
    }
    
    // NEW: equipmentHistory Collection
    match /equipmentHistory/{historyId} {
      allow read: if true; // Anyone can read history
      allow create: if true; // System can create history entries
      allow update: if false; // History should not be modified
      allow delete: if false; // History should not be deleted
    }
    
    // NEW: notifications Collection
    match /notifications/{notificationId} {
      // Users can read their own notifications
      allow read: if request.resource.data.userId == resource.data.userId || 
                     resource.data.userId == "admin";
      // System can create notifications
      allow create: if true;
      // Users can update their own notifications (mark as read)
      allow update: if request.resource.data.userId == resource.data.userId || 
                       resource.data.userId == "admin";
      allow delete: if false; // Notifications should not be deleted
    }
  }
}
```

### Development Rules (For Testing Only)

If you're still in development and want to allow all reads/writes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING:** This allows anyone to read/write. Only use for development!

---

## 📊 Collection Structure Reference

### equipmentHistory Collection

**Fields:**
- `equipmentId` (string) - ID of the equipment
- `equipmentName` (string) - Name of the equipment
- `borrowerId` (string) - ID of the borrower
- `requestId` (string) - ID of the request
- `action` (string) - "borrowed" or "returned"
- `timestamp` (timestamp) - When the action occurred
- `expectedReturnDate` (string, optional) - Expected return date (for borrowed)
- `condition` (string, optional) - Equipment condition on return
- `notes` (string, optional) - Notes about the return

**Example Document:**
```json
{
  "equipmentId": "abc123",
  "equipmentName": "Laptop",
  "borrowerId": "23-140133",
  "requestId": "req456",
  "action": "borrowed",
  "timestamp": "2025-01-15T10:30:00Z",
  "expectedReturnDate": "2025-01-20"
}
```

### notifications Collection

**Fields:**
- `userId` (string) - ID of the user (borrower ID or "admin")
- `type` (string) - Type of notification: "request_approved", "request_rejected", "equipment_returned", "pending_requests"
- `data` (map) - Additional data (equipmentName, requestId, count, etc.)
- `read` (boolean) - Whether the notification has been read
- `timestamp` (timestamp) - When the notification was created

**Example Document:**
```json
{
  "userId": "23-140133",
  "type": "request_approved",
  "data": {
    "equipmentName": "Laptop",
    "requestId": "req456"
  },
  "read": false,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## ✅ Testing Checklist

After setup, test these features:

1. **Equipment History:**
   - ✅ Approve a request → Should create `equipmentHistory` entry
   - ✅ Return equipment → Should create `equipmentHistory` entry
   - ✅ View equipment history → Should display without errors

2. **Notifications:**
   - ✅ Approve a request → Should create notification for borrower
   - ✅ View notifications → Should display in notification dropdown
   - ✅ Mark as read → Should update notification

3. **Indexes:**
   - ✅ All queries should work without index errors
   - ✅ Check Firebase Console → Indexes → Should see all indexes created

---

## 🚨 Common Issues & Solutions

### Issue 1: "The query requires an index"

**Solution:**
- Click the error link Firebase provides
- OR manually create the index as described in Step 2
- Wait a few minutes for index to build

### Issue 2: "Permission denied"

**Solution:**
- Check Security Rules (Step 3)
- Make sure rules allow read/write for the collections
- For development, use the permissive rules temporarily

### Issue 3: Collections not appearing

**Solution:**
- Collections are auto-created when first document is added
- Try creating a request and approving it
- Check Firestore Database tab in Firebase Console

### Issue 4: Index creation is slow

**Solution:**
- Index creation can take a few minutes
- Check status in Firebase Console → Indexes tab
- Wait until status shows "Enabled"

---

## 📝 Quick Setup Summary

1. **Collections:** ✅ Auto-created (no action needed)
2. **Indexes:** ⚠️ Create manually (Step 2) or use Firebase error links
3. **Security Rules:** ⚠️ Update rules (Step 3) to include new collections

---

## 🎯 Minimum Required Action

**If you want to test immediately:**
1. Use the app (approve a request, return equipment)
2. When you see an index error, click the link Firebase provides
3. Firebase will create the index for you automatically

**For production:**
1. Create all indexes manually (Step 2)
2. Update security rules (Step 3)
3. Test all functionality

---

## 💡 Pro Tips

1. **Index Status:** Check Firebase Console → Indexes to see if indexes are building
2. **Error Messages:** Firebase will tell you exactly which index is needed
3. **Security Rules:** Start with permissive rules for testing, then lock down for production
4. **Collection Names:** Make sure collection names match exactly (case-sensitive)

---

## 🆘 Need Help?

If you encounter issues:
1. Check Firebase Console → Firestore Database → Indexes
2. Check Firebase Console → Firestore Database → Rules
3. Check browser console for specific error messages
4. Firebase error messages usually include direct links to create missing indexes

