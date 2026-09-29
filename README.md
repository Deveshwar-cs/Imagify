# Imagify

**Imagify** is a full-stack SaaS-style image processing platform that allows users to upload, optimize, process, store, download, and temporarily share images.

The project also includes a **Chrome Extension** that allows users to capture visible-area, full-page, and selected-area screenshots and use Imagify's image-processing capabilities.

---

## 🚀 Features

### 🖼️ Image Processing

Imagify supports multiple image-processing operations:

- Upload JPG, JPEG, PNG, and WEBP images
- Maximum upload size of 10 MB per image
- Resize images using custom width and height
- Maintain aspect ratio while resizing
- Improve image quality
- Compress images using different compression levels
- Upscale images by 2× or 3×
- Process multiple images
- View processing progress
- Compare original and processed images
- Display image dimensions and file sizes
- Download processed images
- Handle processing errors

### ☁️ Image Storage

Authenticated users can store their images in Cloudinary.

Storage functionality includes:

- Upload images to personal storage
- View stored images
- Track storage usage
- Delete stored images
- Storage limits based on subscription plan
- Guest usage limits
- Cloudinary-based image storage

Original images are stored separately from processed images.

Example Cloudinary folders:

```text
imagify/
├── originals/
└── processed/
    ├── resize/
    ├── compress/
    └── quality/
```

---

## 🔐 Authentication

Imagify supports authentication using Google OAuth.

Authentication flow:

```text
User
  ↓
Google Login
  ↓
Google Credential
  ↓
Backend Verification
  ↓
Find/Create User
  ↓
JWT
  ↓
HTTP-only Cookie
  ↓
Authenticated Requests
```

Features include:

- Google OAuth login
- JWT authentication
- HTTP-only authentication cookies
- Protected frontend routes
- Protected backend routes
- Guest users
- Guest identification using a guest ID
- Automatic user creation when logging in for the first time

---

## 👤 Guest Users

Imagify allows users to use limited functionality without creating an account.

Guest users are identified using a generated `guestId`.

Guest usage is limited separately from authenticated users.

This allows users to try the platform before creating an account.

---

## 💳 Subscription System

Imagify uses **Stripe** for subscription management.

Available plans:

- Starter
- Premium
- Enterprise

Subscription functionality includes:

- Create subscription through Stripe Checkout
- View current subscription
- Upgrade subscription
- Preview upgrade amount
- Apply prorated billing
- Schedule downgrades
- Cancel subscription
- Restore a cancelled subscription
- Cancel a scheduled plan change
- Stripe webhook synchronization

### Subscription Flow

```text
User selects plan
       ↓
Stripe Checkout
       ↓
Payment
       ↓
Stripe Subscription
       ↓
Webhook
       ↓
Backend
       ↓
MongoDB
       ↓
Updated subscription status
```

### Upgrade Preview

Before upgrading, Imagify can request a preview from Stripe.

The backend calculates the expected amount using the current subscription and the selected future price.

The preview does not modify the actual subscription.

Example:

```text
Current Plan
     ↓
Select New Plan
     ↓
Preview Stripe Invoice
     ↓
Display Amount Due
     ↓
User Confirms
     ↓
Update Subscription
```

### Proration

Subscription upgrades use Stripe's:

```js
proration_behavior: "always_invoice";
```

This allows Stripe to calculate the unused portion of the current plan and the remaining cost of the new plan, then create an invoice for the prorated difference.

---

## 🔄 Scheduled Downgrades

Downgrades are handled differently from upgrades.

Instead of immediately replacing the current subscription price, Imagify uses a **Stripe Subscription Schedule**.

Example:

```text
Current Plan
Premium
   ↓
User selects Starter
   ↓
Subscription Schedule
   ↓
Premium remains active
   ↓
Current billing period ends
   ↓
Starter becomes active
```

Users can cancel the scheduled downgrade before it takes effect.

When cancelling a scheduled change, the subscription schedule is released from Stripe and the scheduled-plan information is cleared from MongoDB.

---

## ❌ Subscription Cancellation

Users can cancel their active subscription.

The subscription is configured to cancel at the end of the current billing period rather than immediately removing access.

Users can also restore the subscription before the cancellation date.

Flow:

```text
Active Subscription
       ↓
Cancel Subscription
       ↓
cancel_at_period_end = true
       ↓
Subscription remains active
       ↓
Billing Period Ends
       ↓
Subscription Ends
```

---

## ⚙️ Background Image Processing

Image processing is handled asynchronously using:

- Redis
- BullMQ
- Workers
- Sharp

Instead of keeping the HTTP request open while processing images, Imagify creates a processing batch and sends the job to a queue.

### Processing Flow

