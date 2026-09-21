import Navbar from "./components/Navbar";
import ImageUploader from "./components/ImageUploader";
import {useState} from "react";
import ResizePanel from "./components/ResizePanel";
import ProcessingResult from "./components/ProcessingResult";
import CompressPanel from "./components/CompressPanel";
import QualityPanel from "./components/QualityPanel";
import UpscalePanel from "./components/UpscalePanel";
import ActionSelector from "./components/ActionSelector";

const App = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
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

        <section className="mx-auto mt-12 max-w-4xl">
          <ImageUploader onUploaded={setUploadedImage} />
        </section>
        {uploadedImage && (
          <section className="mx-auto mt-8 max-w-4xl">
            <ActionSelector
              selectedAction={selectedAction}
              onSelect={(action) => {
                setSelectedAction(action);
                setProcessingResult(null);
              }}
            />
          </section>
        )}

        {uploadedImage && selectedAction === "resize" && (
          <section className="mx-auto mt-8 max-w-4xl">
            <ResizePanel
              image={uploadedImage}
              onProcessed={setProcessingResult}
            />
          </section>
        )}

        {uploadedImage && selectedAction === "compress" && (
          <section className="mx-auto mt-8 max-w-4xl">
            <CompressPanel
              image={uploadedImage}
              onProcessed={setProcessingResult}
            />
          </section>
        )}
        {uploadedImage && selectedAction === "quality" && (
          <section className="mx-auto mt-8 max-w-4xl">
            <QualityPanel
              image={uploadedImage}
              onProcessed={setProcessingResult}
            />
          </section>
        )}
        {uploadedImage && selectedAction === "upscale" && (
          <section className="mx-auto mt-8 max-w-4xl">
            <UpscalePanel
              image={uploadedImage}
              onProcessed={setProcessingResult}
            />
          </section>
        )}
        {processingResult && (
          <section className="mx-auto mt-8 max-w-4xl">
            <ProcessingResult result={processingResult} />
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
