import {useState} from "react";
import useImageShare from "../hooks/upload/useImageShare";
import useImageUpload from "../hooks/upload/useImageUpload";
import useImageProcessing from "../hooks/upload/useImageProcessing";
import UploadHeader from "../components/upload/UploadHeader";
import UploadDropzone from "../components/upload/UploadDropzone";
import SelectedFiles from "../components/upload/SelectedFiles";
import UploadedImages from "../components/upload/UploadedImages";
import ProcessingOptions from "../components/upload/ProcessingOptions";
import ResizePanel from "../components/upload/ResizePanel";
import CompressPanel from "../components/upload/CompressPanel";
import QualityPanel from "../components/upload/QualityPanel";
import UpscalePanel from "../components/upload/UpscalePanel";
import ProcessingError from "../components/upload/ProcessingError";
import ProcessingProgress from "../components/upload/ProcessingProgress";
const Upload = () => {
  const {
    files,
    previews,
    uploadedImages,
    selectedImages,
    loading,
    handleFileChange,
    removeFile,
    handleUpload,
    toggleImageSelection,
    handleSelectAll,
    handleClearSelection,
  } = useImageUpload();

  const {
    batchId,
    batchStatus,
    progress,
    processing,
    processingError,
    resizeOptions,
    setResizeOptions,
    compressOptions,
    setCompressOptions,
    upscaleOptions,
    setUpscaleOptions,
    handleResize,
    handleCompress,
    handleQuality,
    handleUpscale,
  } = useImageProcessing();

  const {
    shareUrl,
    shareLoading,
    shareError,
    copied,
    handleShare,
    handleCopyShareUrl,
  } = useImageShare(batchId, batchStatus);

  const [selectedOperation, setSelectedOperation] = useState(null);
  const [error, setError] = useState("");

  // ============================================================
  // Format file size
  // ============================================================

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ============================================================
          HEADER
      ============================================================ */}

      <UploadHeader />

      {/* ============================================================
          MAIN
      ============================================================ */}

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page Heading */}

        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Image Workspace
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Upload your images
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Upload your images to Imagify and prepare them for resizing,
            compression, quality enhancement, and upscaling.
          </p>
        </div>

        {/* ============================================================
            UPLOAD CARD
        ============================================================ */}

        <UploadDropzone onFileChange={handleFileChange} error={error}>
          <SelectedFiles
            previews={previews}
            files={files}
            onRemove={removeFile}
            onUpload={handleUpload}
            loading={loading}
          />
        </UploadDropzone>

        <UploadedImages
          uploadedImages={uploadedImages}
          selectedImages={selectedImages}
          onToggleSelection={toggleImageSelection}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
        />

        <ProcessingOptions
          selectedImages={selectedImages}
          selectedOperation={selectedOperation}
          onSelectOperation={setSelectedOperation}
          onClearError={() => {
            setError("");
            // processingError is cleared inside the processing hook
            // when a new operation starts.
          }}
        />

        {selectedOperation === "resize" && (
          <ResizePanel
            resizeOptions={resizeOptions}
            setResizeOptions={setResizeOptions}
            onResize={handleResize}
            selectedImages={selectedImages}
            processing={processing}
          />
        )}

        {selectedOperation === "compress" && (
          <CompressPanel
            compressOptions={compressOptions}
            setCompressOptions={setCompressOptions}
            onCompress={handleCompress}
            selectedImages={selectedImages}
            processing={processing}
          />
        )}

        {selectedOperation === "quality" && (
          <QualityPanel
            onQuality={handleQuality}
            selectedImages={selectedImages}
            processing={processing}
          />
        )}

        {selectedOperation === "upscale" && (
          <UpscalePanel
            upscaleOptions={upscaleOptions}
            setUpscaleOptions={setUpscaleOptions}
            onUpscale={handleUpscale}
            selectedImages={selectedImages}
            processing={processing}
          />
        )}
        {/* ============================================================
            PROCESSING ERROR
        ============================================================ */}

        <ProcessingError message={processingError} />

        {/* ============================================================
            PROCESSING PROGRESS
        ============================================================ */}

        <ProcessingProgress
          processing={processing}
          progress={progress}
          batchStatus={batchStatus}
        />

        {/* ============================================================
            PROCESSED IMAGES
        ============================================================ */}

        {batchStatus?.status === "completed" && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Results Header */}

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Processed Images
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your processed images are ready to download and share.
                </p>
              </div>

              {/* Share Whole Batch */}

              <button
                type="button"
                onClick={handleShare}
                disabled={shareLoading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {shareLoading ? "Creating share link..." : "Share Results"}
              </button>
            </div>

            {/* Share Error */}

            {shareError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {shareError}
              </div>
            )}

            {/* Share URL */}

            {shareUrl && (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Share your results
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Anyone with this temporary link can view your processed
                    images.
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleCopyShareUrl}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  This link will expire after 1 hour.
                </p>
              </div>
            )}

            {/* Images */}

            <div className="grid gap-6 md:grid-cols-2">
              {batchStatus.images.map((image) => {
                const processedImages = image.processedImages || [];

                const processedImage =
                  processedImages[processedImages.length - 1];

                if (!processedImage) {
                  return null;
                }

                return (
                  <div
                    key={image._id || image.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    <div className="grid grid-cols-2 gap-3 p-4">
                      {/* Original */}

                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          Original
                        </p>

                        <div className="overflow-hidden rounded-xl bg-white">
                          <img
                            src={image.url}
                            alt={image.originalName}
                            className="h-48 w-full object-contain"
                          />
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p>Size: {formatFileSize(image.size)}</p>

                          <p>
                            Dimensions: {image.width} × {image.height}
                          </p>
                        </div>
                      </div>

                      {/* Processed */}

                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          Processed
                        </p>

                        <div className="overflow-hidden rounded-xl bg-white">
                          <img
                            src={processedImage.url}
                            alt={`Processed ${image.originalName}`}
                            className="h-48 w-full object-contain"
                          />
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p>Size: {formatFileSize(processedImage.size)}</p>

                          <p>
                            Dimensions: {processedImage.width} ×{" "}
                            {processedImage.height}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-white p-4">
                      <a
                        href={processedImage.url}
                        download={processedImage.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Imagify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Upload;