```text
Frontend
   ↓
POST /images/process
   ↓
Backend
   ↓
Create Processing Batch
   ↓
BullMQ Queue
   ↓
Redis
   ↓
Image Worker
   ↓
Sharp
   ↓
Cloudinary
   ↓
Update Processing Batch
   ↓
Frontend checks progress
```

### Processing Batch

A processing batch keeps track of:

- Processing status
- Image IDs
- Total images
- Completed images
- Failed images
- Processing operation
- Processing options
- Notification status

Possible statuses include:

```text
pending
processing
completed
failed
```

---

## 🔔 Push Notifications

Imagify supports PWA push notifications.

Users can enable browser notifications and receive a notification when background image processing is completed.

Example flow:

```text
Image Processing
      ↓
BullMQ Worker
      ↓
Processing Completed
      ↓
Push Notification
      ↓
Browser Notification
      ↓
Notification Results Page
```

The application uses a service worker and Workbox for PWA functionality.

---

## 🔗 Temporary Image Sharing

Processed results can be shared using a temporary link.

The sharing system uses:

- Secure random tokens
- Share records stored in MongoDB
- Expiration time
- TTL index

Example flow:

```text
Processing Completed
       ↓
Create Share Token
       ↓
Store Token
       ↓
Generate Share URL
       ↓
User Shares URL
       ↓
Recipient Opens URL
       ↓
Shared Results
```

Share links are temporary and automatically expire.

---

# 🧩 Chrome Extension

Imagify also includes a Chrome Extension called **Imagify Screenshot**.

The extension is built using **Chrome Extension Manifest V3**.

It allows users to capture:

- Visible area screenshots
- Full-page screenshots
- Selected-area screenshots

The captured screenshot can then be displayed in the extension popup and used with Imagify functionality.

---

## 📸 Screenshot Types

### Visible Area

Captures the currently visible portion of the webpage.

```text
Browser Viewport
       ↓
Capture Visible Area
       ↓
Screenshot
```

### Full Page

The extension captures multiple viewport sections and combines them into one large screenshot.

```text
Page
────────────────
Section 1
────────────────
Section 2
────────────────
Section 3
────────────────
Section 4
────────────────
       ↓
Capture Sections
       ↓
Combine Images
       ↓
Full Page Screenshot
```

The extension also handles fixed and sticky page elements to prevent them from appearing repeatedly in stitched screenshots.

### Selected Area

The user can select a specific area of the webpage and capture only that region.

---

## 🧱 Chrome Extension Architecture

```text
Extension Popup
      ↓
Background Service Worker
      ↓
Content Script
      ↓
Web Page
      ↓
Screenshot Capture
      ↓
Background Service Worker
      ↓
Extension Popup
```

### Popup

Located at:

```text
chrome-extension/popup/
```

The popup contains:

- `popup.html`
- `popup.css`
- `popup.js`

It provides the extension's user interface and screenshot controls.

### Background Service Worker

Located at:

```text
chrome-extension/background/service-worker.js
```

The service worker coordinates extension-level operations and communicates between the popup and content script.

### Content Script

Located at:

```text
chrome-extension/content/content.js
```

The content script runs inside web pages and performs operations that require access to the page's DOM or page environment.

---

## 🔑 Chrome Extension Permissions

The extension uses Manifest V3 permissions such as:

```text
activeTab
tabs
scripting
storage
```

These permissions allow the extension to interact with the active tab, execute scripts, and store extension data.

---

# 🛠️ Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Axios
- React Router
- PWA
- Workbox

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Sharp
- Multer
- Cloudinary
- Redis
- BullMQ
- Stripe
- Google OAuth

## Chrome Extension

- JavaScript
- Chrome Extension Manifest V3
- Chrome Extension APIs
- Content Scripts
- Service Workers
- Chrome Storage API

## Development / Infrastructure

- Nginx
- mkcert
- MongoDB Atlas
- Cloudinary
- Stripe
- Redis
- Vercel
- Render

---

# 📁 Project Structure

