# Testing Guide for New Features

This guide will help you test all the new features we just implemented.

## 🧪 Testing Checklist

### ✅ Step 1: Test Equipment History (equipmentHistory index)

**What to Test:** Equipment borrowing history tracking

**Steps:**
1. **Login as Admin:**
   - Go to `index.html`
   - Login with admin credentials (e.g., `23-140133` / `admin1`)
   - You should see the admin dashboard

2. **Create a Test Request (if needed):**
   - If you don't have any requests, login as a borrower first
   - Submit a request for an equipment
   - Logout and login back as admin

3. **Approve a Request:**
   - Go to **Requests** section (sidebar)
   - Find a pending request
   - Click **Approve** button
   - Add an optional comment
   - Click **Confirm**
   - ✅ **Check:** Equipment status should change to "Borrowed"

4. **View Equipment History:**
   - Go to **Equipment** section
   - Find the equipment you just approved
   - Click the **History** button (blue button with clock icon)
   - ✅ **Check:** You should see the borrowing history with:
     - Borrower ID
     - Action (Borrowed)
     - Date
     - Expected return date

5. **Return Equipment:**
   - Go back to **Requests** section
   - Find the approved request
   - Click **Return** button
   - Select condition (Good/Damaged)
   - Add optional notes
   - Click **Mark as Returned**
   - ✅ **Check:** Equipment status should change to "Available"

6. **View Updated History:**
   - Go back to **Equipment** section
   - Click **History** on the same equipment
   - ✅ **Check:** You should now see TWO entries:
     - Borrowed entry (when approved)
     - Returned entry (when returned)
   - ✅ **Check:** Return entry should show condition and notes

**Expected Result:** ✅ Equipment history should load without errors, showing all borrow/return activities.

---

### ✅ Step 2: Test Notifications System (notifications index)

**What to Test:** Notification creation and display

**Steps:**
1. **Check Notification Badge:**
   - Look at the top-right corner of admin dashboard
   - You should see a bell icon 🔔
   - ✅ **Check:** If there are pending requests, you should see a red badge with count

2. **Click Notification Icon:**
   - Click the bell icon
   - ✅ **Check:** Notification dropdown should open
   - ✅ **Check:** You should see notifications (if any exist)

3. **Create a Notification (by approving a request):**
   - Login as Borrower first:
     - Go to `index.html`
     - Login with borrower credentials
     - Submit a request for equipment
     - Logout

   - Login as Admin:
     - Go to **Requests** section
     - Find the pending request
     - Click **Approve**
     - Click **Confirm**
     - ✅ **Check:** Notification should be created for borrower

