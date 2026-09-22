# Imagify

Imagify is a modern image-processing platform that lets users upload images and perform common optimization and enhancement operations through a SaaS-style interface.

## Features

- Upload JPG, PNG, and WEBP images
- Multiple image upload
- 10 MB upload limit per image
- Resize with custom dimensions and aspect-ratio preservation
- Compress with low, medium, and high levels
- Improve image quality with sharpening
- Upscale images by 2× or 3×
- Original vs processed preview
- Image dimensions and file size
- Download processed images
- Cloudinary image storage
- Background image processing with BullMQ
- Redis-backed job queue
- Batch processing with progress tracking
- Push notifications when processing completes
- Progressive Web App (PWA)
- Temporary image sharing
- Unique share tokens
- One-hour share-link expiration
- Server-side expiration validation
- Secure server-side image proxy for shared images
- Automatic cleanup of expired share records with MongoDB TTL
- Loading, success, and error states
- Responsive SaaS-style UI
- Local HTTPS development with `https://imagify.com`

## Tech Stack

**Frontend**

- React
- Vite
- Tailwind CSS
- Axios
- React Router
- vite-plugin-pwa

**Backend**

- Node.js
- Express.js
- MongoDB / Mongoose
- Sharp
- Multer
- Cloudinary
- Redis
- BullMQ
- Web Push

**Infrastructure**

- Nginx
- mkcert
- Local HTTPS
- Vercel
- Render
- MongoDB Atlas
- Cloudinary

## Project Structure

```text
Imagify/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── ...
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── workers/
│       └── server.js
├── nginx/
│   ├── servers/
│   └── ssl/
└── README.md
```

## Image Processing Flow

```text
Upload
  ↓
Multer memoryStorage
  ↓
Cloudinary
  ↓
MongoDB image metadata
  ↓
Create processing batch
  ↓
BullMQ queue
  ↓
Redis
  ↓
Background worker
  ↓
Download image temporarily
  ↓
Sharp processing
  ↓
Cloudinary
  ↓
MongoDB processed-image metadata
  ↓
Batch progress update
  ↓
Preview / Download
```

Temporary processing files are removed after each operation.

## Supported Operations

| Operation | Description                               |
| --------- | ----------------------------------------- |
| Resize    | Resize images using custom dimensions     |
| Compress  | Reduce image file size                    |
| Quality   | Improve image appearance using sharpening |
| Upscale   | Increase image dimensions by 2× or 3×     |

## API

### Image Processing

| Operation | Endpoint                             |
| --------- | ------------------------------------ |
| Upload    | `POST /api/images/upload`            |
| Resize    | `POST /api/images/:imageId/resize`   |
| Compress  | `POST /api/images/:imageId/compress` |
| Quality   | `POST /api/images/:imageId/quality`  |
| Upscale   | `POST /api/images/:imageId/upscale`  |

### Batch Processing

| Operation              | Endpoint                           |
| ---------------------- | ---------------------------------- |
| Start processing batch | `POST /api/images/process`         |
| Get batch progress     | `GET /api/images/batches/:batchId` |

Image processing jobs are placed into a BullMQ queue backed by Redis and processed asynchronously by a worker.

### Temporary Image Sharing

| Operation                  | Endpoint                                          |
| -------------------------- | ------------------------------------------------- |
| Create share link          | `POST /api/images/share`                          |
| Get shared results         | `GET /api/images/share/:token`                    |
| Get shared processed image | `GET /api/images/share/:token/processed/:imageId` |

## Temporary Image Sharing

Imagify allows users to temporarily share completed image-processing results without requiring the recipient to log in.

### Sharing Flow

```text
Process Images
      ↓
Processing Completed
      ↓
Share Results
      ↓
Generate Secure Random Token
      ↓
Create Share Record
      ↓
Share URL
      ↓
Recipient Opens URL
      ↓
View Processed Results
```

### Share Token

A cryptographically secure random token is generated using Node.js `crypto`:

```js
crypto.randomBytes(32).toString("hex");
```

