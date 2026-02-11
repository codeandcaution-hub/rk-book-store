# Firebase Setup Guide for RR Book Store

## Step 1: Create a Firebase Project

### 1.1 Go to Firebase Console
- Visit [Firebase Console](https://console.firebase.google.com/)
- Sign in with your Google account (create one if needed)

### 1.2 Create a New Project
- Click **"Create a project"** or **"Add project"**
- Enter project name: `rr-book-store` (or your preferred name)
- Click **"Continue"**

### 1.3 Configure Google Analytics (Optional)
- You can enable or disable Google Analytics
- If enabled, select your country and accept terms
- Click **"Create project"**
- Wait for the project to be created (1-2 minutes)

---

## Step 2: Set Up Firebase Authentication

### 2.1 Enable Email/Password Authentication
1. In the Firebase Console, go to **Authentication** (left sidebar)
2. Click the **"Get started"** button
3. Click on **"Email/Password"** option
4. Toggle **"Enable"** to turn it on
5. Click **"Save"**

### 2.2 (Optional) Enable Anonymous Authentication
- Go to **Authentication** → **Sign-in method**
- Click **"Anonymous"**
- Toggle **"Enable"**
- Click **"Save"**

---

## Step 3: Create Firestore Database

### 3.1 Go to Firestore
1. In the Firebase Console, click **"Firestore Database"** (left sidebar)
2. Click **"Create database"**

### 3.2 Configure Database Settings
- **Location**: Choose the region closest to your users (e.g., `us-central1`)
- **Security Rules**: Select **"Start in test mode"** (for development)
  - ⚠️ Change to production rules before deploying to production!
- Click **"Create"**
- Wait for the database to initialize

### 3.3 Set Up Security Rules (for development)
After database creation, go to **Firestore Database** → **Rules** tab and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // For development only - allow all reads/writes
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **"Publish"**

---

## Step 4: Create Firestore Collections and Documents

### 4.1 Create Collections
The app will auto-create these collections when needed, but you can create them manually:

1. **products** - Product catalog
2. **orders** - Customer orders
3. **order_items** - Items in each order
4. **cart_items** - Shopping cart items
5. **wishlist_items** - Wishlist items
6. **profiles** - User profile data
7. **coupons** - Promotional codes
8. **user_roles** - Admin role assignments

### 4.2 Add Sample Data (Optional)

**Example Product Document** in `products` collection:
```json
{
  "id": "product-1",
  "name": "JavaScript: The Good Parts",
  "description": "A guide to JavaScript fundamentals",
  "price": 599,
  "category": "books",
  "stock": 50,
  "rating": 4.5,
  "image_url": "https://example.com/book1.jpg",
  "is_featured": true,
  "created_at": "2026-02-09T10:00:00.000Z"
}
```

**Example Coupon Document** in `coupons` collection:
```json
{
  "code": "WELCOME10",
  "discount_type": "percentage",
  "discount_value": 10,
  "min_order_value": 500,
  "is_active": true,
  "expires_at": "2026-12-31T23:59:59.000Z",
  "created_at": "2026-02-09T10:00:00.000Z"
}
```

---

## Step 5: Get Firebase Configuration

### 5.1 Get Project Credentials
1. In Firebase Console, click the **gear icon** (⚙️) → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click **"</>Ges Web"** (or if it exists, skip to 5.2)
4. Register app name: `rr-book-store-web`
5. Click **"Register app"**

### 5.2 Copy Firebase Config
You'll see configuration code. Copy these values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## Step 6: Add Credentials to Your Project

### 6.1 Create `.env` File
In the root directory of your project (`c:\rr book store\`), create a `.env` file:

```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

### 6.2 Example `.env` File
```
VITE_FIREBASE_API_KEY=AIzaSyD0000000000000000000000000000000
VITE_FIREBASE_AUTH_DOMAIN=rr-book-store.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rr-book-store
VITE_FIREBASE_STORAGE_BUCKET=rr-book-store.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789000
VITE_FIREBASE_APP_ID=1:123456789000:web:abcdef1234567890abcd
```

### 6.3 Add to `.gitignore`
Make sure `.env` is in your `.gitignore` (it should be) so credentials aren't committed:

```
.env
.env.local
.env.*.local
```

---

## Step 7: Test the Connection

### 7.1 Start the Development Server
```bash
npm install
npm run dev
```

### 7.2 Test Authentication
1. Open `http://localhost:8080` in your browser
2. Go to **Sign In** page
3. Create a new account with email and password
4. Check Firebase Console → **Authentication** → **Users** to confirm user was created

### 7.3 Test Database
1. After login, try adding a product to your cart
2. Go to Firebase Console → **Firestore Database**
3. Check the **cart_items** collection to verify data was saved

---

## Step 8: Production Security Rules (Important!)

Before deploying to production, update your Firestore security rules:

### 8.1 Go to Firestore Rules
In Firebase Console → **Firestore Database** → **Rules** tab

### 8.2 Replace with Production Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profiles - only owner can read/write
    match /profiles/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // Products - anyone can read, only admins can write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Cart items - only owner can read/write
    match /cart_items/{itemId} {
      allow read, write: if request.auth.uid == resource.data.user_id;
    }
    
    // Wishlist items - only owner can read/write
    match /wishlist_items/{itemId} {
      allow read, write: if request.auth.uid == resource.data.user_id;
    }
    
    // Orders - only owner or admin can read
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.user_id || isAdmin();
      allow write: if request.auth.uid == resource.data.user_id;
      
      match /order_items/{itemId} {
        allow read: if request.auth.uid == get(/databases/$(database)/documents/orders/$(orderId)).data.user_id || isAdmin();
      }
    }
    
    // Coupons - anyone can read
    match /coupons/{couponId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // User roles - only admins can write
    match /user_roles/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if isAdmin();
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/user_roles/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/user_roles/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Click **"Publish"**

---

## Step 9: Set Up Admin Users

### 9.1 Create Admin Role Document
1. Go to **Firestore Database**
2. Go to **user_roles** collection (create it if it doesn't exist)
3. Create a new document with your user ID as the document ID
4. Add a field: `role: "admin"`

To find your user ID:
- Go to **Authentication** → **Users**
- Copy the UID of your account
- Use it as the document ID

---

## Troubleshooting

### Issue: "Firebase is not initialized"
- ✅ Make sure `.env` file exists with correct credentials
- ✅ Restart the dev server after adding `.env`

### Issue: "Permission denied" errors
- ✅ Check Firestore Rules (Step 8)
- ✅ For development, use test mode rules temporarily

### Issue: Authentication not working
- ✅ Go to Firebase Console → **Authentication** → **Sign-in method**
- ✅ Confirm **Email/Password** is enabled

### Issue: Collections not showing in Firestore
- ✅ Collections auto-create when first document is added
- ✅ Or manually create them as shown in Step 4

---

## Quick Reference: Firebase Console Links

After project creation, you'll use these URLs frequently:

- **Authentication**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication/users`
- **Firestore**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/data`
- **Project Settings**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general`

---

## Next Steps

1. ✅ Create Firebase project
2. ✅ Add credentials to `.env`
3. ✅ Test authentication
4. ✅ Add sample products
5. ✅ Test cart functionality
6. ✅ Update security rules for production

**Your app is now connected to Firebase!** 🎉
