# Imagify

**Imagify** is a full-stack SaaS-style image processing platform for uploading, optimizing, processing, storing, downloading, and temporarily sharing images.

It also includes **Imagify Screenshot**, a Chrome Extension for capturing visible-area, full-page, and selected-area screenshots.

---

# Features

## Image Processing

- Upload JPG, JPEG, PNG, and WEBP images up to 10 MB
- Resize with custom dimensions and aspect-ratio support
- Improve image quality
- Compress images
- Upscale images by 2× or 3×
- Process multiple images
- Track processing progress
- Compare original and processed images
- View dimensions and file sizes
- Download processed images

## Image Storage

Authenticated users can store images in Cloudinary with:

- Personal image storage
- Storage usage tracking
- Subscription-based storage limits
- Guest usage limits
- Original and processed image storage
- Image deletion

```text
imagify/
├── originals/
└── processed/
    ├── resize/
    ├── compress/
    └── quality/
```

---

# Authentication

Imagify uses **Google OAuth** with JWT-based sessions.

```text
Google Login
     ↓
Backend Verification
     ↓
Find / Create User
     ↓
JWT
     ↓
HTTP-only Cookie
     ↓
Authenticated Requests
```

Features:

- Google OAuth
- JWT authentication
- HTTP-only cookies
- Protected routes
- Guest users with `guestId`

---

# Guest Users

Users can try Imagify without creating an account.

```text
Guest
  ↓
guestId
  ↓
Usage Tracking
  ↓
Guest Limits
```

Authenticated users are associated with their account and subscription plan.

---

# Subscription System

Imagify uses **Stripe** for subscription management.

Plans:

- Starter
- Premium
- Enterprise

Features:

- Stripe Checkout
- Subscription status
- Plan upgrades
- Upgrade previews
- Prorated billing
- Scheduled downgrades
- Cancellation and restoration
- Scheduled-plan cancellation
- Stripe webhook synchronization

### Subscription Flow

```text
Select Plan
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
```

Upgrades use Stripe proration, while downgrades are scheduled for the end of the current billing period.

---

# Background Image Processing

Long-running image processing is handled asynchronously using **BullMQ, Redis, Sharp, and Cloudinary**.

```text
Frontend
   ↓
Express
   ↓
Processing Batch
   ↓
BullMQ
   ↓
Redis
   ↓
Image Worker
   ↓
Sharp
   ↓
Cloudinary
   ↓
MongoDB
```

Processing batches track:

- Status
- Image IDs
- Total/completed/failed images
- Operation and options
- Notification status

Supported operations:

```text
Resize
Compress
Improve Quality
Upscale
```

Start the worker with:

```bash
cd server
node src/workers/image.worker.js
```

---

# User Flow

```text
Upload
  ↓
Select Action
  ↓
Configure
  ↓
Process
  ↓
Background Processing
  ↓
Preview Result
  ↓
Download
```

The frontend displays processing progress, image dimensions, file sizes, and before/after results.

---

# Push Notifications

Imagify supports **PWA push notifications** using:

- Service Worker
- Workbox
- Web Push
- VAPID

```text
Worker
  ↓
Processing Complete
  ↓
Push Service
  ↓
Service Worker
  ↓
Browser Notification
```

VAPID public/private keys authenticate Web Push communication. The private key remains on the backend.

---

# Temporary Image Sharing

Processed images can be shared using temporary links.

```text
Processing Complete
      ↓
Secure Share Token
      ↓
Share Record + expiresAt
      ↓
Share URL
      ↓
Recipient
      ↓
Backend Validation
      ↓
Shared Result
```

MongoDB TTL automatically removes expired share records.

```js
shareSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});
```

The TTL index removes the **MongoDB share record**, not the Cloudinary image.

---

# Chrome Extension

**Imagify Screenshot** is a Manifest V3 Chrome Extension.

It supports:

- Visible-area screenshots
- Full-page screenshots
- Selected-area screenshots