The token provides a high-entropy URL that is difficult to guess.

### Expiration

Each share record receives an expiration time one hour after creation:

```js
const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
```

The server checks the expiration on every shared-resource request.

Expired links return:

```text
410 Gone
```

with an appropriate expiration message.

### Secure Image Access

Cloudinary URLs are not exposed through the public sharing API.

Instead, shared images are requested through an Imagify server endpoint:

```text
/api/images/share/:token/processed/:imageId
```

The server:

1. Validates the share token.
2. Checks whether the share link has expired.
3. Finds the associated processing batch.
4. Verifies that the requested image belongs to the shared batch.
5. Fetches the processed image from Cloudinary.
6. Sends the image through the Imagify server.

```text
Browser
   ↓
Imagify Share Image Endpoint
   ↓
Validate Token
   ↓
Check Expiration
   ↓
Validate Image Ownership
   ↓
Cloudinary
   ↓
Imagify Server
   ↓
Browser
```

This prevents the public share API from exposing direct Cloudinary URLs.

### MongoDB TTL Cleanup

Share records also use a MongoDB TTL index:

```js
shareSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});
```

The TTL index automatically removes expired share records from MongoDB.

TTL is used for cleanup, while the server-side `expiresAt` check remains responsible for enforcing access expiration immediately.

## Background Processing

Image processing is handled asynchronously using Redis and BullMQ.

Instead of processing every image during the HTTP request:

```text
HTTP Request
     ↓
Process Image
     ↓
HTTP Response
```

Imagify uses:

```text
HTTP Request
     ↓
Create Processing Batch
     ↓
Add Jobs to BullMQ
     ↓
Return Batch ID
     ↓
Worker Processes Images
     ↓
Update Batch Progress
```

This allows the application to process multiple images without keeping the HTTP request open.

## Batch Processing

Each processing request creates a `ProcessingBatch` document containing:

- Processing status
- Image IDs
- Total image count
- Completed image count
- Failed image count
- Operation
- Processing options

Example lifecycle:

```text
pending
   ↓
processing
   ↓
completed
```

If processing fails, the batch can enter:

```text
failed
```

The frontend periodically requests batch status to display processing progress.

## Push Notifications

Imagify supports browser push notifications using Web Push.

When image processing completes, the backend can send a notification to subscribed browsers.

The notification contains information such as:

- Processing completion
- Number of processed images
- Navigation URL

The service worker receives the push event and displays the browser notification.

## Progressive Web App

Imagify is configured as a Progressive Web App using `vite-plugin-pwa`.

The PWA provides:

- Web app manifest
- Installable application experience
- Service worker
- Automatic updates
- Asset precaching
- Push notification support

The service worker also handles notification clicks and opens the relevant Imagify page.

## Local Setup

### 1. Clone

```bash
git clone https://github.com/Deveshwar-cs/Imagify.git
cd Imagify
```

### 2. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 3. Backend environment

Create:

```text
server/.env
```

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

