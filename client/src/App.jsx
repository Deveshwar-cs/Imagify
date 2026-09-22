import {useEffect, useState} from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";

import Navbar from "./components/Navbar";
import ImageUploader from "./components/ImageUploader";
import BatchProcessingPanel from "./components/BatchProcessingPanel";
import BatchProgress from "./components/BatchProgress";
import NotificationButton from "./components/NotificationButton";

import SharedResults from "./components/SharedResults";

const Home = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [processingBatch, setProcessingBatch] = useState(null);
  const [notificationBatchId, setNotificationBatchId] = useState(null);

  console.log("UPLOADED IMAGES STATE:", uploadedImages);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const batchId = params.get("batch");

    if (batchId) {
      setNotificationBatchId(batchId);
    }
  }, []);

  const handleImagesUploaded = (images) => {
    setUploadedImages(images);
    setProcessingBatch(null);
  };

  const handleProcessingStarted = (batch) => {
    console.log("BATCH RECEIVED BY APP:", batch);

    setProcessingBatch(batch);
  };

  const activeBatchId = processingBatch?.batchId || notificationBatchId;

  console.log("PROCESSING BATCH:", processingBatch);

  console.log("ACTIVE BATCH ID:", activeBatchId);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            Simple. Fast. Powerful.
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            Transform your images
            <span className="block text-slate-500">with Imagify.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            Resize, compress, enhance, and upscale your images with a simple and
            powerful image processing platform.
          </p>
        </section>

        {/* Notifications */}
        <section className="mx-auto mt-8 flex max-w-4xl justify-center">
          <NotificationButton />
        </section>

        {/* Upload */}
        <section className="mx-auto mt-12 max-w-4xl">
          <ImageUploader onUploaded={handleImagesUploaded} />
        </section>

        {/* Batch Processing */}
        {uploadedImages.length > 0 && (
          <section className="mx-auto mt-8 max-w-4xl">
            <BatchProcessingPanel
              images={uploadedImages}
              onProcessingStarted={handleProcessingStarted}
            />
          </section>
        )}

        {/* Batch Progress */}
        {activeBatchId && (
          <section className="mx-auto mt-8 max-w-4xl">
            <BatchProgress batchId={activeBatchId} />
          </section>
        )}

        {/* Batch Started */}
        {processingBatch && (
          <section className="mx-auto mt-8 max-w-4xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  ✓
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Processing started
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {processingBatch.totalImages} image
                    {processingBatch.totalImages > 1 ? "s are" : " is"} being
                    processed in the background.
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    Batch ID: {processingBatch.batchId}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

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
