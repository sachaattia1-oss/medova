import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Set worker source - use legacy worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

interface PdfThumbnailProps {
  pdfUrl: string;
  className?: string;
}

const PdfThumbnail = ({ pdfUrl, className = "" }: PdfThumbnailProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl || !canvasRef.current) return;

      try {
        setLoading(true);
        setError(false);

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Calculate scale to fit the canvas
        const containerWidth = canvas.parentElement?.clientWidth || 300;
        const containerHeight = canvas.parentElement?.clientHeight || 200;
        
        const viewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY) * 2; // 2x for better quality

        const scaledViewport = page.getViewport({ scale });
        
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        setLoading(false);
      } catch (err) {
        console.error("Error loading PDF thumbnail:", err);
        setError(true);
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  if (error) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
      />
    </div>
  );
};

export default PdfThumbnail;
