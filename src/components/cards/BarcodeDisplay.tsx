import { useEffect, useRef, useState } from 'react';
import bwipjs from 'bwip-js';
import type { BarcodeSymbology } from '../../lib/types';

interface Props {
  value: string;
  height?: number;
  showText?: boolean;
  symbology?: BarcodeSymbology;
}

// Determine best symbology from value if not specified
function inferSymbology(value: string): BarcodeSymbology {
  // Pure 13-digit number → EAN-13
  if (/^\d{13}$/.test(value)) return 'ean13';
  // Pure 12-digit number → UPC-A
  if (/^\d{12}$/.test(value)) return 'upca';
  // Default to Code 128 (handles alphanumeric, most flexible)
  return 'code128';
}

export function BarcodeDisplay({ value, height = 80, showText = true, symbology }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const sym = symbology || inferSymbology(value);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    setError(false);

    try {
      bwipjs.toCanvas(canvasRef.current, {
        bcid: sym,
        text: value,
        scale: 3,
        height: Math.round(height / 3),
        includetext: false,
        textxalign: 'center',
        padding: 2,
      });
    } catch (e) {
      console.warn('Barcode render failed:', e);
      setError(true);
    }
  }, [value, sym, height]);

  if (!value) return null;

  return (
    <div className="flex flex-col items-center">
      {error ? (
        <div className="flex items-center justify-center bg-warm-100 rounded-lg px-4" style={{ height, minWidth: 160 }}>
          <p className="text-[10px] text-red-400 font-medium text-center">Unable to render barcode.<br/>Card number may be invalid.</p>
        </div>
      ) : (
        <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', imageRendering: 'pixelated' }} />
      )}
      {showText && !error && (
        <p className="text-[11px] tracking-[0.25em] mt-1.5 font-mono text-forest-900/60">{value}</p>
      )}
    </div>
  );
}
