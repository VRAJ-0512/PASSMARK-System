import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (code: string) => void;
  isActive?: boolean;
}

export function QRScanner({ onScan, isActive = true }: QRScannerProps) {
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const readerId = useMemo(() => `reader-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode;
    let startPromise: Promise<any> | null = null;
    
    if (!isActive) {
      return;
    }

    try {
      html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;
      
      startPromise = html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          if (isMounted) {
            onScanRef.current(decodedText);
          }
        },
        () => {
          
        }
      );

      startPromise.catch((err: any) => {
        console.warn("Scanner initialization warning (permission likely denied):", err);
        if (isMounted) {
          setPermissionStatus(`Camera error: ${err.message || 'Permission denied'}`);
        }
      });
    } catch (err: any) {
      console.warn("Scanner synchronous initialization warning:", err);
      if (isMounted) {
        setPermissionStatus(`Camera error: ${err.message || 'Permission denied'}`);
      }
    }

    return () => {
      isMounted = false;
      
      if (startPromise && html5QrCode) {
        startPromise.then(() => {
          html5QrCode.stop().then(() => {
            try {
              html5QrCode.clear();
            } catch (e) {
              
            }
          }).catch(() => {
            
          });
        }).catch(() => {
          
        });
      }
    };
  }, [readerId, isActive]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden rounded-xl">
      <div id={readerId} className="w-full max-w-md h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />
      
      <div className="absolute bottom-4 flex flex-col items-center gap-2 z-50 w-full px-4">
        {permissionStatus && (
          <span className="text-xs bg-[var(--color-bg-elevated)] text-[var(--color-status-error)] px-3 py-1 rounded-full border border-[var(--color-status-error)] shadow-lg text-center">
            {permissionStatus}
          </span>
        )}
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode) {
              onScanRef.current(manualCode);
              setManualCode('');
            }
          }}
          className="flex w-full max-w-xs gap-2"
        >
          <input 
            type="text" 
            placeholder="Manual ID Entry" 
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-full px-4 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-focus)] shadow-lg"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-xs font-bold rounded-full hover:opacity-90 transition-opacity shadow-lg"
          >
            SUBMIT
          </button>
        </form>
      </div>
    </div>
  );
}