```text
Imagify/
│
├── chrome-extension/                  # Chrome screenshot extension
│   │
│   ├── background/
│   │   └── service-worker.js          # Background service worker
│   │
│   ├── content/
│   │   └── content.js                 # Page interaction and screenshot logic
│   │
│   ├── popup/
│   │   ├── popup.css                  # Popup styles
│   │   ├── popup.html                 # Popup UI
│   │   └── popup.js                   # Popup logic
│   │
│   └── manifest.json                  # Chrome extension configuration
│
├── client/                            # React frontend
│   │
│   ├── dev-dist/                      # Generated PWA development files
│   │
│   ├── public/                        # Public/static files
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   ├── pwa-192x192.png
│   │   └── pwa-512x512.png
│   │
│   ├── src/
│   │   │
│   │   ├── assets/                    # Frontend assets
│   │   │
│   │   ├── components/                # Reusable React components
│   │   │   ├── auth/
│   │   │   ├── context/
│   │   │   ├── layout/
│   │   │   ├── notifications/
│   │   │   ├── shared/
│   │   │   ├── subscription/
│   │   │   └── upload/
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── upload/
│   │   │   └── useAuth.js
│   │   │
│   │   ├── pages/                     # Application pages
│   │   │
│   │   ├── services/                  # API service functions
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │
│   │   ├── App.jsx                    # Main application component
│   │   ├── index.css                  # Global styles
│   │   ├── main.jsx                   # React entry point
│   │   └── sw.js                      # PWA service worker
│   │
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── nginx/                             # Local HTTPS configuration
│   │
│   ├── servers/
│   │   └── imagify.conf               # Nginx server configuration
│   │
│   └── ssl/
│       ├── imagify-key.pem            # Local SSL private key
│       └── imagify.pem                # Local SSL certificate
│
├── server/                            # Node/Express backend
│   │
│   ├── src/
│   │   │
│   │   ├── config/                    # Application configuration
│   │   │   ├── cloudinary.js
│   │   │   ├── database.js
│   │   │   ├── multer.js
│   │   │   ├── redis.js
│   │   │   ├── stripe.js
│   │   │   ├── subscription.plan.js
│   │   │   └── usage.config.js
│   │   │
│   │   ├── controllers/               # Request/business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── image.controller.js
│   │   │   ├── share.controller.js
│   │   │   ├── storage.controller.js
│   │   │   ├── subscription.controller.js
│   │   │   └── subscription.webhook.controller.js
│   │   │
│   │   ├── middleware/                # Request middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── guest.middleware.js
│   │   │   └── identify.middleware.js
│   │   │
│   │   ├── models/                    # Mongoose models
│   │   │   ├── guest.usage.model.js
│   │   │   ├── image.models.js
│   │   │   ├── processing.batch.model.js
│   │   │   ├── push.subscription.model.js
│   │   │   ├── share.model.js
│   │   │   └── user.model.js
│   │   │
│   │   ├── queue/                     # BullMQ queues
│   │   │   └── image.queue.js
│   │   │
│   │   ├── routes/                    # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── image.routes.js
│   │   │   ├── storage.routes.js
│   │   │   └── subscription.routes.js
│   │   │
│   │   ├── services/                  # Application services
│   │   │   ├── google.auth.service.js
│   │   │   ├── image.processing.service.js
│   │   │   ├── image.service.js
│   │   │   ├── push.services.js
│   │   │   └── usage.service.js
│   │   │
│   │   ├── utils/                     # Backend utilities
│   │   │
│   │   ├── workers/                   # Background workers
│   │   │   └── image.worker.js
│   │   │
│   │   └── server.js                  # Backend entry point
│   │
│   ├── package-lock.json
│   └── package.json
│
└── README.md
```

---

# 🔄 Application Architecture

Imagify follows a layered full-stack architecture.

```text
                    ┌─────────────────┐
                    │     Client      │
                    │ React + Vite    │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │     Routes      │
                    │    Express      │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │   Controllers  │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │    Services    │
                    └──────┬──┬───────┘
                           │  │
                 ┌─────────┘  └──────────┐
                 ↓                       ↓
          ┌─────────────┐         ┌─────────────┐
          │  MongoDB    │         │ Cloudinary  │
          └─────────────┘         └─────────────┘
```

For asynchronous processing:

```text
Client
  ↓
Controller
  ↓
BullMQ Queue
  ↓
Redis
  ↓
Worker
  ↓
Sharp
  ↓
Cloudinary
  ↓
MongoDB
```

---

# 📡 API Endpoints

## Authentication

```text
GET  /api/auth/me
POST /api/auth/google
POST /api/auth/logout
```

## Image Processing

```text
POST /api/images/upload
POST /api/images/process
GET  /api/images/batches/:batchId
```

## Storage

```text
GET    /api/storage/usage
GET    /api/storage/images
POST   /api/storage/upload
DELETE /api/storage/images/:id
```

## Sharing

```text
GET /api/share/:token
```

## Subscriptions

```text
GET  /api/subscription/status

POST /api/subscription/checkout
POST /api/subscription/change-plan
POST /api/subscription/preview-upgrade
POST /api/subscription/downgrade

POST /api/subscription/cancel
POST /api/subscription/restore
POST /api/subscription/cancel-scheduled-plan

POST /api/subscription/webhook
```

---

# 📂 Frontend Organization

The frontend is organized into components, pages, hooks, services, and utilities.

### Components

Reusable UI components are grouped by functionality:

```text
components/
├── auth/
├── context/
├── layout/
├── notifications/
├── shared/
├── subscription/
└── upload/
```