CLIENT_URL=http://localhost:5173
```

If Redis is configured locally:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Never commit `.env` files or API secrets.

### 4. Frontend environment

Create:

```text
client/.env
```

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files or API secrets.

### 5. Start Redis

Make sure Redis is running locally before using background processing:

```bash
redis-server
```

### 6. Start the backend

```bash
cd server
npm run dev
```

### 7. Start the frontend

```bash
cd client
npm run dev
```

Default URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Task 2 — Local Domain & HTTPS

Task 2 provides a production-like HTTPS environment locally.

### 1. Configure local domain

Edit:

```bash
sudo nano /etc/hosts
```

Add:

```text
127.0.0.1 imagify.com
```

Verify:

```bash
ping -c 1 imagify.com
```

### 2. Install Nginx

```bash
brew install nginx
```

Create the server configuration directory:

```bash
mkdir -p /opt/homebrew/etc/nginx/servers
```

In:

```text
/opt/homebrew/etc/nginx/nginx.conf
```

make sure the `http` block contains:

```nginx
include servers/*;
```

### 3. Install mkcert

```bash
brew install mkcert
mkcert -install
```

### 4. Generate local SSL certificate

From the project root:

```bash
mkdir -p nginx/ssl

mkcert \
  -key-file nginx/ssl/imagify-key.pem \
  -cert-file nginx/ssl/imagify.pem \
  imagify.com localhost 127.0.0.1
```

Keep:

```text
nginx/ssl/
```

in `.gitignore`.

### 5. Configure Nginx

Create:

```text
/opt/homebrew/etc/nginx/servers/imagify.conf
```

Add:

```nginx
server {
    listen 80;
    server_name imagify.com;

    return 301 https://imagify.com$request_uri;
}

server {
    listen 443 ssl;
    server_name imagify.com;

    ssl_certificate /Users/deveshwarthakur/Desktop/Office/Imagify/nginx/ssl/imagify.pem;
    ssl_certificate_key /Users/deveshwarthakur/Desktop/Office/Imagify/nginx/ssl/imagify-key.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> Update the certificate paths if the project is located somewhere else.

### 6. Test and start Nginx

```bash
nginx -t
```

If successful:

```bash
brew services start nginx
```

Start the React application:

```bash
cd client
npm run dev
```

Now open:

```text
https://imagify.com
```

HTTP requests to:

```text
http://imagify.com
```

are redirected to HTTPS.

### Task 2 Architecture

```text
Browser
   ↓
https://imagify.com
   ↓
/etc/hosts
   ↓
127.0.0.1
   ↓
Nginx :443
   ↓
SSL / HTTPS
   ↓
Reverse Proxy
   ↓
React/Vite :5173
```

## Technical Decisions

### Sharp

Used for:

- Resizing
- Compression
- Sharpening
- Upscaling
- Image metadata extraction

### Multer

Uses `memoryStorage()` for temporary upload handling and validates:

- File type
- File size

### Cloudinary

Stores original and processed images.

MongoDB stores image metadata and references to Cloudinary resources.

### MongoDB

Stores:

- Image metadata
- Processed-image metadata
- Processing batches
- Share records
- Push subscriptions

### Redis

Redis is used as the backing data store for the BullMQ job queue.

### BullMQ

BullMQ manages asynchronous image-processing jobs.

Each image can be processed as an independent background job while the frontend tracks the overall batch progress.

### Image Service

`server/src/services/image.service.js` contains reusable temporary-file and Cloudinary helpers.

Temporary processing files are removed after each operation.

### React State

React local state and props are used instead of Redux because the current application does not require complex global state.

### React Router

React Router is used to provide separate application routes, including temporary shared-result URLs:

```text
/
/share/:token
```

### Nginx + mkcert

Nginx provides:

- Reverse proxying
- HTTP → HTTPS redirection
- Local HTTPS access

mkcert provides locally trusted development certificates.

## Deployment

Current deployment architecture:

```text
Frontend → Vercel
Backend  → Render
Database → MongoDB Atlas
Images   → Cloudinary
```

Production environment variables must be configured on the respective platforms.

For production sharing, `CLIENT_URL` should point to the deployed frontend.

## Current Status

### Completed

- Image upload and validation
- Multiple image upload
- Resize
- Compression
- Quality enhancement
- 2× / 3× upscaling
- Original/processed preview
- Metadata display
- Download
- Cloudinary storage
- MongoDB metadata
- Redis
- BullMQ background processing
- Batch processing
- Batch progress tracking
- Push notifications
- Progressive Web App
- Temporary image sharing
- Secure random share tokens
- One-hour share expiration
- Server-side expiration validation
- Secure processed-image proxy
- MongoDB TTL cleanup for expired share records
- Responsive UI
- Production deployment
- Local HTTPS environment

### Planned

- Google Login
- Usage limits
- Stripe subscriptions
- Public image API
- Chrome screenshot extension

## Repository

GitHub: https://github.com/Deveshwar-cs/Imagify

## Author

Deveshwar
