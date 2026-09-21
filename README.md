# Imagify

Imagify is a modern image-processing platform that lets users upload images and perform common optimization and enhancement operations through a SaaS-style interface.

## Features

- Upload JPG, PNG, and WEBP images
- 10 MB upload limit
- Resize with custom dimensions and aspect-ratio preservation
- Compress with low, medium, and high levels
- Improve image quality with sharpening
- Upscale images by 2× or 3×
- Original vs processed preview
- Image dimensions and file size
- Download processed images
- Cloudinary image storage
- Loading, success, and error states
- Responsive UI
- Local HTTPS development with `https://imagify.com`

## Tech Stack

**Frontend**

- React
- Vite
- Tailwind CSS
- Axios

**Backend**

- Node.js
- Express.js
- MongoDB / Mongoose
- Sharp
- Multer
- Cloudinary

**Infrastructure**

- Nginx
- mkcert
- Local HTTPS

## Project Structure

```text
Imagify/
├── client/
│   └── src/
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── services/
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
MongoDB metadata + URL
  ↓
Select operation
  ↓
Download image temporarily
  ↓
Sharp processing
  ↓
Cloudinary
  ↓
MongoDB processed-image metadata
  ↓
Preview / Download
```

Temporary processing files are removed after each operation.

## API

| Operation | Endpoint                             |
| --------- | ------------------------------------ |
| Upload    | `POST /api/images/upload`            |
| Resize    | `POST /api/images/:imageId/resize`   |
| Compress  | `POST /api/images/:imageId/compress` |
| Quality   | `POST /api/images/:imageId/quality`  |
| Upscale   | `POST /api/images/:imageId/upscale`  |

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

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. Frontend environment

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files or API secrets.

### 5. Start the application

Backend:

```bash
cd server
npm run dev
```

Frontend:

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

Edit `/etc/hosts`:

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

Keep `nginx/ssl/` in `.gitignore`.

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

Used for resizing, compression, sharpening, upscaling, and metadata extraction.

### Multer

Uses `memoryStorage()` for temporary upload handling and validates file type and size.

### Cloudinary

Stores original and processed images. MongoDB stores image metadata and Cloudinary URLs.

### MongoDB

Stores image information and processed-image records instead of image binaries.

### Image Service

`server/src/services/image.service.js` contains reusable temporary-file and Cloudinary helpers.

### React State

React local state and props are used instead of Redux because the current application does not require complex global state.

### Nginx + mkcert

Nginx provides reverse proxying and HTTP → HTTPS redirection. mkcert provides locally trusted HTTPS certificates.

## Deployment

Current deployment architecture:

```text
Frontend → Vercel
Backend  → Render
Database → MongoDB Atlas
Images   → Cloudinary
```

Production environment variables must be configured on the respective platforms.

## Current Status

### Completed

- Image upload and validation
- Resize
- Compression
- Quality enhancement
- 2× / 3× upscaling
- Original/processed preview
- Metadata display
- Download
- Cloudinary storage
- MongoDB metadata
- Responsive UI
- Production deployment
- Local HTTPS environment

### Planned

- PWA
- Multiple image processing
- Background queues
- Push notifications
- Temporary image sharing
- Google Login
- Usage limits
- Stripe subscriptions
- Public image API
- Chrome screenshot extension

## Repository

GitHub: https://github.com/Deveshwar-cs/Imagify

## Author

Deveshwar