### Pages

Application-level pages include:

```text
pages/
├── Home.jsx
├── Login.jsx
├── NotificationResults.jsx
├── Storage.jsx
├── Subscription.jsx
├── Upload.jsx
└── Uploadcopy.jsx
```

### Hooks

Custom React logic is separated into hooks:

```text
hooks/
├── useAuth.js
└── upload/
    ├── useImageProcessing.js
    ├── useImageShare.js
    └── useImageUpload.js
```

### Services

API communication is separated into service modules:

```text
services/
├── api.js
├── auth.service.js
├── image.service.js
├── processing.service.js
├── push.js
├── share.service.js
├── storage.service.js
└── subscription.service.js
```

This keeps API logic separate from UI components.

---

# 🖥️ Local Development

## Prerequisites

Install:

- Node.js
- npm
- MongoDB / MongoDB Atlas
- Redis
- Cloudinary account
- Google OAuth credentials
- Stripe account
- Stripe CLI for local webhook testing

---

## 1. Clone the Repository

```bash
git clone https://github.com/Deveshwar-cs/Imagify.git
cd Imagify
```

---

## 2. Install Frontend Dependencies

```bash
cd client
npm install
```

---

## 3. Install Backend Dependencies

```bash
cd ../server
npm install
```

---

## 4. Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

REDIS_URL=your_redis_url

STRIPE_SECRET_KEY=sk_test_your_secret_key

STRIPE_STARTER_PRICE_ID=price_your_starter_price_id
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id

STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

STRIPE_SUCCESS_URL=http://localhost:5173/success
STRIPE_CANCEL_URL=http://localhost:5173/cancel
```

Do not commit `.env` files or secret credentials to GitHub.

---

# ▶️ Running the Application

### Start Backend

```bash
cd server
npm run dev
```

Backend:

```text
http://localhost:5000
```

### Start Frontend

Open another terminal:

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 💳 Stripe Local Testing

Use Stripe Test Mode while developing.

Create recurring products for:

```text
Starter
Premium
Enterprise
```

Copy their Price IDs into the backend `.env`.

For local webhook testing:

```bash
stripe login
```

Then:

```bash
stripe listen --forward-to localhost:5000/api/subscription/webhook
```

Stripe CLI will provide a webhook signing secret.

Add that value to:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Test Card

Use:

```text
4242 4242 4242 4242
```

Use:

- Any future expiration date
- Any valid test CVC
- Any valid test ZIP/postal code

---

# 🌐 Local HTTPS Setup

Imagify can be run locally using HTTPS with:

- Nginx
- mkcert
- Local domain configuration

Example local domain:

```text
imagify.com
```

The hosts file can map the domain to:

```text
127.0.0.1 imagify.com
```

Nginx handles the HTTPS connection and proxies requests to the local Vite development server.

Example structure:

```text
Browser
   ↓
https://imagify.com
   ↓
Nginx
   ↓
Vite
   ↓
React Application
```

SSL certificates are stored in:

```text
nginx/ssl/
```

---

# 🧩 Chrome Extension Installation

To install the extension locally:

### 1. Open Chrome Extensions

```text
chrome://extensions
```

### 2. Enable Developer Mode

Turn on **Developer mode**.

### 3. Load Extension

Click:

```text
Load unpacked
```

Select:

```text
Imagify/chrome-extension
```

The selected folder must contain:

```text
manifest.json
```

### 4. Pin the Extension

Pin **Imagify Screenshot** from the Chrome extensions menu.

---

# 🔧 Chrome Extension Development

When making changes:

```text
Edit Code
   ↓
Save
   ↓
Reload Extension
   ↓
Refresh Webpage
   ↓
Test Screenshot
```

If changing:

```text
manifest.json
```

the extension should be reloaded from:

```text
chrome://extensions
```

If changing the content script, refresh the webpage before testing.

---

# 🐛 Debugging

### Extension Popup

Right-click the extension popup and select:

```text
Inspect
```

### Background Service Worker

Open:

```text
chrome://extensions
```

Find Imagify Screenshot and inspect the service worker.

### Content Script

Open the webpage's DevTools:

```text
Right Click → Inspect → Console
```

Content-script logs will appear there.

---

# 🔒 Security Considerations

Imagify uses several security mechanisms:

- HTTP-only cookies for authentication
- JWT-based authentication
- Google OAuth credential verification
- Protected backend routes
- Guest identification
- File type validation
- File size validation
- Temporary share tokens
- Expiring share links
- Stripe webhook verification
- Environment variables for secrets

Uploaded files are validated to allow supported image formats such as:

```text
image/jpeg
image/png
image/webp
```

---

# ☁️ Cloudinary Storage

Cloudinary is used for persistent image storage.

The application separates original and processed images into different
