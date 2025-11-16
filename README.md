# CCIS E-Bulod - Equipment Borrowing Management System

A web-based equipment borrowing management system for the College of Computing and Information Sciences (CCIS). This system allows borrowers to request equipment and admins to manage equipment, requests, and track borrowing history.

## 🚀 Features

### Admin Features
- **Equipment Management**: Add, edit, delete, and track equipment
- **Request Management**: Approve, reject, and track equipment requests
- **Return Equipment**: Mark equipment as returned with condition status (Good/Damaged)
- **Dashboard Analytics**: View statistics and equipment status
- **Barcode Generation**: Generate barcodes for equipment tracking
- **Image Upload**: Upload equipment images using Cloudinary
- **Export Data**: Export equipment and request data
- **Activity Logging**: Track all admin actions
- **Notifications**: Real-time notifications for new requests
- **Bulk Operations**: Approve/reject multiple requests at once
- **Trust Points Management**: View and monitor borrower trust points in "Manage Borrowers" section

### Borrower Features
- **Browse Equipment**: View available equipment with images
- **Request Equipment**: Submit borrowing requests with dates and times (past dates blocked)
- **Track Requests**: View request status and history
- **Analytics**: Personal borrowing statistics and insights
- **Equipment Feedback**: Leave feedback/comments on equipment after return
- **Notifications**: Real-time status updates with notification dropdown
- **Request History**: View all past borrowing requests
- **Trust Points Display**: View your current trust points on dashboard

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
- **Backend**: Node.js (Serverless Functions)
- **Database**: Supabase (PostgreSQL)
- **Image Storage**: Cloudinary
- **Hosting**: Vercel
- **Runtime**: Node.js 22.x

## 📋 Prerequisites

