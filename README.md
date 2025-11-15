# CCIS E-Bulod - Equipment Borrowing Management System

A web-based equipment borrowing management system for the College of Computing and Information Sciences (CCIS). This system allows borrowers to request equipment and admins to manage equipment, requests, and track borrowing history.

## 🚀 Features

### Admin Features
- **Equipment Management**: Add, edit, delete, and track equipment
- **Request Management**: Approve, reject, and track equipment requests
- **Dashboard Analytics**: View statistics and equipment status
- **Barcode Generation**: Generate barcodes for equipment tracking
- **Image Upload**: Upload equipment images using Cloudinary
- **Export Data**: Export equipment and request data
- **Activity Logging**: Track all admin actions
- **Notifications**: Real-time notifications for new requests
- **Bulk Operations**: Approve/reject multiple requests at once

### Borrower Features
- **Browse Equipment**: View available equipment with images
- **Request Equipment**: Submit borrowing requests with dates and times
- **Track Requests**: View request status and history
- **Analytics**: Personal borrowing statistics and insights
- **Equipment Feedback**: Leave feedback/comments on equipment after return
- **Notifications**: Real-time status updates with notification dropdown
- **Request History**: View all past borrowing requests

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
- `borrowers` - Borrower user accounts
- `equipments` - Equipment inventory
- `requests` - Equipment borrowing requests
- `equipment_history` - Equipment usage history
- `notifications` - User notifications
- `activity_logs` - System activity logs

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
│   ├── config.js          # Configuration and database helpers
│   ├── auth.js            # Authentication endpoints
│   ├── equipment.js       # Equipment management
│   ├── requests.js        # Request management
│   ├── dashboard.js       # Dashboard statistics
│   ├── borrowers.js       # Borrower management
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

### Performance Optimizations
- **API Caching**: Reduces Edge Requests by 70-80%
- **Smart Polling**: Notifications poll every 60 seconds (borrower) / 2 minutes (admin)
- **Efficient Data Loading**: Cached responses for frequently accessed data

### Security
- Stateless authentication using `X-User-Id` header
- Input sanitization on all API endpoints
- CORS protection
- Row Level Security (RLS) can be enabled in Supabase for production

## 🐛 Troubleshooting

### Common Issues

1. **"Table not found" errors**: Make sure you've run the SQL schema in Supabase
2. **CORS errors**: Check that `ALLOWED_ORIGIN` is set correctly in Vercel
3. **Authentication fails**: Verify Supabase credentials are correct in environment variables
4. **Image upload fails**: Check Cloudinary credentials in `js/cloudinary.js`
5. **High Edge Requests**: The system uses caching to minimize API calls. Check polling intervals if needed.

### Vercel Deployment Issues

- **Build fails**: Ensure Node.js version is set to 22.x in `package.json`
- **Function errors**: Check Vercel function logs in the dashboard
- **Environment variables**: Verify all required variables are set in Vercel project settings

## 📊 Database Schema

The system uses the following Supabase tables:

- **admins**: `id` (TEXT PRIMARY KEY), `password` (TEXT)
- **borrowers**: `id` (TEXT PRIMARY KEY), `password`, `name`, `email`, `course`, `year_level`, `status`
- **equipments**: `id` (TEXT PRIMARY KEY), `name`, `category`, `status`, `condition`, `location`, `barcode`, `image_url`
- **requests**: `id` (TEXT PRIMARY KEY), `borrower_id`, `equipment_id`, `status`, `purpose`, `review` (JSONB), etc.
- **equipment_history**: `id`, `equipment_id`, `borrower_id`, `action`, `timestamp`
- **notifications**: `id`, `user_id`, `type`, `data` (JSONB), `read`, `timestamp`
- **activity_logs**: `id`, `action`, `user_id`, `user_role`, `details` (JSONB), `timestamp`

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