Full-page capture stitches multiple viewport screenshots and handles fixed/sticky elements.

### Architecture

```text
Popup
  ↓
Background Service Worker
  ↓
Content Script
  ↓
Web Page
  ↓
Screenshot
  ↓
Popup
```

### Structure

```text
chrome-extension/
├── background/
│   └── service-worker.js
├── content/
│   └── content.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── manifest.json
```

Permissions include:

```text
activeTab
tabs
scripting
storage
```

---

# Tech Stack

### Frontend

React, Vite, Tailwind CSS, Axios, React Router, PWA, Workbox

### Backend

Node.js, Express, MongoDB, Mongoose, Sharp, Multer, Cloudinary, Redis, BullMQ, Stripe, Google OAuth

### Chrome Extension

JavaScript, Manifest V3, Chrome APIs, Content Scripts, Service Workers

### Infrastructure

Nginx, mkcert, MongoDB Atlas, Cloudinary, Stripe, Redis, Vercel, Render

---

# Application Architecture

### Normal Requests

```text
React
  ↓
Express Routes
  ↓
Controllers
  ↓
Services
  ↓
MongoDB / Cloudinary
```

### Background Processing

```text
Express
  ↓
BullMQ
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

# Project Structure

```text
Imagify/
├── chrome-extension/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── utils/
├── nginx/
│   ├── servers/
│   └── ssl/
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── queue/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── workers/
└── README.md
```

---

# API Endpoints

### Authentication

```text
GET  /api/auth/me
POST /api/auth/google
POST /api/auth/logout
```

### Image Processing

```text
POST /api/images/upload
POST /api/images/process
GET  /api/images/batches/:batchId
```

### Storage

```text
GET    /api/storage/usage
GET    /api/storage/images
POST   /api/storage/upload
DELETE /api/storage/images/:id
```

### Sharing

```text
GET /api/share/:token
```

### Subscriptions

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

# Frontend Organization

```text
src/
├── components/
├── hooks/
├── pages/
├── services/
└── utils/
```

- **Components** — reusable UI
- **Pages** — application screens
- **Hooks** — reusable React logic
- **Services** — API communication
- **Utils** — helper functions

---

# 1. Clone the Repository

```bash
git clone https://github.com/Deveshwar-cs/Imagify.git
cd Imagify
```

---

# 2. Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd ../server
npm install
```

---

# 3. Environment Variables

Create the required `.env` files.

## Server `.env`

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

NODE_ENV=development

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

REDIS_URL=your_redis_url

VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:yourmail@example.com

CLIENT_URL=http://localhost:5173

STRIPE_SECRET_KEY=sk_test_your_secret_key

STRIPE_STARTER_PRICE_ID=price_your_starter_price_id
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id

STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

STRIPE_SUCCESS_URL=http://localhost:5173/success
STRIPE_CANCEL_URL=http://localhost:5173/cancel
```

## Client `.env`

```env
VITE_API_URL=http://localhost:5000/api

VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

> **Security:** Never commit `.env` files, API keys, private keys, JWT secrets, Stripe secrets, Cloudinary secrets, or SSL private keys to GitHub.

---

# 4. Run the Application

## Start Backend

```bash
cd server
npm run dev
```

Backend:

```text
http://localhost:5000
```

---

## Start Frontend

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

## Start Image Worker

Open another terminal:

```bash
cd server
node src/workers/image.worker.js
```

The worker is required for:

```text
Resize
Compress
Improve Quality
Upscale
```

---

# Google OAuth Setup

Imagify uses Google Sign-In for authentication.

## Create OAuth Credentials

1. Open Google Cloud Console.
2. Create or select a Google Cloud project.
3. Open **Google Auth Platform**.
4. Configure the application.
5. Create an OAuth Client ID.
6. Select **Web application**.
7. Add the application's authorized JavaScript origins.
8. Copy the generated Client ID.

For the local HTTPS setup, the origin is:

