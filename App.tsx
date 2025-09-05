import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Loader } from './components/Loader';
import { AdStyle, ImageData, MediaObjective } from './types';
import { generateAdCreative } from './services/geminiService';

const Header: React.FC = () => (
  <header className="text-center mb-8">
    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white">
      Ad Pro <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Creative Suite</span>
    </h1>
    <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
      Generate stunning, platform-ready ad visuals and copy from your product photos.
    </p>
  </header>
);

const AdStyleSelector: React.FC<{
  selectedStyle: AdStyle;
  onChange: (style: AdStyle) => void;
  disabled: boolean;
}> = ({ selectedStyle, onChange, disabled }) => (
  <div className="w-full">
    <label htmlFor="ad-style" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
      Ad Style
    </label>
    <select
      id="ad-style"
      value={selectedStyle}
      onChange={(e) => onChange(e.target.value as AdStyle)}
      disabled={disabled}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-brand-secondary focus:border-brand-secondary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 disabled:opacity-50"
    >
      {Object.values(AdStyle).map((style) => (
        <option key={style} value={style}>
          {style}
        </option>
      ))}
    </select>
  </div>
);

const MediaObjectiveSelector: React.FC<{
  selectedObjective: MediaObjective;
  onChange: (objective: MediaObjective) => void;
  disabled: boolean;
}> = ({ selectedObjective, onChange, disabled }) => (
  <div className="w-full">
    <label htmlFor="media-objective" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
      Media Objective
    </label>
    <select
      id="media-objective"
      value={selectedObjective}
      onChange={(e) => onChange(e.target.value as MediaObjective)}
      disabled={disabled}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-brand-secondary focus:border-brand-secondary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 disabled:opacity-50"
    >
      {Object.values(MediaObjective).map((objective) => (
        <option key={objective} value={objective}>
          {objective}
        </option>
      ))}
    </select>
  </div>
);

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<ImageData | null>(null);
  const [secondaryPreviewUrl, setSecondaryPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AdStyle>(AdStyle.Minimalist);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showSecondaryUploader, setShowSecondaryUploader] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<MediaObjective>(MediaObjective.InstagramPost);
  const [adCopy, setAdCopy] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("Creating your Ad...");

  const fileToImageData = (file: File): Promise<{ dataUrl: string; imageData: ImageData }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const [header, base64] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1];
        if (mimeType && base64) {
          resolve({ dataUrl: result, imageData: { base64, mimeType } });
        } else {
          reject(new Error("Invalid file format"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
  const clearResults = () => {
    setGeneratedImageUrl(null);
    setAdCopy(null);
    setError(null);
  };

  const handlePrimaryImageSelect = useCallback(async (file: File) => {
    clearResults();
    try {
      const { dataUrl, imageData } = await fileToImageData(file);
      setPreviewUrl(dataUrl);
      setOriginalImage(imageData);
    } catch (err) {
      setError("Could not process the selected file. Please try another image.");
      setOriginalImage(null);
      setPreviewUrl(null);
    }
  }, []);
  
  const handleSecondaryImageSelect = useCallback(async (file: File) => {
    clearResults();
    try {
      const { dataUrl, imageData } = await fileToImageData(file);
      setSecondaryPreviewUrl(dataUrl);
      setSecondaryImage(imageData);
    } catch (err) {
      setError("Could not process the style image. Please try another.");
      setSecondaryImage(null);
      setSecondaryPreviewUrl(null);
    }
  }, []);

  const handleGenerate = async () => {
    if (!originalImage) {
      setError("Please upload a product image first.");
      return;
    }
    setIsLoading(true);
    clearResults();

    try {
      setLoadingMessage("Analyzing images...");
      const { imageUrl, adCopy } = await generateAdCreative(
        originalImage, 
        selectedStyle, 
        selectedObjective,
        secondaryImage
      );
      setGeneratedImageUrl(imageUrl);
      setAdCopy(adCopy);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex items-center justify-center p-4">
      <main className="container mx-auto max-w-5xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-10">
          <Header />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AdStyleSelector selectedStyle={selectedStyle} onChange={setSelectedStyle} disabled={isLoading} />
                <MediaObjectiveSelector selectedObjective={selectedObjective} onChange={setSelectedObjective} disabled={isLoading} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Product Image</label>
                <ImageUploader onImageSelect={handlePrimaryImageSelect} previewUrl={previewUrl} />
              </div>
              
              {showSecondaryUploader ? (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Style Image (Optional)</label>
                  <ImageUploader onImageSelect={handleSecondaryImageSelect} previewUrl={secondaryPreviewUrl} />
                </div>
              ) : (
                <button 
                  onClick={() => setShowSecondaryUploader(true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/></svg>
                  Add Style Image
                </button>
              )}

              <button
                onClick={handleGenerate}
                disabled={!originalImage || isLoading}
                className="w-full text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-dark hover:to-brand-primary focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg text-lg px-5 py-3 text-center transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {isLoading ? loadingMessage : 'Generate Ad Creative'}
              </button>
            </div>
            
            <div className="lg:col-span-3 space-y-4">
                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden shadow-inner">
                  {isLoading && <Loader message={loadingMessage} />}
                  {error && (
                    <div className="p-4 text-center text-red-500">
                      <p className="font-semibold">Generation Failed</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                  {!isLoading && !error && generatedImageUrl && (
                    <>
                      <img src={generatedImageUrl} alt="Generated Ad" className="w-full h-full object-contain" />
                      <a
                        href={generatedImageUrl}
                        download="generated-ad.png"
                        className="absolute bottom-4 right-4 bg-white text-gray-800 py-2 px-4 rounded-lg shadow-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                      >
                        Download
                      </a>
                    </>
                  )}
                  {!isLoading && !error && !generatedImageUrl && (
                     <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                        <p className="font-semibold">Your generated ad will appear here.</p>
                        <p className="text-sm">Select your options and click "Generate" to start.</p>
                     </div>
                  )}
                </div>

                <div className="w-full">
                  <label htmlFor="ad-copy" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Generated Ad Copy</label>
                  <textarea
                    id="ad-copy"
                    rows={6}
                    readOnly
                    value={adCopy || ""}
                    placeholder="Your ad copy will appear here..."
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;