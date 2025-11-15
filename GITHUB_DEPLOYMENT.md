# GitHub Deployment Guide

This guide will help you deploy your E-Bulod project to GitHub.

## Prerequisites

You need Git installed on your computer. Choose one of these options:

### Option 1: Install Git (Recommended)
1. Download Git from: https://git-scm.com/download/win
2. Install it with default settings
3. Restart your terminal/command prompt

### Option 2: Use GitHub Desktop (Easier)
1. Download GitHub Desktop from: https://desktop.github.com/
2. Install and sign in with your GitHub account

## Step-by-Step Deployment

### Method 1: Using Command Line (Git)

#### Step 1: Install Git (if not already installed)
- Download from: https://git-scm.com/download/win
- Run the installer with default settings

#### Step 2: Open Terminal/Command Prompt
- Press `Win + R`, type `cmd`, and press Enter
- Or open PowerShell
- Navigate to your project folder:
```bash
cd C:\xampp\htdocs\EBulod
```

#### Step 3: Initialize Git Repository
```bash
git init
```

#### Step 4: Add All Files
```bash
git add .
```

#### Step 5: Create Initial Commit
```bash
git commit -m "Initial commit: E-Bulod Equipment Borrowing System"
```

#### Step 6: Create GitHub Repository
1. Go to https://github.com
2. Click the "+" icon in the top right
3. Select "New repository"
4. Name it: `EBulod` (or any name you prefer)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

#### Step 7: Connect Local Repository to GitHub
Replace `YOUR_USERNAME` with your GitHub username:
```bash
git remote add origin https://github.com/YOUR_USERNAME/EBulod.git
```

#### Step 8: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

You'll be prompted for your GitHub username and password (use a Personal Access Token, not your password).

### Method 2: Using GitHub Desktop (Easier)

#### Step 1: Install GitHub Desktop
- Download from: https://desktop.github.com/
- Install and sign in

#### Step 2: Add Repository
1. Open GitHub Desktop
2. Click "File" → "Add Local Repository"
3. Click "Choose..." and select: `C:\xampp\htdocs\EBulod`
4. Click "Add Repository"

#### Step 3: Create Initial Commit
1. You'll see all your files listed as changes
2. In the bottom left, type a commit message: "Initial commit: E-Bulod Equipment Borrowing System"
3. Click "Commit to main"

#### Step 4: Publish to GitHub
1. Click "Publish repository" button (top right)
2. Name it: `EBulod`
3. **UNCHECK** "Keep this code private" if you want it public
4. Click "Publish Repository"

## Important: Personal Access Token (for Command Line)

If using command line, GitHub requires a Personal Access Token instead of password:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: "E-Bulod Deployment"
4. Select scopes: Check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)
7. Use this token as your password when pushing

## Verify Deployment

1. Go to your GitHub profile: `https://github.com/YOUR_USERNAME`
2. You should see your `EBulod` repository
3. Click on it to verify all files are there

## What's Protected

The following sensitive files are automatically excluded from GitHub (via `.gitignore`):
- ✅ `api/config.php` (contains Firebase API keys)
- ✅ `delete_cloudinary_image.php` (contains Cloudinary API secret)
- ✅ `js/cloudinary.js` (contains Cloudinary credentials)

**Important**: These files will NOT be uploaded to GitHub. Anyone cloning your repository will need to:
1. Copy the `.example` files
2. Rename them (remove `.example`)
3. Add their own credentials

## Future Updates

After making changes to your code:

### Using Command Line:
```bash
git add .
git commit -m "Description of your changes"
git push
```

### Using GitHub Desktop:
1. Make your changes
2. Open GitHub Desktop
3. Review changes in the left panel
4. Write a commit message
5. Click "Commit to main"
6. Click "Push origin" (top right)

## Troubleshooting

### "Git is not recognized"
- Install Git from: https://git-scm.com/download/win
- Restart your terminal after installation

### "Authentication failed"
- Use a Personal Access Token instead of password
- See "Personal Access Token" section above

### "Repository already exists"
- You may have already created the repository
- Just connect to it: `git remote add origin https://github.com/YOUR_USERNAME/EBulod.git`

### Files not showing on GitHub
- Check `.gitignore` - sensitive files are intentionally excluded
- Make sure you committed and pushed: `git add .` then `git commit` then `git push`

## Next Steps

After deploying to GitHub:
1. ✅ Your code is now backed up on GitHub
2. ✅ Others can clone and contribute
3. ✅ You can access it from anywhere
4. ✅ Consider adding a LICENSE file
5. ✅ Consider enabling GitHub Pages if you want to host the site

---

**Need Help?** Open an issue on GitHub or check the documentation in the `docs/` folder.


