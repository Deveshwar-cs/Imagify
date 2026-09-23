import {useEffect, useState} from "react";

import {BrowserRouter, Route, Routes} from "react-router-dom";

import Navbar from "./components/Navbar";
import ImageUploader from "./components/ImageUploader";
import BatchProcessingPanel from "./components/BatchProcessingPanel";
import BatchProgress from "./components/BatchProgress";
import NotificationButton from "./components/NotificationButton";
import GoogleLoginButton from "./components/GoogleLoginButton";
import SharedResults from "./components/SharedResults";

const Home = () => {
  // ============================================
  // STATE
  // ============================================

  const [uploadedImages, setUploadedImages] = useState([]);

  const [processingBatch, setProcessingBatch] = useState(null);

  const [notificationBatchId, setNotificationBatchId] = useState(null);

  // processing | completed | failed
  const [batchStatus, setBatchStatus] = useState("processing");

  // ============================================
  // READ BATCH ID FROM URL
  // ============================================

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const batchId = params.get("batch");

    if (batchId) {
      setNotificationBatchId(batchId);
    }
  }, []);

  // ============================================
  // IMAGES UPLOADED
  // ============================================

  const handleImagesUploaded = (images) => {
    setUploadedImages(images);

    // Reset previous processing batch
    setProcessingBatch(null);

    // Reset status
    setBatchStatus("processing");
  };

  // ============================================
  // PROCESSING STARTED
  // ============================================

  const handleProcessingStarted = (batch) => {
    setProcessingBatch(batch);

    // New batch starts in processing state
    setBatchStatus("processing");
  };

  // ============================================
  // BATCH STATUS CHANGED
  // ============================================

  const handleBatchStatusChange = (status) => {
    setBatchStatus(status);
  };

  // ============================================
  // ACTIVE BATCH
  // ============================================

  const activeBatchId = processingBatch?.batchId || notificationBatchId;

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main>
        {/* ============================================
            TOP BAR
        ============================================ */}

        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-end px-4 py-3 sm:px-6 lg:px-8">
            <GoogleLoginButton />
          </div>
        </div>

        {/* ============================================
            HERO
        ============================================ */}

        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.14),_transparent_35%)]" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Powerful image processing
              </div>

              {/* Heading */}

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Transform your images
                <span className="mt-2 block text-slate-400">with Imagify.</span>
              </h1>

              {/* Description */}

              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                Resize, compress, enhance, and upscale your images with a fast
                and simple image processing platform.
              </p>

              {/* Feature Pills */}

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                  Resize
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                  Compress
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                  Enhance
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                  Upscale
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            MAIN CONTENT
        ============================================ */}

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-5xl">
            {/* ========================================
                UPLOAD HEADER
            ======================================== */}

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Upload your images
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Upload up to 10 images and process them in the background.
              </p>
            </div>

            {/* ========================================
                UPLOAD CARD
            ======================================== */}

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <ImageUploader onUploaded={handleImagesUploaded} />
            </div>

            {/* ========================================
                PROCESSING
            ======================================== */}

            {uploadedImages.length > 0 && (
              <div className="mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Choose an operation
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select how you want to process your uploaded images.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <BatchProcessingPanel
                    images={uploadedImages}
                    onProcessingStarted={handleProcessingStarted}
                  />
                </div>
              </div>
            )}

            {/* ========================================
                PROCESSING STATUS
            ======================================== */}

            {processingBatch && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {/* Status Header */}

                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        batchStatus === "completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : batchStatus === "failed"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {batchStatus === "completed"
                        ? "✓"
                        : batchStatus === "failed"
                          ? "!"
                          : "…"}
                    </div>

                    {/* Status Text */}

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {batchStatus === "completed"
                          ? "Processing completed"
                          : batchStatus === "failed"
                            ? "Processing failed"
                            : "Processing started"}
                      </h2>

                      <p className="text-sm text-slate-500">
                        {batchStatus === "completed"
                          ? "Your images have finished processing and are ready."
                          : batchStatus === "failed"
                            ? "Some images could not be processed."
                            : "Your images are being processed in the background."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Batch Information */}

                <div className="grid gap-4 px-6 py-5 sm:grid-cols-3">
                  {/* Images */}

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Images
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {processingBatch.totalImages}
                    </p>
                  </div>

                  {/* Operation */}

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Operation
                    </p>

                    <p className="mt-1 text-xl font-bold capitalize text-slate-900">
                      {processingBatch.operation || "Processing"}
                    </p>
                  </div>

                  {/* Status */}

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        batchStatus === "completed"
                          ? "text-emerald-600"
                          : batchStatus === "failed"
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {batchStatus === "completed"
                        ? "Completed"
                        : batchStatus === "failed"
                          ? "Failed"
                          : "Processing"}
                    </p>
                  </div>
                </div>

                {/* Batch ID */}

                <div className="border-t border-slate-100 px-6 py-4">
                  <p className="text-xs text-slate-400">Batch ID</p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-600">
                    {processingBatch.batchId}
                  </p>
                </div>
              </div>
            )}

            {/* ========================================
                BATCH PROGRESS
            ======================================== */}

            {activeBatchId && (
              <div className="mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Processing progress
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Track the progress of your image processing batch.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <BatchProgress
                    batchId={activeBatchId}
                    onStatusChange={handleBatchStatusChange}
                  />
                </div>
              </div>
            )}

            {/* ========================================
                NOTIFICATIONS
            ======================================== */}

            <div className="mt-10 flex justify-center">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <NotificationButton />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            FOOTER CTA
        ============================================ */}

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Simple image processing, without the complexity.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Upload your images, choose an operation, and let Imagify handle
              the processing in the background.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

// ============================================
// APP ROUTER
// ============================================

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/share/:token" element={<SharedResults />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
