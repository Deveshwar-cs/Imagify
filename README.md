# Imagify

Imagify is a modern image processing platform that allows users to upload images and perform common optimization and enhancement operations through a simple SaaS-style interface.

## Features

- Upload JPG, PNG, and WEBP images
- Maximum upload size: 10 MB
- Resize images with custom width and height
- Maintain image aspect ratio
- Compress images with selectable compression levels
- Improve image quality using sharpening
- Upscale images by 2× or 3×
- Preview original and processed images
- Display image dimensions and file size
- Download processed images
- Cloudinary-based image storage
- Loading, success, and error states
- Responsive SaaS-style UI
- Local HTTPS development environment

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Sharp
- Multer
- Cloudinary

### Infrastructure

- Nginx
- mkcert
- Local HTTPS
- Custom local domain: `imagify.com`

## Project Structure

```text
Imagify/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js
│   │   │   ├── database.js
│   │   │   └── multer.js
│   │   │
│   │   ├── controllers/
│   │   │   └── image.controller.js
│   │   │
│   │   ├── models/
│   │   │   └── image.model.js
│   │   │
│   │   ├── routes/
│   │   │   └── image.routes.js
│   │   │
│   │   ├── services/
│   │   │   └── image.service.js
│   │   │
│   │   └── server.js
│   │
│   └── package.json
│
├── nginx/
│   ├── servers/
│   └── ssl/
│
└── README.md
```

## Image Processing Flow

Imagify uses Cloudinary for persistent image storage and Sharp for image processing.

The general processing flow is:

```text
User uploads image
        ↓
Multer memoryStorage
        ↓
Cloudinary
        ↓
MongoDB stores image metadata + Cloudinary URL
        ↓
User selects processing operation
        ↓
Download original image temporarily
        ↓
Sharp processes the image
        ↓
Upload processed image to Cloudinary
        ↓
MongoDB stores processed image metadata + URL
        ↓
Frontend displays processed image
```

Temporary files created during processing are removed after the operation completes.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Deveshwar-cs/Imagify.git
cd Imagify
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure backend environment variables

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
```

Do not commit `.env` files or expose your Cloudinary API secret.

### 5. Configure frontend environment variables

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Start the backend

From the `server` directory:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

### 7. Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Image Processing API

| Operation       | Endpoint                             |
| --------------- | ------------------------------------ |
| Upload          | `POST /api/images/upload`            |
| Resize          | `POST /api/images/:imageId/resize`   |
| Compress        | `POST /api/images/:imageId/compress` |
| Improve Quality | `POST /api/images/:imageId/quality`  |
| Upscale         | `POST /api/images/:imageId/upscale`  |

## API Operations

### Upload

Accepts:

- JPEG
- PNG
- WEBP

Maximum file size:

```text
10 MB
```

Uploaded images are stored in Cloudinary under:

```text
imagify/originals/
```

MongoDB stores the image metadata and Cloudinary URL.

### Resize

Allows users to provide a custom width, height, or both while maintaining the image's aspect ratio.

Processed images are stored under:

```text
imagify/processed/resize/
```

### Compress

Supports three compression levels:

```text
low
medium
high
```

Processed images are stored under:

```text
imagify/processed/compress/
```

### Improve Quality

Uses Sharp sharpening to enhance image details.

Processed images are stored under:

```text
imagify/processed/quality/
```

### Upscale

Supports:

```text
2×
3×
```

Processed images are stored under:

```text
imagify/processed/upscale/
```

## Technical Decisions

### Sharp

Sharp is used for image processing because it provides efficient image transformations through a Node.js API and supports formats such as JPEG, PNG, and WEBP.

Sharp handles:

- Resizing
- Compression
- Sharpening
- Upscaling
- Image metadata extraction

### Multer

Multer handles multipart image uploads and validates:

- File type
- File size

Imagify uses Multer's `memoryStorage()` so uploaded files are held in memory temporarily instead of being stored in the server's filesystem.

### Cloudinary

Cloudinary is used as the persistent image storage layer.

Original and processed images are uploaded to Cloudinary, while MongoDB stores:

- File metadata
- Dimensions
- File size
- MIME type
- Cloudinary public ID
- Cloudinary URL

This avoids depending on persistent local filesystem storage in deployed environments.

### MongoDB

MongoDB stores image metadata and information about processed versions rather than storing image binary data directly in the database.

A stored image contains information such as:

```text
originalName
fileName
mimeType
size
width
height
url
processedImages
```

### Image Processing Service

Image processing helpers are separated into:

```text
server/src/services/image.service.js
```

The service handles common operations such as:

- Downloading Cloudinary images temporarily
- Uploading processed files to Cloudinary
- Creating temporary file paths
- Cleaning up temporary files

This keeps Cloudinary and temporary-file handling reusable across processing operations.

### React Local State

The frontend currently uses React state and props for application state.

Redux was intentionally avoided because the current application does not have enough shared global state to justify the additional complexity.

### Nginx + HTTPS

Nginx is used as a reverse proxy, while mkcert provides a locally trusted HTTPS certificate for the custom development domain:

```text
https://imagify.com
```

HTTP requests are redirected to HTTPS during local development.

## Environment Variables

### Backend

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

Environment files containing secrets should never be committed to Git.

## Development

Start the frontend and backend separately during development.

### Frontend

```bash
cd client
npm run dev
```

### Backend

```bash
cd server
npm run dev
```

## Local HTTPS

Imagify can be accessed locally through the custom domain:

```text
https://imagify.com
```

The local HTTPS setup uses:

- `/etc/hosts`
- Nginx
- mkcert

The generated SSL certificates are intentionally excluded from Git.

## Deployment

The project can be deployed using:

- Vercel for the frontend
- Render or another Node.js hosting platform for the backend
- MongoDB Atlas for the database
- Cloudinary for image storage

Production environment variables must be configured on the respective hosting platforms.

## Current Status

Task 1 currently includes:

- Image upload
- Image validation
- Resize
- Compression
- Quality enhancement
- 2× / 3× upscaling
- Original/processed preview
- Image metadata
- Download functionality
- Cloudinary image storage
- MongoDB metadata storage
- Responsive frontend
- Local HTTPS development setup

## Future Improvements

Planned improvements for the next stages of the project include:

- PWA support
- Multiple image processing
- Background image processing with queues
- Push notifications
- Temporary image sharing
- User authentication
- Google Login
- Usage limits
- Stripe subscriptions
- Public image APIs
- Chrome screenshot extension

## Repository

GitHub:

```text
https://github.com/Deveshwar-cs/Imagify
```

## Author

Deveshwar
