import React, { useRef, useEffect, useState } from "react";
import SignaturePad from "signature_pad";
import { X, Save, Eraser, AlertCircle, Loader2 } from "lucide-react";
import { uploadSignature } from "@/services/usersAPI";
import { useAuth } from "@/contexts/AuthContext";

interface SignatureCaptureModalProps {
  onSuccess: () => void;
}

export default function SignatureCaptureModal({ onSuccess }: SignatureCaptureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, syncAuth } = useAuth();

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      
      // Initialize first
      signaturePadRef.current = new SignaturePad(canvas, {
        penColor: "#0f172a",
        backgroundColor: "rgba(255, 255, 255, 1)", // White background
      });

      // Keep canvas size responsive
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        // Avoid width/height being 0 if modal is hidden
        if (canvas.offsetWidth === 0) return;
        
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        
        // This clear() is required to apply the background color after resize
        signaturePadRef.current?.clear(); 
      };

      window.addEventListener("resize", resizeCanvas);
      
      // Call resizeCanvas initially to set dimensions and fill background
      // Use setTimeout to ensure DOM has fully painted the canvas dimensions
      setTimeout(resizeCanvas, 50);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        signaturePadRef.current?.off();
      };
    }
  }, []);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setError(null);
  };

  const handleSave = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setError("Please provide a signature before saving.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Create an offscreen canvas with guaranteed white background
      // This avoids any issues with the live canvas transparency state
      const liveCanvas = canvasRef.current!;
      const offscreen = document.createElement('canvas');
      offscreen.width = liveCanvas.width;
      offscreen.height = liveCanvas.height;
      const offCtx = offscreen.getContext('2d')!;
      
      // Step 1: Fill entire offscreen canvas white
      offCtx.fillStyle = '#ffffff';
      offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
      
      // Step 2: Draw the signature strokes on top
      offCtx.drawImage(liveCanvas, 0, 0);
      
      // Step 3: Export from the clean offscreen canvas (guaranteed white bg)
      const base64Data = offscreen.toDataURL("image/png");
      
      // Upload to backend
      const response = await uploadSignature(base64Data);
      
      // Update local storage user object with new signatureUrl
      if (user) {
        const updatedUser = { ...user, signatureUrl: response.url || "saved" };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        syncAuth(); // Sync the auth context
      }
      
      onSuccess();
    } catch (err: any) {
      console.error("Signature save error:", err);
      setError(err.message || "Failed to save signature. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-300 max-h-[90vh]">
        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Digital Signature Required</h2>
            <p className="text-xs text-emerald-100 mt-0.5">Please provide your signature to continue</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-md border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong>Security & Privacy Notice:</strong> This signature will strictly only be used in the insurance process and policy signing for the security of our clients. By signing, you agree to these terms.
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Draw your signature below:
            </label>
            <div className="relative border border-dashed border-slate-300 rounded-md overflow-hidden bg-slate-50 h-64 sm:h-80 w-full group hover:border-emerald-400 transition-colors">
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50 group-hover:opacity-0 transition-opacity">
                <span className="text-slate-400 font-medium text-sm">Sign Here</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-md border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleClear}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition-colors active:bg-slate-100 disabled:opacity-50"
            >
              <Eraser className="w-4 h-4" />
              Clear Signature
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors active:bg-emerald-800 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Continue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
