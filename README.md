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
- Loading, success, and error states
- Responsive UI

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

### Infrastructure

- Nginx
- mkcert
- Local HTTPS
- Custom local domain: `imagify.com`

## Project Structure

```text
Imagify/
├── client/
│   └── React frontend
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── routes/
│   └── uploads/
│
├── nginx/
│   ├── servers/
│   └── ssl/
│
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
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

### 4. Configure environment variables

Create:

```text
server/.env
```

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

### 5. Start the backend

From the `server` directory:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

### 6. Start the frontend

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

## Technical Decisions

### Sharp

Sharp is used for image processing because it provides efficient image transformations through a Node.js API and supports formats such as JPEG, PNG, and WEBP.

### Multer

Multer handles multipart image uploads and provides file type and file size validation before processing.

### MongoDB

MongoDB stores image metadata and information about processed versions rather than storing the image binary data directly in the database.

### Local File Storage

For this assignment, uploaded and processed images are stored locally in the `server/uploads` directory. The architecture can later be extended to object storage such as Cloudinary or S3.

### Nginx + HTTPS

Nginx is used as a reverse proxy, while mkcert provides a locally trusted HTTPS certificate for the custom development domain:

```text
https://imagify.com
```

### React Local State

The frontend currently uses React state and props for application state. Redux was intentionally avoided because the current application does not have enough shared global state to justify the additional complexity.

## Development

Start the frontend and backend separately during development.

Frontend:

```bash
cd client
npm run dev
```

Backend:

```bash
cd server
npm run dev
```

## Future Improvements

Planned improvements for the next stages of the project include:

- PWA support
- Background image processing with queues
- Push notifications
- Temporary image sharing
- User authentication
- Usage limits
- Stripe subscriptions
- Public image APIs
- Chrome screenshot extension

## Author

Deveshwar
