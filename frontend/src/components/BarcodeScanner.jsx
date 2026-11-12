import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, CheckCircle2, RefreshCw, ScanLine, Keyboard, AlertCircle } from 'lucide-react';

const SCAN_REGION_ID = 'stocksaathi-barcode-reader';
const RETAIL_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];
const FALLBACK_FORMATS = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.ITF
];

const BarcodeScanner = ({ onScanSuccess, onScanError, isOpen }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const scannerRef = useRef(null);
    const detectorRef = useRef(null);
    const rafRef = useRef(0);
    const scanBusyRef = useRef(false);
    const activeRef = useRef(false);
    const generationRef = useRef(0);
    const successRef = useRef(onScanSuccess);
    const errorRef = useRef(onScanError);

    const [status, setStatus] = useState('starting');
    const [errorMessage, setErrorMessage] = useState('');
    const [cameras, setCameras] = useState([]);
    const [cameraId, setCameraId] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [usingNativeScanner, setUsingNativeScanner] = useState(false);

    useEffect(() => { successRef.current = onScanSuccess; }, [onScanSuccess]);
    useEffect(() => { errorRef.current = onScanError; }, [onScanError]);

    const describeCameraError = (error) => {
        const name = error?.name || '';
        const message = String(error?.message || error || '');
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || /permission denied|notallowederror/i.test(message)) {
            return 'Camera permission is blocked. Allow Camera access for this website in browser settings, then tap Try Again.';
        }
        if (name === 'NotFoundError' || /no camera|device not found/i.test(message)) {
            return 'No camera was found. You can enter the barcode manually below.';
        }
        if (name === 'NotReadableError' || /could not start video source/i.test(message)) {
            return 'Your camera may be in use by another app. Close other camera apps and try again.';
        }
        if (!window.isSecureContext) return 'Camera access requires a secure HTTPS connection.';
        return 'The camera could not start. Check browser permissions and try again.';
    };

    const stopScanner = useCallback(async () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        detectorRef.current = null;
        scanBusyRef.current = false;

        const stream = streamRef.current;
        streamRef.current = null;
        if (stream) stream.getTracks().forEach(track => track.stop());

        const scanner = scannerRef.current;
        scannerRef.current = null;
        if (scanner) {
            try {
                if (scanner.isScanning) await scanner.stop();
            } catch (error) {
                console.debug('Barcode scanner stop skipped.', error);
            }
            try { scanner.clear(); } catch { /* already cleared */ }
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }
    }, []);

    const finishScan = useCallback(async (decodedText, decodedResult) => {
        if (!activeRef.current) return;
        activeRef.current = false;
        generationRef.current += 1;
        setStatus('success');
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                const audio = new AudioContextClass();
                const oscillator = audio.createOscillator();
                const gain = audio.createGain();
                oscillator.connect(gain);
                gain.connect(audio.destination);
                oscillator.frequency.value = 880;
                gain.gain.value = 0.07;
                oscillator.start();
                oscillator.stop(audio.currentTime + 0.1);
                oscillator.onended = () => audio.close();
            }
        } catch { /* sound is optional */ }
        await stopScanner();
        successRef.current?.(decodedText, decodedResult);
    }, [stopScanner]);

    const startNativeDetection = useCallback((detector, generation) => {
        const scanFrame = async () => {
            if (!activeRef.current || generationRef.current !== generation) return;
            const video = videoRef.current;
            if (video && video.readyState >= 2 && !scanBusyRef.current) {
                scanBusyRef.current = true;
                try {
                    const results = await detector.detect(video);
                    if (results?.length && activeRef.current && generationRef.current === generation) {
                        await finishScan(results[0].rawValue, results[0]);
                        return;
                    }
                } catch {
                    // A frame may be temporarily undecodable; continue with the next frame.
                } finally {
                    scanBusyRef.current = false;
                }
            }
            if (activeRef.current && generationRef.current === generation) {
                rafRef.current = requestAnimationFrame(() => {
                    // Throttle detection to roughly 8-10 attempts per second on mobile.
                    window.setTimeout(scanFrame, 110);
                });
            }
        };
        rafRef.current = requestAnimationFrame(scanFrame);
    }, [finishScan]);

    const startHtml5Fallback = async (selectedCameraId, generation) => {
        const scanner = new Html5Qrcode(SCAN_REGION_ID, { verbose: false });
        scannerRef.current = scanner;
        const cameraSource = selectedCameraId || { facingMode: 'environment' };
        await scanner.start(
            cameraSource,
            {
                fps: 8,
                qrbox: (width, height) => ({
                    width: Math.max(220, Math.min(Math.floor(width * 0.78), 360)),
                    height: Math.max(90, Math.min(Math.floor(height * 0.34), 140))
                }),
                disableFlip: true,
                formatsToSupport: FALLBACK_FORMATS
            },
            (decodedText, decodedResult) => {
                if (generationRef.current === generation) finishScan(decodedText, decodedResult);
            },
            () => {}
        );
        if (!activeRef.current || generationRef.current !== generation) {
            try { await scanner.stop(); } catch {}
            try { scanner.clear(); } catch {}
            return;
        }
        setUsingNativeScanner(false);
        setStatus('ready');
        if (selectedCameraId) setCameraId(selectedCameraId);
        navigator.mediaDevices?.enumerateDevices?.().then(devices => {
            if (!activeRef.current || generationRef.current !== generation) return;
            const available = devices.filter(device => device.kind === 'videoinput');
            setCameras(available.map((device, index) => ({
                id: device.deviceId,
                label: device.label || `Camera ${index + 1}`
            })));
        }).catch(() => {});
    };

    const startScanner = useCallback(async (selectedCameraId = '') => {
        if (!isOpen || !activeRef.current) return;
        const generation = ++generationRef.current;
        setStatus('starting');
        setErrorMessage('');
        await stopScanner();
        if (!activeRef.current || generationRef.current !== generation) return;

        if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
            setStatus('error');
            setErrorMessage(describeCameraError(new Error('Camera API unavailable')));
            return;
        }

        try {
            // Check native barcode support before opening the camera. Unsupported
            // browsers go straight to the library fallback instead of opening,
            // closing, and reopening the camera (which caused the long delay).
            let detector = null;
            if ('BarcodeDetector' in window) {
                try {
                    const supported = await window.BarcodeDetector.getSupportedFormats();
                    const formats = RETAIL_FORMATS.filter(format => supported.includes(format));
                    if (formats.length) detector = new window.BarcodeDetector({ formats });
                } catch {
                    detector = null;
                }
            }

            if (!detector) {
                await startHtml5Fallback(selectedCameraId, generation);
                return;
            }

            const videoConstraints = selectedCameraId
                ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } }
                : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } };
            const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints });
            if (!activeRef.current || generationRef.current !== generation) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            streamRef.current = stream;
            const video = videoRef.current;
            if (!video) throw new Error('Camera preview is not ready');
            video.srcObject = stream;
            await video.play();

            detectorRef.current = detector;
            setUsingNativeScanner(true);
            setStatus('ready');
            const track = stream.getVideoTracks()[0];
            if (track) {
                const settings = track.getSettings();
                if (settings.deviceId) setCameraId(settings.deviceId);
            }
            startNativeDetection(detector, generation);

            // Populate alternate cameras only after the live preview is running.
            navigator.mediaDevices.enumerateDevices?.().then(devices => {
                if (!activeRef.current || generationRef.current !== generation) return;
                const available = devices.filter(device => device.kind === 'videoinput');
                setCameras(available.map((device, index) => ({
                    id: device.deviceId,
                    label: device.label || `Camera ${index + 1}`
                })));
            }).catch(() => {});
        } catch (error) {
            if (generationRef.current !== generation || !activeRef.current) return;
            await stopScanner();
            setStatus('error');
            setErrorMessage(describeCameraError(error));
            errorRef.current?.(error);
        }
    }, [isOpen, stopScanner, startNativeDetection]);

    useEffect(() => {
        if (!isOpen) {
            activeRef.current = false;
            generationRef.current += 1;
            stopScanner();
            return undefined;
        }
        activeRef.current = true;
        // Start immediately when the modal opens; no artificial startup delay.
        startScanner();
        return () => {
            activeRef.current = false;
            generationRef.current += 1;
            stopScanner();
        };
    }, [isOpen, startScanner, stopScanner]);

    const submitManualCode = (event) => {
        event.preventDefault();
        const value = manualCode.trim();
        if (!value) return;
        activeRef.current = false;
        generationRef.current += 1;
        stopScanner();
        successRef.current?.(value, null);
    };

    const changeCamera = (event) => {
        const nextCamera = event.target.value;
        setCameraId(nextCamera);
        startScanner(nextCamera);
    };

    return (
        <div className="w-full space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${status === 'ready' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : status === 'error' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400'}`}>
                        {status === 'error' ? <CameraOff size={18} /> : status === 'success' ? <CheckCircle2 size={18} /> : <Camera size={18} />}
                    </span>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{status === 'ready' ? 'Camera ready' : status === 'starting' ? 'Opening camera…' : status === 'success' ? 'Barcode detected' : 'Camera unavailable'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Rear camera starts automatically for faster scanning</p>
                    </div>
                </div>
                {cameras.length > 1 && (
                    <select value={cameraId} onChange={changeCamera} className="max-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {cameras.map((camera, index) => <option key={camera.id || index} value={camera.id}>{camera.label}</option>)}
                    </select>
                )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 shadow-inner dark:border-slate-700">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full min-h-[260px] sm:min-h-[320px] max-h-[420px] object-cover"
                    style={{ display: usingNativeScanner || status === 'starting' ? 'block' : 'none' }}
                />
                <div id={SCAN_REGION_ID} className="barcode-reader w-full min-h-[260px] sm:min-h-[320px]" style={{ display: usingNativeScanner || status === 'starting' ? 'none' : 'block' }} />
                {status === 'starting' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 px-5 text-center">
                        <span className="h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-indigo-400" />
                        <p className="text-sm font-semibold text-white">Opening your camera…</p>
                        <p className="text-xs text-slate-300">Connecting to the rear camera</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 px-6 py-8 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300"><AlertCircle size={25} /></span>
                        <p className="max-w-sm text-sm font-semibold leading-6 text-white">{errorMessage}</p>
                        <button type="button" onClick={() => startScanner(cameraId)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-bold text-white transition hover:bg-indigo-400">
                            <RefreshCw size={16} /> Try Camera Again
                        </button>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40">
                <div className="flex items-start gap-3">
                    <ScanLine className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" size={20} />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">How to scan</p>
                        <p className="mt-1 text-sm leading-6 text-indigo-800 dark:text-indigo-300">Place the barcode inside the camera frame. Keep your phone steady, avoid glare, and make sure the barcode is well lit.</p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <button type="button" onClick={() => setIsManualOpen(value => !value)} className="flex w-full items-center justify-between gap-3 text-left">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100"><Keyboard size={18} className="text-indigo-600 dark:text-indigo-400" /> Enter barcode manually</span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{isManualOpen ? 'Hide' : 'Open'}</span>
                </button>
                {isManualOpen && (
                    <form onSubmit={submitManualCode} className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input autoComplete="off" inputMode="numeric" value={manualCode} onChange={event => setManualCode(event.target.value)} placeholder="Enter barcode number" className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-900" />
                        <button type="submit" disabled={!manualCode.trim()} className="h-12 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">Use Barcode</button>
                    </form>
                )}
            </div>

            <style>{`
                #${SCAN_REGION_ID} { width: 100%; min-height: 260px; color: #fff; }
                #${SCAN_REGION_ID} video { width: 100% !important; height: auto !important; min-height: 260px; max-height: 420px; object-fit: cover; border-radius: 1rem; }
                #${SCAN_REGION_ID}__scan_region { min-height: 260px; background: #020617; }
                #${SCAN_REGION_ID}__dashboard, #${SCAN_REGION_ID}__dashboard_section, #${SCAN_REGION_ID}__dashboard_section_csr { color: #f8fafc !important; background: #0f172a !important; }
                #${SCAN_REGION_ID}__dashboard_section_csr button, #${SCAN_REGION_ID}__dashboard_section_csr select { color: #f8fafc !important; background: #334155 !important; border: 1px solid #64748b !important; border-radius: 0.65rem !important; padding: 0.5rem 0.75rem !important; }
                #${SCAN_REGION_ID} img { display: none !important; }
                #${SCAN_REGION_ID} a { color: #a5b4fc !important; }
            `}</style>
        </div>
    );
};

export default BarcodeScanner;
