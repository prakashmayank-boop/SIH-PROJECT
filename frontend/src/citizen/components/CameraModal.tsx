import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, Check, RotateCcw, AlertTriangle } from "lucide-react";

interface CameraModalProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    stopStream();
    setIsReady(false);
    setError(null);
    setCapturedDataUrl(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available on this browser or connection. Please use device camera upload.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsReady(true);
        };
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera permission was denied. You can allow camera in browser settings or use device camera below.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera hardware detected on this device. You can upload a photo from your files.");
      } else {
        setError(err.message || "Unable to access camera.");
      }
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopStream();
    };
  }, [startCamera, facingMode, stopStream]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);
    streamRef.current?.getTracks().forEach((t) => { t.enabled = false; });
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedDataUrl(null);
    streamRef.current?.getTracks().forEach((t) => { t.enabled = true; });
  }, []);

  const handleUsePhoto = useCallback(() => {
    if (!capturedDataUrl) return;
    try {
      const byteString = atob(capturedDataUrl.split(",")[1]);
      const mimeString = capturedDataUrl.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      stopStream();
      onCapture(file);
      onClose();
    } catch (err) {
      console.error("Error creating photo file:", err);
      setError("Failed to process captured photo.");
    }
  }, [capturedDataUrl, onCapture, onClose, stopStream]);

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      stopStream();
      onCapture(files[0]);
      onClose();
    }
  };

  const handleCloseModal = () => {
    stopStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-blue-500" />
            <span className="text-white font-bold text-sm tracking-wide">Live Camera</span>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="text-zinc-400 hover:text-white transition p-1.5 rounded-full hover:bg-zinc-800"
            title="Close camera"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative bg-black aspect-4/3 sm:aspect-video w-full overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            onCanPlay={() => setIsReady(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${capturedDataUrl ? "opacity-0" : "opacity-100"}`}
          />
          {capturedDataUrl && (
            <img src={capturedDataUrl} alt="Captured preview" className="absolute inset-0 w-full h-full object-cover" />
          )}

          {!isReady && !error && !capturedDataUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 text-xs font-medium">Opening camera viewfinder...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900 p-6 text-center">
              <AlertTriangle size={36} className="text-amber-400" />
              <p className="text-white text-xs sm:text-sm font-medium leading-relaxed max-w-xs">{error}</p>
              
              <input
                ref={fallbackInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFallbackFile}
              />
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="mt-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <Camera size={16} />
                <span>Snap or Select Photo</span>
              </button>
            </div>
          )}

          {isReady && !capturedDataUrl && (
            <>
              <div className="absolute inset-4 border-2 border-white/20 rounded-xl pointer-events-none" />
              <button
                type="button"
                onClick={() => setFacingMode((p) => (p === "environment" ? "user" : "environment"))}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition shadow backdrop-blur-xs"
                title="Switch Camera (Front / Back)"
              >
                <RotateCcw size={18} />
              </button>
            </>
          )}

          {capturedDataUrl && (
            <div className="absolute top-3 left-3 bg-green-600/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1.5">
              <Check size={14} /> Photo Captured
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="bg-zinc-900 px-4 py-4 border-t border-zinc-800 flex items-center justify-center">
          {!capturedDataUrl ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleCapture}
                disabled={!isReady}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/35 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
                title="Click photo"
              >
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                  <Camera size={22} className="text-zinc-900" />
                </div>
              </button>
              <span className="text-[11px] text-zinc-400 font-medium">Click button to take photo</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 rounded-xl border border-zinc-700 hover:border-zinc-500 bg-zinc-800/80 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <RotateCcw size={16} /> Retake
              </button>
              <button
                type="button"
                onClick={handleUsePhoto}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
              >
                <Check size={16} /> Upload Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
