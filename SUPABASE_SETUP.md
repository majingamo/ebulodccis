# Supabase Setup Guide for E-Bulod

This guide will help you set up Supabase and migrate from Firebase.

## Step 1: Create Supabase Account

1. Go to: https://supabase.com/
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Create a new organization (if needed)
5. Click "New Project"

## Step 2: Create Supabase Project

1. **Project Name**: `ebulod` (or your preferred name)
2. **Database Password**: Create a strong password (save it!)
3. **Region**: Choose closest to you
4. **Pricing Plan**: Free tier is fine
5. Click "Create new project"
6. Wait 2-3 minutes for project to be created

## Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 4: Create Database Tables

Go to **SQL Editor** in Supabase dashboard and run this SQL:

```sql
-- Create admins table
CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create borrowers table
CREATE TABLE borrowers (
  id TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT,
  email TEXT,
  course TEXT,
  year_level TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipments table
CREATE TABLE equipments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available',
  condition TEXT NOT NULL DEFAULT 'Good',
  location TEXT NOT NULL,
  barcode TEXT,
  image_url TEXT,
  current_borrower_id TEXT,
  borrowed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  borrower_id TEXT NOT NULL,
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  request_date TEXT,
  return_date TEXT,
  start_time TEXT,
  end_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by TEXT,
  returned_at TIMESTAMP WITH TIME ZONE,
  returned_by TEXT,
  return_condition TEXT,
  return_notes TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by TEXT,
  cancellation_comment TEXT,
  admin_comment TEXT,
  reviewed BOOLEAN DEFAULT FALSE,
  review JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment_history table
CREATE TABLE equipment_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  borrower_id TEXT NOT NULL,
  request_id TEXT,
  action TEXT NOT NULL,
  condition TEXT,
  notes TEXT,
  expected_return_date TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  action TEXT NOT NULL,
  user_id TEXT,
  user_role TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_requests_borrower_id ON requests(borrower_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_equipment_id ON requests(equipment_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_equipment_history_equipment_id ON equipment_history(equipment_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
```

## Step 5: Enable Row Level Security (RLS)

For now, we'll disable RLS for simplicity. In production, you should enable it.

Go to **Authentication** → **Policies** and make sure RLS is disabled for all tables, OR run:

```sql
-- Disable RLS for all tables (for development)
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
```

## Step 6: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: Your Project URL (from Step 3)
   - Environments: Production, Preview, Development (select all)

   **Variable 2:**
   - Name: `SUPABASE_ANON_KEY`
   - Value: Your anon/public key (from Step 3)
   - Environments: Production, Preview, Development (select all)

   **Variable 3:**
   - Name: `ALLOWED_ORIGIN`
   - Value: Your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Environments: Production, Preview, Development (select all)

4. **Remove old Firebase variables:**
   - Delete `FIREBASE_PROJECT_ID`
   - Delete `FIREBASE_API_KEY`

5. Click **Save**

6. Go to **Deployments** tab
7. Click the three dots (⋮) on the latest deployment
8. Click **Redeploy**

## Step 7: Migrate Data from Firebase (Optional)

If you have existing data in Firebase, you'll need to export it and import to Supabase:

1. Export data from Firebase (manually or using Firebase console)
2. Import to Supabase using the SQL Editor or Supabase dashboard

## Step 8: Test Your Application

1. Visit your Vercel URL
2. Test login (you'll need to create admin/borrower accounts first)
3. Check browser console (F12) for errors
4. Test all features

## Step 9: Create Initial Admin Account

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO admins (id, password) 
VALUES ('11-111111', 'admin123');
```

Replace:
- `11-111111` with your admin ID
- `admin123` with your desired password

## Step 10: Create Test Borrower Account

```sql
INSERT INTO borrowers (id, password, name, email, course, year_level) 
VALUES ('23-140133', 'student123', 'Test Student', 'test@example.com', 'BS Computer Science', '3rd Year');
```

Replace with your actual data.

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran all the CREATE TABLE statements
- Check that you're in the correct database

### Error: "permission denied"
- Check RLS settings
- Make sure anon key has proper permissions

### API calls failing
- Verify environment variables are set correctly
- Check Vercel function logs
- Verify Supabase URL and key are correct

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Create database tables
3. ✅ Add environment variables to Vercel
4. ✅ Redeploy Vercel
5. ✅ Create admin account
6. ✅ Test application

Your app is now using Supabase instead of Firebase! 🎉

