import { useState, useRef, useCallback } from 'react';
import type { ParsedReceipt } from '../../data/receiptParser';
import { parseReceipt, SAMPLE_RECEIPT_TEXT } from '../../data/receiptParser';

type ScanStage = 'idle' | 'capturing' | 'processing' | 'done' | 'error';

interface Props {
  onScanComplete: (receipt: ParsedReceipt) => void;
  onCancel: () => void;
}

export function ReceiptScanner({ onScanComplete, onCancel }: Props) {
  const [stage, setStage] = useState<ScanStage>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Preprocess image on canvas for better OCR
  const preprocessImage = useCallback((img: HTMLImageElement): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    const ctx = canvas.getContext('2d')!;

    // Scale to reasonable OCR size (max 2000px wide)
    const scale = Math.min(1, 2000 / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Grayscale + contrast enhancement
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      // Increase contrast
      const enhanced = gray < 128 ? Math.max(0, gray * 0.7) : Math.min(255, gray * 1.3 + 30);
      // Sharpen threshold for text
      const final = enhanced < 140 ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = final;
    }
    ctx.putImageData(imgData, 0, 0);

    return canvas.toDataURL('image/png');
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setStage('processing');
    setProgress(0);
    setProgressMsg('Reading image...');
    setError('');

    try {
      // Load image
      const url = URL.createObjectURL(file);
      setImageData(url);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      setProgress(10);
      setProgressMsg('Preprocessing...');

      const processed = preprocessImage(img);

      setProgress(20);
      setProgressMsg('Loading OCR engine...');

      // Dynamic import Tesseract.js to avoid bundling in main chunk
      const Tesseract = await import('tesseract.js');

      setProgress(30);
      setProgressMsg('Recognizing text...');

      const result = await Tesseract.recognize(
        processed || url,
        'eng',
        {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text') {
              setProgress(30 + m.progress * 60);
              setProgressMsg('Reading receipt...');
            }
          },
        }
      );

      setProgress(95);
      setProgressMsg('Parsing items...');

      const parsed = parseReceipt(result.data.text, result.data.confidence / 100);

      setProgress(100);
      setProgressMsg('Done!');
      setStage('done');

      // Small delay so user sees completion
      setTimeout(() => onScanComplete(parsed), 500);
    } catch (err) {
      setStage('error');
      setError(err instanceof Error ? err.message : 'OCR failed');
    }
  }, [preprocessImage, onScanComplete]);

  const handleDemoReceipt = () => {
    setStage('processing');
    setProgress(0);
    setProgressMsg('Parsing demo receipt...');

    // Simulate OCR with sample text
    setTimeout(() => {
      setProgress(50);
      setProgressMsg('Extracting items...');
      setTimeout(() => {
        const parsed = parseReceipt(SAMPLE_RECEIPT_TEXT, 0.92);
        setProgress(100);
        setStage('done');
        setTimeout(() => onScanComplete(parsed), 300);
      }, 500);
    }, 500);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />

      {stage === 'idle' && (
        <>
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📷</span>
            </div>
            <h3 className="text-base font-bold text-forest-600 font-display">Scan Receipt</h3>
            <p className="text-xs text-gray-400 mt-1 mx-8">
              Take a photo of your grocery receipt to automatically extract items and prices
            </p>
          </div>

          <button onClick={() => fileRef.current?.click()}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base bg-forest-600 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <span>📸</span> Take Photo or Choose Image
          </button>

          <div className="relative flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button onClick={handleDemoReceipt}
            className="w-full py-3 rounded-2xl border border-gray-200 font-semibold text-sm text-gray-600 active:scale-[0.98] transition-transform">
            🧪 Try Demo Receipt
          </button>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 mb-1">Tips for best results</p>
            <ul className="text-[10px] text-gray-400 space-y-0.5">
              <li>• Lay the receipt flat on a dark surface</li>
              <li>• Ensure good lighting with no shadows</li>
              <li>• Include the full receipt from store name to total</li>
              <li>• Supported: Kroger, Safeway, Walmart, Target, and 11 more</li>
            </ul>
          </div>

          <button onClick={onCancel} className="w-full py-2 text-sm text-gray-400 underline">Cancel</button>
        </>
      )}

      {stage === 'processing' && (
        <div className="text-center py-12">
          {imageData && (
            <div className="w-32 h-44 mx-auto mb-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <img src={imageData} alt="Receipt" className="w-full h-full object-cover opacity-50" />
            </div>
          )}
          <div className="w-48 h-2 rounded-full bg-gray-100 mx-auto overflow-hidden mb-3">
            <div className="h-full rounded-full bg-forest-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-semibold text-forest-600">{progressMsg}</p>
          <p className="text-xs text-gray-400 mt-1">{progress.toFixed(0)}%</p>
          <div className="mt-4 animate-pulse-slow">
            <span className="text-3xl">🔍</span>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-sm font-semibold text-green-600">Receipt scanned successfully!</p>
        </div>
      )}

      {stage === 'error' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">❌</span>
          </div>
          <p className="text-sm font-semibold text-red-600">Scan failed</p>
          <p className="text-xs text-red-400 mt-1">{error}</p>
          <button onClick={() => { setStage('idle'); setError(''); }}
            className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold text-white bg-forest-600">Try Again</button>
        </div>
      )}
    </div>
  );
}
