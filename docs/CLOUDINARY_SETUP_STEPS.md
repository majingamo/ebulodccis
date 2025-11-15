# Cloudinary Setup - Step-by-Step Guide
## (For Images Only - Keeping Firestore for Data)

---

## 📋 Step-by-Step Process

### **STEP 1: Create Cloudinary Account**

1. Go to **https://cloudinary.com/**
2. Click **"Sign Up for Free"** (top right)
3. Fill in:
   - Email address
   - Password
   - Full name
4. Click **"Create Account"**
5. Check your email and verify your account
6. You'll be redirected to your **Dashboard**

---

### **STEP 2: Get Your Cloudinary Credentials**

Once logged in, you'll see your **Dashboard**. Look for:

1. **Cloud Name** 
   - Example: `dabc123xyz`
   - Found in: Dashboard → Account Details

2. **API Key**
   - Example: `123456789012345`
   - Found in: Dashboard → Account Details

3. **API Secret**
   - Example: `abcdefghijklmnopqrstuvwxyz123456`
   - Found in: Dashboard → Account Details
   - ⚠️ **Keep this secret!** Don't share it publicly.

**📝 Write these down - you'll need them!**

---

### **STEP 3: Create Upload Preset**

This allows your app to upload images directly from the browser.

1. In Cloudinary Dashboard, click **"Settings"** (gear icon, top right)
2. Go to **"Upload"** tab (left sidebar)
3. Scroll down to **"Upload presets"** section
4. Click **"Add upload preset"** button
5. Configure the preset:
   - **Preset name**: `equipment_upload` (or any name you like)
   - **Signing mode**: Select **"Unsigned"** (important for client-side uploads)
   - **Folder**: `equipment` (optional - organizes images in a folder)
   - **Allowed formats**: Check `jpg`, `png`, `webp` (or leave default)
   - **Max file size**: `10` MB (or your preference)
6. Click **"Save"** button
7. **📝 Write down the Preset name** - you'll need it!

---

### **STEP 4: Test Your Setup (Optional)**

You can test if everything works:

1. In Cloudinary Dashboard, go to **"Media Library"** (left sidebar)
2. Click **"Upload"** button
3. Upload a test image
4. If it works, you're ready! ✅

---

### **STEP 5: Share Your Credentials with Me**

Once you have everything, share these 3 pieces of information:

1. **Cloud Name**: `your-cloud-name`
2. **API Key**: `your-api-key`
3. **Upload Preset Name**: `equipment_upload` (or whatever you named it)

**⚠️ DO NOT share your API Secret!** We won't need it for client-side uploads.

---

### **STEP 6: I'll Integrate It Into Your Code**

Once you share your credentials, I will:

1. ✅ Create `js/cloudinary.js` configuration file
2. ✅ Update `admin_dashboard.html` to use Cloudinary instead of Firebase Storage
3. ✅ Replace image upload function
4. ✅ Replace image delete function
5. ✅ Test everything works

**Your Firestore database stays the same** - we're only replacing image storage!

---

## 🎯 What You'll Need to Provide

When ready, share these 3 values:

```
Cloud Name: [your-cloud-name]
API Key: [your-api-key]
Upload Preset: [your-preset-name]
```

---

## ✅ Quick Checklist

- [ ] Created Cloudinary account
- [ ] Got Cloud Name
- [ ] Got API Key
- [ ] Created Upload Preset (unsigned)
- [ ] Wrote down all 3 values
- [ ] Ready to share credentials

---

## 🔒 Security Note

- ✅ **Safe to share**: Cloud Name, API Key, Upload Preset name
- ❌ **Never share**: API Secret (we won't need it for this setup)

---

## 💡 What Happens Next?

After you share your credentials:

1. I'll update your code to use Cloudinary
2. Images will upload to Cloudinary instead of Firebase Storage
3. Image URLs will still be stored in Firestore (same as before)
4. Everything else stays the same - no other changes needed!

---

**Ready?** Complete Steps 1-3, then share your credentials! 🚀

