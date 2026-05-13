import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onScanError, isOpen }) => {
    const scannerRef = useRef(null);

    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (error) {
            console.error("Audio beep failed", error);
        }
    };

    useEffect(() => {
        let html5QrcodeScanner;

        if (isOpen) {
            const timer = setTimeout(() => {
                html5QrcodeScanner = new Html5QrcodeScanner(
                    "reader",
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.0,
                        showZoomSliderIfSupported: true,
                        defaultZoomValueIfSupported: 2
                    },
                    false
                );

                html5QrcodeScanner.render(
                    (decodedText, decodedResult) => {
                        playBeep();
                        onScanSuccess(decodedText, decodedResult);
                        html5QrcodeScanner.clear();
                    },
                    onScanError
                );
            }, 300);

            return () => {
                clearTimeout(timer);
                if (html5QrcodeScanner) {
                    html5QrcodeScanner.clear().catch(error => {
                        console.error("Failed to clear html5QrcodeScanner. ", error);
                    });
                }
            };
        }
    }, [isOpen, onScanSuccess, onScanError]);

    return (
        <div className="w-full">
            <div id="reader" className="overflow-hidden rounded-2xl border-2 border-secondary-100 dark:border-secondary-800 bg-black shadow-inner min-h-[300px]"></div>
            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                <p className="text-xs font-bold text-primary-600 text-center">
                    Center the barcode within the box to scan. Ensure good lighting.
                </p>
            </div>
        </div>
    );
};

export default BarcodeScanner;
