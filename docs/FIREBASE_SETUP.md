# Firebase Database Setup Guide for CCIS E-Bulod

This guide explains how to set up borrower accounts and collections in Firebase Firestore.

## 📋 Prerequisites

1. Access to Firebase Console: https://console.firebase.google.com/
2. Your project: `studio-5277928304-db252`
3. Firestore Database enabled

---

## 🗂️ Required Collections

Your Firebase Firestore should have these collections:

### 1. **borrowers** (Collection)
   - Stores borrower/user account information
   - Document ID: Student ID (e.g., `23-140133`)

### 2. **admins** (Collection)
   - Stores admin account information
   - Document ID: Student ID (e.g., `23-140133`)

### 3. **equipments** (Collection)
   - Stores equipment inventory
   - Auto-generated document IDs

### 4. **requests** (Collection)
   - Stores borrowing requests
   - Auto-generated document IDs

---

## 👤 Setting Up Borrower Accounts

### Step 1: Go to Firestore Database

1. Open Firebase Console
2. Select your project: `studio-5277928304-db252`
3. Click on **Firestore Database** in the left menu
4. Click on **Start collection** (if collections don't exist)

### Step 2: Create `borrowers` Collection

1. Collection ID: `borrowers`
2. Click **Next**

### Step 3: Add Borrower Document

**Document ID:** Use the Student ID (e.g., `23-140133`)

**Fields to add:**

| Field Name | Type | Value | Required |
|------------|------|-------|----------|
| `password` | string | User's password | ✅ Yes |
| `name` | string | Full name | ❌ Optional |
| `email` | string | Email address | ❌ Optional |
| `course` | string | Course/Program | ❌ Optional |
| `yearLevel` | string | Year level (1st, 2nd, etc.) | ❌ Optional |
| `status` | string | `"active"` or `"inactive"` | ❌ Optional |
| `createdAt` | timestamp | Current date/time | ❌ Optional |

**Example Document:**
```
Document ID: 23-140133

Fields:
- password: "student123"
- name: "John Doe"
- email: "john.doe@student.edu"
- course: "BS Computer Science"
- yearLevel: "3rd Year"
- status: "active"
- createdAt: [timestamp]
```

### Step 4: Repeat for Multiple Borrowers

Add more borrower documents with different Student IDs.

---

## 🔐 Setting Up Admin Account (Reference)

If you need to add more admins:

**Collection:** `admins`
**Document ID:** Student ID (e.g., `23-140133`)

**Required Fields:**
- `password` (string) - Admin password

**Example:**
```
Document ID: 23-140133
Fields:
- password: "admin1"
```

---

## 📦 Setting Up Equipment Collection

**Collection:** `equipments`
**Document ID:** Auto-generated (or custom)

**Fields:**
- `name` (string) - Equipment name
- `category` (string) - Equipment category
- `status` (string) - "Available", "Borrowed", or "Under Repair"
- `condition` (string) - "Good" or "Damaged"
- `location` (string) - Where equipment is stored
- `barcode` (string) - Unique barcode (optional)

---

## 📝 Setting Up Requests Collection

**Collection:** `requests`
**Document ID:** Auto-generated

**Fields (Auto-created when borrower submits request):**
- `borrowerId` (string) - Student ID of borrower
- `equipmentId` (string) - Equipment document ID
- `equipmentName` (string) - Equipment name
- `purpose` (string) - Why borrower needs it
- `returnDate` (string) - Expected return date (optional)
- `status` (string) - "pending", "approved", "rejected"
- `timestamp` (timestamp) - When request was created

---

## 🚀 Quick Setup Steps

### Option 1: Manual Setup (Firebase Console)

1. Go to Firebase Console → Firestore Database
2. Create collection: `borrowers`
3. Add document with Student ID as Document ID
4. Add fields: `password` (required), others optional
5. Save

### Option 2: Using Firebase Console Import

You can create a JSON file and import it:

```json
{
  "borrowers": {
    "23-140133": {
      "password": "student123",
      "name": "John Doe",
      "email": "john@example.com",
      "course": "BS Computer Science",
      "yearLevel": "3rd Year",
      "status": "active"
    },
    "23-140134": {
      "password": "student456",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "course": "BS Information Technology",
      "yearLevel": "2nd Year",
      "status": "active"
    }
  }
}
```

---

## 🔒 Security Rules (Important!)

Make sure your Firestore Security Rules allow reads/writes. In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users (if using Firebase Auth)
    // For now, basic rules for development:
    
    match /borrowers/{borrowerId} {
      // Borrowers can read their own data
      allow read: if request.auth != null && request.auth.uid == borrowerId;
      allow write: if false; // Only admins can create/update
    }
    
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow write: if false; // Only super admins
    }
    
    match /equipments/{equipmentId} {
      allow read: if true; // Anyone can read
      allow write: if false; // Only admins
    }
    
    match /requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false; // Only admins
    }
  }
}
```

**⚠️ Note:** For development/testing, you might use:
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

## ✅ Testing Borrower Account

1. Open your application: `index.html`
2. Login with:
   - Username: Student ID (e.g., `23-140133`)
   - Password: The password you set in Firebase
3. Should redirect to `borrower_dashboard.html`

---

## 📊 Collection Structure Summary

```
📁 Firestore Database
├── 📁 borrowers (Collection)
│   ├── 📄 23-140133 (Document)
│   │   ├── password: "student123"
│   │   ├── name: "John Doe"
│   │   ├── email: "john@example.com"
│   │   ├── course: "BS Computer Science"
│   │   ├── yearLevel: "3rd Year"
│   │   └── status: "active"
│   └── 📄 23-140134 (Document)
│       └── ...
│
├── 📁 admins (Collection)
│   ├── 📄 23-140133 (Document)
│   │   └── password: "admin1"
│   └── ...
│
├── 📁 equipments (Collection)
│   ├── 📄 [auto-id] (Document)
│   │   ├── name: "Laptop"
│   │   ├── category: "Electronics"
│   │   ├── status: "Available"
│   │   ├── condition: "Good"
│   │   ├── location: "Lab 1"
│   │   └── barcode: "EQ-123456"
│   └── ...
│
└── 📁 requests (Collection)
    ├── 📄 [auto-id] (Document)
    │   ├── borrowerId: "23-140133"
    │   ├── equipmentId: "..."
    │   ├── equipmentName: "Laptop"
    │   ├── purpose: "For project work"
    │   ├── returnDate: "2025-02-15"
    │   ├── status: "pending"
    │   └── timestamp: [timestamp]
    └── ...
```

---

## 🎯 Minimum Required Fields

**For Borrower to Login:**
- ✅ `password` (string) - MUST have this

**Optional but Recommended:**
- `name` - For display
- `email` - For contact
- `status` - To track active/inactive users

---

## 💡 Tips

1. **Student ID Format:** Use format `XX-XXXXXX` (e.g., `23-140133`)
2. **Password Security:** In production, use Firebase Authentication instead of plain text passwords
3. **Bulk Import:** Use Firebase Admin SDK or import JSON for multiple accounts
4. **Testing:** Create test accounts with simple passwords for development

---

## 🆘 Troubleshooting

**Problem:** Login fails with "No account found"
- ✅ Check collection name is exactly `borrowers` (lowercase)
- ✅ Check document ID matches the Student ID exactly
- ✅ Verify `password` field exists

**Problem:** Can't see equipment
- ✅ Check `equipments` collection exists
- ✅ Verify equipment has `status: "Available"`

**Problem:** Can't submit requests
- ✅ Check `requests` collection exists
- ✅ Verify Firestore Security Rules allow writes

---

## 📞 Need Help?

Check Firebase Console for:
- Collection/Document structure
- Field types and values
- Security Rules
- Data validation

