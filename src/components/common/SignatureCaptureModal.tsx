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
      // Setup high-DPI canvas scaling
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      // Keep canvas size responsive
      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.offsetWidth * ratio;
          canvas.height = parent.offsetHeight * ratio;
          canvas.getContext("2d")?.scale(ratio, ratio);
          signaturePadRef.current?.clear(); // clear on resize
        }
      };

      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();

      signaturePadRef.current = new SignaturePad(canvas, {
        penColor: "#0f172a",
        backgroundColor: "rgba(255, 255, 255, 1)",
      });

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
      const base64Data = signaturePadRef.current.toDataURL("image/png");
      
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
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Digital Signature Required</h2>
            <p className="text-emerald-100 mt-1">Please provide your signature to continue</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 leading-relaxed">
              <strong>Security & Privacy Notice:</strong> This signature will strictly only be used in the insurance process and policy signing for the security of our clients. By signing, you agree to these terms.
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Draw your signature below:
            </label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50 h-64 sm:h-80 w-full group hover:border-emerald-400 transition-colors">
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50 group-hover:opacity-0 transition-opacity">
                <span className="text-slate-400 font-medium text-lg">Sign Here</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleClear}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Eraser className="w-5 h-5" />
              Clear Signature
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-teal-500 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Securely...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
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