```text
https://imagify.com
```

## Environment Variables

### Client

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Server

```env
GOOGLE_CLIENT_ID=your_google_client_id
```

## Authentication Flow

```text
User
 ↓
Google Sign-In
 ↓
Google Credential
 ↓
React
 ↓
POST /api/auth/google
 ↓
Backend Verifies Credential
 ↓
Find / Create MongoDB User
 ↓
Create JWT
 ↓
HTTP-only Cookie
 ↓
Authenticated User
```

The backend verifies the Google credential before creating the application's authenticated session.

---

# Stripe Local Testing

Imagify uses Stripe in **Test Mode** during development.

Create recurring products/prices for:

```text
Starter
Premium
Enterprise
```

Add their Price IDs to the backend `.env`.

## Stripe CLI

Login:

```bash
stripe login
```

Forward Stripe events to the local backend:

```bash
stripe listen --forward-to localhost:5000/api/subscription/webhook
```

Stripe CLI provides a webhook signing secret.

Add it to:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

The application uses this secret to verify Stripe webhook requests.

## Test Card

Use:

```text
4242 4242 4242 4242
```

Use:

- Any future expiration date
- Any valid test CVC
- Any valid test ZIP/postal code

---

# Local HTTPS Setup

Imagify can be run locally using:

- Nginx
- mkcert
- `/etc/hosts`
- Local HTTPS certificates

Local domain:

```text
https://imagify.com
```

---

## 1. Install Nginx and mkcert

On macOS with Homebrew:

```bash
brew install nginx
brew install mkcert
mkcert -install
```

---

## 2. Configure Local Domain

Open:

```bash
sudo nano /etc/hosts
```

Add:

```text
127.0.0.1 imagify.com
```

This maps the local domain to your machine.

---

## 3. Generate SSL Certificate

From the project root:

```bash
mkdir -p nginx/ssl
cd nginx/ssl
```

Generate the certificate:

```bash
mkcert imagify.com
```

Rename the generated files to:

```text
imagify.pem
imagify-key.pem
```

The private key must not be committed to Git.

---

## 4. Configure Nginx

Create:

```text
/opt/homebrew/etc/nginx/servers/imagify.conf
```

Example:

```nginx
server {
    listen 80;
    server_name imagify.com;

    return 301 https://imagify.com$request_uri;
}

server {
    listen 443 ssl;
    server_name imagify.com;

    ssl_certificate /path/to/Imagify/nginx/ssl/imagify.pem;
    ssl_certificate_key /path/to/Imagify/nginx/ssl/imagify-key.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:5173;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Replace the certificate paths with the actual path to your project.

---

## 5. Configure Vite

In `client/vite.config.js`:

```js
server: {
  allowedHosts: ["imagify.com"],
}
```

This allows Vite to accept requests through the local domain.

---

## 6. Configure Frontend API

When using local HTTPS:

```env
VITE_API_URL=https://imagify.com/api
```

---

## 7. Start the Application

### Terminal 1 — Backend

```bash
cd server
npm run dev
```

### Terminal 2 — Worker

```bash
cd server
node src/workers/image.worker.js
```

### Terminal 3 — Frontend

```bash
cd client
npm run dev
```

### Terminal 4 — Nginx

Test the configuration:

```bash
nginx -t
```

Start Nginx:

```bash
nginx
```

If Nginx is already running:

```bash
nginx -s reload
```

---

## Local HTTPS Architecture

```text
Browser
   ↓
https://imagify.com
   ↓
