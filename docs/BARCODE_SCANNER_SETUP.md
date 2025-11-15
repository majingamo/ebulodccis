# Barcode Scanner Setup Guide

## Overview
The borrower dashboard now supports barcode scanning to quickly request equipment. When a borrower scans a barcode, the system automatically looks up the equipment and opens the request form if the equipment is available.

## How It Works

1. **Barcode Format**: Equipment barcodes are stored in the format `EQ-XXXXXX` (e.g., `EQ-123456`)
2. **Scanner Input**: Barcode scanners typically send the barcode value followed by an Enter key (or Tab)
3. **Auto-Detection**: The system automatically detects when a barcode is scanned and looks up the equipment
4. **Request Modal**: If the equipment is found and available, the request modal opens automatically

## Setup Steps

### Step 1: Ensure Equipment Has Barcodes
1. Go to the **Admin Dashboard**
2. Navigate to **Equipment Management**
3. For each equipment item:
   - Click **Edit** on an equipment
   - Click **Generate Barcode** button
   - Save the equipment
   - The barcode will be displayed in the format `EQ-XXXXXX`

### Step 2: Connect Your Barcode Scanner
1. **USB Barcode Scanner**:
   - Plug the scanner into a USB port
   - Most USB scanners work as a keyboard (HID mode)
   - They will automatically be recognized by the computer

2. **Bluetooth Barcode Scanner**:
   - Pair the scanner with your computer/device
   - Make sure it's in HID (Human Interface Device) mode
   - The scanner should act like a keyboard when scanning

3. **Wireless Barcode Scanner**:
   - Follow the manufacturer's instructions to connect
   - Ensure it's in keyboard emulation mode

### Step 3: Test the Barcode Scanner
1. Open the **Borrower Dashboard**
2. Navigate to **Browse Equipment** section
3. You should see a purple gradient box at the top with "Scan Barcode to Request Equipment"
4. The barcode input field should be automatically focused (ready to scan)
5. Point your barcode scanner at a barcode and scan it

## How to Use

### Method 1: Automatic Scanning (Recommended)
1. Go to **Browse Equipment** section
2. The barcode input field is automatically focused
3. Point your barcode scanner at an equipment barcode
4. Press the scan trigger on your scanner
5. The system will:
   - Look up the equipment
   - Check if it's available
   - Open the request modal automatically if available
   - Show an error message if not found or unavailable

### Method 2: Manual Entry
1. Click in the barcode input field
2. Type the barcode manually (e.g., `EQ-123456`)
3. Press **Enter**
4. The system will process it the same way

## What Happens When You Scan

### ✅ Successful Scan (Equipment Available)
- Border turns **green** briefly
- Success alert: "Equipment found: [Equipment Name]"
- Request modal opens automatically
- Equipment name is pre-filled
- You can fill in purpose and return date
- Submit your request

### ⚠️ Equipment Not Found
- Border turns **red** briefly
- Warning alert: "Equipment not found. Please check the barcode and try again."
- Input field clears automatically
- Ready for next scan

### ⚠️ Equipment Unavailable
- Border turns **orange** briefly
- Warning alert explaining why (Borrowed, Under Repair, etc.)
- Input field clears automatically
- Ready for next scan

### ❌ Error
- Border turns **red** briefly
- Error alert: "Error looking up equipment. Please try again."
- Input field clears automatically
- Ready for next scan

## Visual Feedback

The barcode input field provides visual feedback:
- **Blue border**: Scanning/loading
- **Green border**: Success (equipment found)
- **Red border**: Error (not found or system error)
- **Orange border**: Warning (unavailable)

## Troubleshooting

### Scanner Not Working
1. **Check Connection**:
   - Ensure the scanner is properly connected (USB/Bluetooth)
   - Try unplugging and reconnecting
   - Check if the scanner is powered on

2. **Check Scanner Mode**:
   - Most scanners need to be in "HID" or "Keyboard" mode
   - Some scanners have a configuration button to switch modes
   - Refer to your scanner's manual

3. **Test Scanner**:
   - Open Notepad or any text editor
   - Try scanning a barcode
   - If it types the barcode, the scanner is working
   - If nothing happens, check scanner settings

### Barcode Not Found
1. **Verify Barcode**:
   - Make sure the equipment has a barcode assigned in the admin dashboard
   - Check that you're scanning the correct barcode
   - Verify the barcode format is `EQ-XXXXXX`

2. **Check Firestore Index**:
   - If you see an error about index, you may need to create a Firestore index
   - Go to Firebase Console → Firestore → Indexes
   - Create an index on `equipments` collection with field `barcode` (Ascending)

### Equipment Not Available
- This is expected behavior if:
  - Equipment status is "Borrowed"
  - Equipment status is "Under Repair"
  - Equipment status is not "Available"
- The system will show a message explaining why

### Input Field Not Focused
- Click directly in the barcode input field
- Navigate away from Browse Equipment and back
- Refresh the page
- The field should automatically focus when the Browse Equipment section is active

## Firestore Index Setup (If Needed)

If you encounter an error about missing index, create one:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Set:
   - Collection ID: `equipments`
   - Fields to index:
     - `barcode` (Ascending)
   - Query scope: Collection
6. Click **Create**

## Best Practices

1. **Keep Scanner Clean**: Clean the scanner lens regularly for better scanning
2. **Good Lighting**: Ensure adequate lighting when scanning
3. **Steady Hands**: Hold the scanner steady when scanning
4. **Correct Distance**: Maintain the recommended distance from the barcode
5. **Test First**: Always test with a known barcode first

## Features

- ✅ Automatic barcode detection
- ✅ Real-time equipment lookup
- ✅ Availability checking
- ✅ Automatic request modal opening
- ✅ Visual feedback (colors)
- ✅ Error handling
- ✅ Manual entry support
- ✅ Auto-focus on Browse Equipment section
- ✅ Clear button for manual clearing

## Notes

- The barcode scanner input is only available on the **Borrower Dashboard**
- Only equipment with status "Available" can be requested via barcode
- The system automatically clears the input after each scan
- The input field is automatically focused when you navigate to Browse Equipment
- Both automatic scanning and manual entry are supported

