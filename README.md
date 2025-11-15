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

### Borrower Features
- **Browse Equipment**: View available equipment with images
- **Request Equipment**: Submit borrowing requests with dates
- **Track Requests**: View request status and history
- **Analytics**: Personal borrowing statistics and insights
- **Equipment Reviews**: Rate and review equipment after return
- **Notifications**: Real-time status updates

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
- **Backend**: PHP 7.4+
- **Database**: Firebase Firestore
- **Image Storage**: Cloudinary
- **Hosting**: Compatible with InfinityFree and other PHP hosting

## 📋 Prerequisites

- PHP 7.4 or higher
- Web server (Apache/Nginx) or PHP built-in server
- Firebase account with Firestore enabled
- Cloudinary account (for image storage)
- Modern web browser

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/EBulod.git
cd EBulod
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Get your Firebase Project ID and API Key
4. Copy `api/config.example.php` to `api/config.php`
5. Update `api/config.php` with your Firebase credentials:

```php
define('FIREBASE_PROJECT_ID', 'your-project-id');
define('FIREBASE_API_KEY', 'your-api-key');
```

### 3. Configure Cloudinary

1. Create a Cloudinary account at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret
3. Create an upload preset in Cloudinary Dashboard
4. Copy `js/cloudinary.example.js` to `js/cloudinary.js`
5. Update `js/cloudinary.js` with your Cloudinary credentials:

```javascript
const cloudinaryConfig = {
  cloudName: 'your-cloud-name',
  apiKey: 'your-api-key',
  uploadPreset: 'your-upload-preset'
};
```

6. Copy `delete_cloudinary_image.example.php` to `delete_cloudinary_image.php`
7. Update `delete_cloudinary_image.php` with your Cloudinary credentials

### 4. Set Up Firestore Collections

Create the following collections in Firestore:
- `admins` - Admin user accounts
- `borrowers` - Borrower user accounts
- `equipments` - Equipment inventory
- `requests` - Equipment borrowing requests
- `equipmentHistory` - Equipment usage history
- `notifications` - User notifications
- `activity_logs` - System activity logs

See `docs/FIREBASE_SETUP.md` for detailed setup instructions.

### 5. Configure CORS

Update the `$allowedOrigins` array in `api/config.php` with your domain:

```php
$allowedOrigins = [
    'http://localhost',
    'https://yourdomain.com'
];
```

## 📁 Project Structure

```
EBulod/
├── api/                    # PHP backend API
│   ├── config.php         # Configuration (create from config.example.php)
│   ├── auth.php           # Authentication endpoints
│   ├── equipment.php      # Equipment management
│   ├── requests.php       # Request management
│   └── ...
├── js/                    # JavaScript files
│   ├── api.js            # API communication
│   ├── auth_unified.js   # Authentication logic
│   └── cloudinary.js     # Cloudinary integration (create from example)
├── images/               # Static images
├── docs/                 # Documentation
├── index.html           # Login page
├── admin_dboard.html    # Admin dashboard
├── borrower_dashboard.html # Borrower dashboard
└── create_account.html  # Account creation
```

## 🔐 Security Notes

⚠️ **IMPORTANT**: Never commit sensitive files to version control:
- `api/config.php` (contains Firebase API keys)
- `delete_cloudinary_image.php` (contains Cloudinary API secret)
- `js/cloudinary.js` (contains Cloudinary credentials)

These files are already in `.gitignore`. Always use the `.example` files as templates.

## 🚀 Usage

### Local Development

1. Start a PHP development server:
```bash
php -S localhost:8000
```

2. Open your browser and navigate to:
```
http://localhost:8000
```

### Production Deployment

1. Upload all files to your web server
2. Ensure PHP 7.4+ is installed
3. Configure `api/config.php` with production credentials
4. Update CORS settings in `api/config.php`
5. Set proper file permissions (644 for files, 755 for directories)

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **PROJECT_ARCHITECTURE.md** - System architecture overview
- **FIREBASE_SETUP.md** - Firebase setup guide
- **CLOUDINARY_SETUP.md** - Cloudinary setup guide
- **TESTING_GUIDE.md** - Testing procedures
- **FREE_HOSTING_ISSUES.md** - Troubleshooting for free hosting

## 🐛 Troubleshooting

### Common Issues

1. **403 Forbidden on InfinityFree**: Free hosting may block PUT/DELETE methods. The code uses POST with action parameters as a workaround.

2. **CORS Errors**: Ensure your domain is in the `$allowedOrigins` array in `api/config.php`.

3. **Firebase Connection Issues**: Verify your API key and project ID are correct.

4. **Image Upload Fails**: Check Cloudinary credentials and upload preset configuration.

See `docs/FREE_HOSTING_ISSUES.md` for more troubleshooting tips.

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
- Firebase for database services
- Cloudinary for image storage
- InfinityFree for hosting compatibility considerations

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This project was designed to work with free hosting services like InfinityFree, which may have limitations on HTTP methods and execution time.