Nginx :443
   ├── /api/* → Express :5000
   │
   └── /*     → Vite :5173
```

Open:

```text
https://imagify.com
```

### Important

mkcert is intended for local development.

Do not commit or share:

```text
rootCA-key.pem
imagify-key.pem
```

---

# PWA / Mobile Setup and Testing

Imagify can be installed as a PWA and tested using the production preview build.

## 1. Build the Application

From the client directory:

```bash
npm run build
```

---

## 2. Start the Preview Server

```bash
npm run preview
```

---

## 3. Open the Preview

Open:

```text
http://localhost:4173/
```

---

## 4. Install the PWA

When Chrome recognizes the application as installable, an **Install** option will appear in the browser UI.

Click **Install** and confirm the installation.

---

## 5. Login

Open the installed application and log in.

Login is required for the push-notification functionality.

---

## 6. Enable Notifications

After logging in:

1. Click **Enable Notifications**.
2. Allow browser notification permission.
3. The browser creates a push subscription.
4. The subscription is stored by the backend.

---

## 7. Test Image Processing

Upload an image and start processing.

The worker processes the image in the background.

---

## 8. Test Background Notification

Minimize the installed application while the image is processing.

After processing is completed, the backend sends a push notification.

The service worker receives the push event and displays the notification.

```text
Upload
  ↓
Process
  ↓
Minimize Application
  ↓
Worker Completes Processing
  ↓
Push Notification
  ↓
Browser Notification
```

---

# Chrome Extension Installation

The project includes the **Imagify Screenshot** Chrome Extension.

## 1. Open Chrome Extensions

```text
chrome://extensions
```

---

## 2. Enable Developer Mode

Enable:

```text
Developer mode
```

---

## 3. Load the Extension

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

---

## 4. Pin the Extension

Find:

```text
Imagify Screenshot
```

and pin it to the Chrome toolbar.

---

# Chrome Extension Development

When changing extension code:

```text
Edit Code
   ↓
Save
   ↓
Reload Extension
   ↓
Refresh Webpage
   ↓
Test
```

If `manifest.json` changes, reload the extension from:

```text
chrome://extensions
```

If `content.js` changes, refresh the webpage before testing.

---

# Chrome Extension Debugging

## Popup

Right-click the extension popup and select:

```text
Inspect
```

This opens DevTools for the popup.

---

## Background Service Worker

Open:

```text
chrome://extensions
```

Find **Imagify Screenshot** and inspect its service worker.

---

## Content Script

Open the webpage's DevTools:

```text
Right Click
    ↓
Inspect
    ↓
Console
```

Content-script logs will appear in the webpage's DevTools console.

---

# Security Considerations

Imagify uses several security mechanisms:

- HTTP-only cookies for authentication
- JWT-based authentication
- Google OAuth credential verification
- Protected frontend routes
- Protected backend routes
- Guest identification
- File type validation
- File size validation
- Secure random share tokens
- Expiring share links
- Stripe webhook signature verification
- Environment variables for secrets

Supported image MIME types:

```text
image/jpeg
image/png
image/webp
```

---

# Cloudinary Storage

Cloudinary is used for persistent image storage.

Original and processed images are separated into different folders:

```text
imagify/
├── originals/
└── processed/
    ├── resize/
    ├── compress/
    └── quality/
```

This separation keeps uploaded and processed assets organized and makes it easier to manage different processing operations.

---

# Development Architecture Summary

Imagify combines synchronous API operations with asynchronous background processing.

```text
                         ┌─────────────────┐
                         │     React       │
                         │     Client      │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │     Express     │
                         │      API        │
                         └───────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    ↓            ↓            ↓
               MongoDB      Cloudinary    BullMQ
                                              │
                                              ↓
                                            Redis
                                              │
                                              ↓
                                           Worker
                                              │
                                              ↓
                                            Sharp
                                              │
                                              ↓
                                         Cloudinary
```

The main design separates:

- **Frontend** — user interface and application state
- **Express API** — request handling and business logic
- **MongoDB** — application data
- **Cloudinary** — image storage
- **Redis/BullMQ** — background job management
- **Worker** — asynchronous image processing
- **Stripe** — subscriptions and billing
- **Google OAuth** — authentication
- **Web Push/VAPID** — processing notifications
- **Nginx/mkcert** — local HTTPS
- **Chrome Extension** — screenshot capture