4. **Check Borrower Notifications:**
   - Login as the borrower
   - ✅ **Check:** Borrower should see notification about request approval
   - (Note: Borrower dashboard doesn't have notifications UI yet, but notification is created in database)

5. **Test Reject Notification:**
   - As admin, reject a request
   - ✅ **Check:** Notification should be created for borrower

6. **Test Return Notification:**
   - Return an equipment
   - ✅ **Check:** Notification should be created for borrower

**Expected Result:** ✅ Notifications should be created and stored in database. Admin can see pending requests count in badge.

---

### ✅ Step 3: Test Request Management (requests index)

**What to Test:** Request filtering and viewing by borrower

**Steps:**
1. **View All Requests:**
   - As admin, go to **Requests** section
   - ✅ **Check:** All requests should load without errors
   - ✅ **Check:** Requests should be sorted by date (newest first)

2. **Filter Requests:**
   - Use the search box to search by borrower ID or equipment name
   - ✅ **Check:** Results should filter in real-time
   - Use status filter dropdown
   - ✅ **Check:** Should filter by status (Pending, Approved, Rejected, Returned)
   - Use date filters
   - ✅ **Check:** Should filter by date range

3. **View Request Details:**
   - Click **View** button on any request
   - ✅ **Check:** Modal should show:
     - Request information
     - Borrower information
     - Equipment information

4. **Test Batch Operations:**
   - Select multiple pending requests (checkboxes)
   - Click **Approve Selected** or **Reject Selected**
   - ✅ **Check:** All selected requests should be processed
   - ✅ **Check:** Equipment status should update for approved requests

5. **Test Borrower's Request View:**
   - Login as borrower
   - Go to **My Requests** section
   - ✅ **Check:** Should show only that borrower's requests
   - ✅ **Check:** Requests should be sorted by date (newest first)
   - ✅ **Check:** Should show request status badges

**Expected Result:** ✅ All request queries should work without index errors. Requests should filter and sort correctly.

---

### ✅ Step 4: Test Equipment Checkout/Return Workflow

**What to Test:** Complete borrowing workflow

**Steps:**
1. **Initial State:**   
   - Check equipment status in **Equipment** section
   - ✅ **Check:** Equipment should be "Available"

2. **Approve Request:**
   - Go to **Requests** section
   - Approve a request
   - ✅ **Check:** Equipment status should change to "Borrowed"
   - ✅ **Check:** Equipment should show current borrower ID (if implemented)

3. **Check Equipment History:**
   - View equipment history
   - ✅ **Check:** Should show "Borrowed" entry with borrower info

4. **Return Equipment:**
   - Go to **Requests** section
   - Find the approved request
   - Click **Return** button
   - Select condition (try "Good" first)
   - Click **Mark as Returned**
   - ✅ **Check:** Equipment status should change back to "Available"
   - ✅ **Check:** Request status should change to "Returned"

5. **Check Updated History:**
   - View equipment history again
   - ✅ **Check:** Should show both "Borrowed" and "Returned" entries

6. **Test Damaged Return:**
   - Approve another request
   - Return equipment with condition "Damaged"
   - ✅ **Check:** Equipment condition should change to "Damaged"
   - ✅ **Check:** Equipment status should be "Available" but condition "Damaged"

**Expected Result:** ✅ Complete workflow should work: Approve → Equipment Borrowed → Return → Equipment Available.

---

### ✅ Step 5: Test Manage Borrowers Section

**What to Test:** Borrower management features

**Steps:**
1. **View All Borrowers:**
   - As admin, go to **Manage Borrowers** section
   - ✅ **Check:** Should show list of all borrowers
   - ✅ **Check:** Should show borrower information (ID, Name, Email, Course, etc.)

2. **Search Borrowers:**
   - Use search box to search by ID, name, email, or course
   - ✅ **Check:** Results should filter in real-time

3. **View Borrower Details:**
   - Click **View** button on any borrower
   - ✅ **Check:** Modal should show:
     - Profile information
     - Borrowing history (all their requests)

4. **Edit Borrower:**
   - Click **Edit** button on any borrower
   - Update name, email, course, or year level
   - Click **Save Changes**
   - ✅ **Check:** Changes should be saved
   - ✅ **Check:** Updated information should appear in borrower list

**Expected Result:** ✅ Borrower management should work: View, Search, Edit borrower information.

---

### ✅ Step 6: Test Enhanced Search & Filtering

**What to Test:** Equipment search and filtering improvements

**Steps:**
1. **Enhanced Search:**
   - Go to **Equipment** section
   - Type in search box (try searching by name, category, or location)
   - ✅ **Check:** Should search across name, category, and location
   - ✅ **Check:** Results should update in real-time

2. **Sort Equipment:**
   - Use "Sort By" dropdown
   - Try different sort options (Name A-Z, Name Z-A, Category, Status, Location)
   - ✅ **Check:** Equipment should sort correctly

3. **Quick Filters:**
   - Click "Available Only" button
   - ✅ **Check:** Should show only available equipment
   - Click "Borrowed Only" button
   - ✅ **Check:** Should show only borrowed equipment
   - Click "Damaged Only" button
   - ✅ **Check:** Should show only damaged equipment
   - Click "Under Repair" button
   - ✅ **Check:** Should show only equipment under repair

4. **Combined Filters:**
   - Use search + status filter + sort together
   - ✅ **Check:** All filters should work together
   - Click "Clear Filters" button
   - ✅ **Check:** All filters should reset

**Expected Result:** ✅ Enhanced search and filtering should work smoothly with sorting and quick filters.

---

## 🐛 Troubleshooting

### Issue: "The query requires an index" error

**Solution:**
- Check Firebase Console → Firestore Database → Indexes
- Make sure all 3 indexes show status as "Enabled" (not "Building")
- If still building, wait a few minutes and try again

### Issue: Collections not found

**Solution:**
- Collections are auto-created on first use
- Try approving a request first
- Check Firebase Console → Firestore Database to see if collections exist

### Issue: Notifications not showing

**Solution:**
- Check browser console for errors
- Make sure notifications collection exists in Firebase
- Try creating a notification by approving a request

### Issue: Equipment history empty

**Solution:**
- Make sure you've approved at least one request
- Check Firebase Console → Firestore Database → equipmentHistory collection
- Verify entries exist in the collection

---

## ✅ Success Criteria

All tests pass if:

1. ✅ Equipment history loads without errors
2. ✅ Notifications are created when requests are approved/rejected
3. ✅ Request filtering works (by borrower, status, date)
4. ✅ Equipment checkout/return workflow works completely
5. ✅ Borrower management works (view, search, edit)
6. ✅ Enhanced search and filtering work with sorting
7. ✅ No console errors related to indexes
8. ✅ All data persists correctly in Firebase

---

## 📝 Quick Test Script

**5-Minute Quick Test:**
1. Login as Admin
2. Go to Requests → Approve a request
3. Go to Equipment → Click History on that equipment
4. Go to Requests → Return the equipment
5. Go to Equipment → Click History again
6. ✅ Should see 2 history entries (Borrowed + Returned)

**If this works, all indexes are set up correctly!** ✅

---

## 🎯 Next Steps

Once all tests pass:
1. ✅ System is fully functional
2. ✅ All indexes are working
3. ✅ All features are operational
4. Ready for production use!