- Node.js 22.x or higher
- Supabase account
- Cloudinary account (for image storage)
- Vercel account (for deployment)
- Modern web browser

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/majingamo/ebulodccis.git
cd ebulodccis
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a Supabase project at [Supabase](https://supabase.com/)
2. Run the SQL schema to create tables (see `ADD_BORROWERS.sql` for reference)
3. Get your Supabase URL and Anon Key from Project Settings → API
4. Disable Row Level Security (RLS) for all tables (for development)

**Required Tables:**
- `admins` - Admin user accounts
- `borrowers` - Borrower user accounts (includes `trust_points` column)
- `equipments` - Equipment inventory
- `requests` - Equipment borrowing requests
- `equipment_history` - Equipment usage history (includes `trust_points_change` column)
- `notifications` - User notifications
- `activity_logs` - System activity logs

**SQL Migrations:**
- Run `ADD_TRUST_POINTS.sql` to add the `trust_points` column to the `borrowers` table
- Run `ADD_TRUST_POINTS_HISTORY.sql` to add the `trust_points_change` column to the `equipment_history` table

### 4. Configure Cloudinary

1. Create a Cloudinary account at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and create an upload preset
3. Update `js/cloudinary.js` with your credentials:

```javascript
const cloudinaryConfig = {
  cloudName: 'your-cloud-name',
  apiKey: 'your-api-key',
  uploadPreset: 'your-upload-preset'
};
```

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `ALLOWED_ORIGIN` - Your Vercel deployment URL (optional)
4. Deploy!

## 📁 Project Structure

```
EBulod/
├── api/                    # Node.js serverless functions
│   ├── config.js          # Configuration, database helpers, and trust points functions
│   ├── auth.js            # Authentication endpoints
│   ├── equipment.js       # Equipment management
│   ├── requests.js        # Request management (includes trust points logic)
│   ├── dashboard.js       # Dashboard statistics
│   ├── borrowers.js       # Borrower management (includes trust points initialization)
│   ├── notifications.js   # Notification handling
│   ├── history.js         # Equipment history
│   ├── export.js          # Data export
│   └── bulk_operations.js # Bulk operations
├── js/                    # JavaScript files
│   ├── api.js            # API communication client
│   ├── auth_unified.js   # Unified authentication
│   ├── auth_admin.js     # Admin authentication
│   ├── auth_borrower.js  # Borrower authentication
│   ├── cloudinary.js     # Cloudinary integration
│   └── form-validation.js # Form validation
├── images/               # Static images
│   ├── logo.png
│   ├── admin.png
│   └── borrower.png
├── index.html           # Login page
├── admin_dboard.html    # Admin dashboard
├── borrower_dashboard.html # Borrower dashboard
├── contact_us.html      # Contact page
├── create_account.html  # Account creation (admin only)
├── package.json         # Node.js dependencies
├── vercel.json          # Vercel configuration
├── ADD_TRUST_POINTS.sql   # SQL migration to add trust_points column
├── ADD_TRUST_POINTS_HISTORY.sql # SQL migration to add trust_points_change column
└── README.md           # This file
```

## 🔐 Environment Variables

Set these in your Vercel project settings:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `ALLOWED_ORIGIN` - Allowed CORS origin (optional, defaults to `*`)

## 🚀 Usage

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env.local`):
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Run Vercel CLI:
```bash
npx vercel dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Production Deployment

The project is configured for automatic deployment on Vercel:

1. Push changes to GitHub
2. Vercel automatically detects and deploys
3. Environment variables are managed in Vercel dashboard

## 🔑 Default Accounts

After setting up Supabase, create admin and borrower accounts:

**Admin Account:**
```sql
INSERT INTO admins (id, password) 
VALUES ('11-111111', 'admin1');
```

**Borrower Accounts:**
See `ADD_BORROWERS.sql` for example SQL to add borrower accounts.

## 🎯 Key Features

### Trust Points System
The system includes a comprehensive trust points system to encourage responsible equipment borrowing:

- **Starting Points**: All new borrowers start with 20 trust points
- **Point Deductions**:
  - **Late Returns**: -3 points if equipment is returned 30+ minutes after scheduled time
  - **Damaged Equipment**: -5 points if equipment is returned in damaged condition
  - **Combined Penalties**: If equipment is both late and damaged, both deductions apply (-8 total)
- **Point Gains**:
  - **Good Condition**: +1 point when equipment is returned in good condition
  - **Feedback Submission**: +1 point when borrower submits feedback after return
- **Restrictions**:
  - Minimum trust points is 0 (cannot go negative)
  - Borrowers with 0 trust points cannot create new requests
  - Message displayed: "Please visit the Dean's office for an appeal"
- **Visibility**:
  - Borrowers can see their own trust points on their dashboard
  - Admins can view all borrowers' trust points in "Manage Borrowers" section
  - Color-coded display (red for 0, orange for <10, purple for ≥10)
- **Automatic Tracking**: All trust point changes are automatically logged in `activity_logs` and `equipment_history` tables

### Performance Optimizations
- **API Caching**: Reduces Edge Requests by 70-80%
- **Smart Polling**: Notifications poll every 60 seconds (borrower) / 2 minutes (admin)
- **Efficient Data Loading**: Cached responses for frequently accessed data
- **Cache Invalidation**: Smart cache clearing when data changes (e.g., trust points updates)

### Security
- Stateless authentication using `X-User-Id` header
- Input sanitization on all API endpoints
- CORS protection
- Date validation (prevents selecting past dates for requests)
- Trust points validation (blocks borrowing at 0 points)
- Row Level Security (RLS) can be enabled in Supabase for production

## 🐛 Troubleshooting

### Common Issues

1. **"Table not found" errors**: Make sure you've run the SQL schema in Supabase
2. **"Column not found" errors**: Run the SQL migration files (`ADD_TRUST_POINTS.sql` and `ADD_TRUST_POINTS_HISTORY.sql`) in Supabase
3. **CORS errors**: Check that `ALLOWED_ORIGIN` is set correctly in Vercel
4. **Authentication fails**: Verify Supabase credentials are correct in environment variables
5. **Image upload fails**: Check Cloudinary credentials in `js/cloudinary.js`
6. **High Edge Requests**: The system uses caching to minimize API calls. Check polling intervals if needed.
7. **Trust points not updating**: Ensure the SQL migrations have been run and the columns exist in the database
8. **Past dates selectable**: The date picker should automatically restrict past dates. Clear browser cache if issues persist.

### Vercel Deployment Issues

- **Build fails**: Ensure Node.js version is set to 22.x in `package.json`
- **Function errors**: Check Vercel function logs in the dashboard
- **Environment variables**: Verify all required variables are set in Vercel project settings

## 📊 Database Schema

The system uses the following Supabase tables:

- **admins**: `id` (TEXT PRIMARY KEY), `password` (TEXT)
- **borrowers**: `id` (TEXT PRIMARY KEY), `password`, `name`, `email`, `course`, `year_level`, `status`, `trust_points` (INTEGER, DEFAULT 20, CHECK >= 0)
- **equipments**: `id` (TEXT PRIMARY KEY), `name`, `category`, `status`, `condition`, `location`, `barcode`, `image_url`
- **requests**: `id` (TEXT PRIMARY KEY), `borrower_id`, `equipment_id`, `status`, `purpose`, `request_date`, `return_date`, `start_time`, `end_time`, `review` (JSONB), `returned_at`, `return_condition`, etc.
- **equipment_history**: `id`, `equipment_id`, `borrower_id`, `request_id`, `action`, `condition`, `notes`, `timestamp`, `trust_points_change` (INTEGER)
- **notifications**: `id`, `user_id`, `type`, `data` (JSONB), `read`, `timestamp`
- **activity_logs**: `id`, `action`, `user_id`, `user_role`, `details` (JSONB), `timestamp`

### Trust Points Schema Details

- **borrowers.trust_points**: Stores current trust points for each borrower
  - Type: INTEGER
  - Default: 20
  - Constraint: Must be >= 0
  - Automatically updated when equipment is returned or feedback is submitted

- **equipment_history.trust_points_change**: Tracks trust point changes per return
  - Type: INTEGER
  - Can be positive (gains) or negative (deductions)
  - NULL if no change occurred

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- CCIS Development Team

## 🙏 Acknowledgments

- Bootstrap for UI components
- Supabase for database services
- Cloudinary for image storage
- Vercel for hosting and serverless functions

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Live Demo**: [View on Vercel](https://ebulodccis-test2.vercel.app)

**Repository**: [GitHub](https://github.com/majingamo/ebulodccis)
