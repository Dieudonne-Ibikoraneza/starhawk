import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "@/lib/api/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress as UIProgress } from "@/components/ui/progress";
import { 
  Loader2, 
  Building2, 
  UserCircle, 
  Mail, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Camera,
  Trash2,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
import { photosService } from "@/lib/api/services/photos";
import ImageCropper from "@/components/ui/image-cropper";

const Onboarding = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    bio: "",
    companyName: "",
    contactPerson: "",
    website: "",
    address: "",
    companyDescription: "",
    licenseNumber: "",
    officialEmail: "",
    officialPhone: "",
    companyLogoUrl: "",
    profilePictureUrl: "",
    profilePhotoUrl: "",
  });

  const [cropperData, setCropperData] = useState<{
    image: string;
    type: "LOGO" | "PROFILE";
    title: string;
    aspect: number;
    circular?: boolean;
  } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        bio: profile.bio || "",
        companyName: profile.companyName || "",
        contactPerson: profile.contactPerson || "",
        website: profile.website || "",
        address: profile.address || "",
        companyDescription: profile.companyDescription || "",
        licenseNumber: profile.licenseNumber || "",
        officialEmail: profile.officialEmail || profile.email || "",
        officialPhone: profile.officialPhone || profile.phone || "",
        companyLogoUrl: profile.companyLogoUrl || "",
        profilePictureUrl: profile.profilePictureUrl || profile.profilePhotoUrl || "",
        profilePhotoUrl: profile.profilePhotoUrl || "",
      }));
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    try {
      await updateProfile.mutateAsync({
        ...formData,
        firstLoginRequired: false, // Onboarding completes, so clear firstLoginRequired flag!
      } as any);
      toast.success("Onboarding complete! Welcome to Starhawk.");
      
      // Navigate based on role
      if (profile?.role === "INSURER") navigate("/insurer-dashboard");
      else if (profile?.role === "ASSESSOR") navigate("/assessor-dashboard");
      else if (profile?.role === "FARMER") navigate("/farmer-dashboard");
      else navigate("/");
    } catch (err) {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "LOGO" | "PROFILE") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperData({
        image: reader.result as string,
        type,
        title: type === "LOGO" ? "Crop Company Logo" : "Crop Profile Picture",
        aspect: type === "LOGO" ? 1 : 1,
        circular: type === "PROFILE",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadCroppedImage = async (blob: Blob) => {
    if (!cropperData) return;
    
    const type = cropperData.type;
    setCropperData(null);
    setIsUploading(true);
    setUploadProgress({ [type]: 10 });

    try {
      const file = new File([blob], `${type.toLowerCase()}_${Date.now()}.png`, { type: "image/png" });
      const photoType = type === "LOGO" ? "LOGO" : "PROFILE";
      const entityId = profile?.id || "onboarding";
      const { url } = await photosService.uploadPhoto(file, photoType, entityId, (progress) => {
        setUploadProgress({ [type]: progress });
      });

      setFormData(prev => ({
        ...prev,
        [type === "LOGO" ? "companyLogoUrl" : "profilePictureUrl"]: url,
        ...(type === "PROFILE" ? { profilePhotoUrl: url } : {})
      }));
      
      toast.success(`${type === "LOGO" ? "Logo" : "Profile picture"} uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handlePhotoRemove = (type: "LOGO" | "PROFILE") => {
    setFormData(prev => ({
      ...prev,
      [type === "LOGO" ? "companyLogoUrl" : "profilePictureUrl"]: "",
      ...(type === "PROFILE" ? { profilePhotoUrl: "" } : {})
    }));
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Retrieving onboarding context...</p>
        </div>
      </div>
    );
  }

  const progress = ((step - 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 lg:p-12 font-sans">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Welcome, {profile?.firstName}!</h1>
          <p className="text-slate-500 text-base font-semibold max-w-lg mx-auto">
            Let's get your insurer profile set up to access premium underwriting, continuous satellite monitoring, and automated claims review.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <UIProgress value={progress} className="h-2 bg-slate-100" />
        </div>

        <Card className="border border-slate-100 shadow-xl bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            {step === 1 && (
              <>
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <UserCircle className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 1: Introduction</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Tell us about yourself</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Provide a brief bio or professional summary to show in reports and audit logs.
                </CardDescription>
              </>
            )}
            {step === 2 && (
              <>
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 2: Company Profile</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Business Details</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Enter your company information and licensing details to verify eligibility.
                </CardDescription>
              </>
            )}
            {step === 3 && (
              <>
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Camera className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 3: Brand Identity</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Visual Profile</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Upload your professional photo and company logo to construct visual trust.
                </CardDescription>
              </>
            )}
            {step === 4 && (
              <>
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 4: Verification</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Official Contacts</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Provide official business contact details for contract correspondence.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Describe your role, underwriting domain, or risk assessment experience..."
                    className="min-h-[150px] resize-none border-gray-200 rounded-xl focus-visible:ring-emerald-500"
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="e.g. AgriSure Insurance"
                      className="h-11 border-gray-200 rounded-xl"
                      value={formData.companyName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="text-sm font-semibold text-gray-700">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      placeholder="e.g. LIC-2026-9042"
                      className="h-11 border-gray-200 rounded-xl"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-semibold text-gray-700">Website URL</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="https://www.company.com"
                    className="h-11 border-gray-200 rounded-xl"
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Headquarters Address</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Kigali Heights, Block B, Rwanda"
                    className="h-11 border-gray-200 rounded-xl"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDescription" className="text-sm font-semibold text-gray-700">Company Description</Label>
                  <Textarea
                    id="companyDescription"
                    name="companyDescription"
                    placeholder="What does your agricultural insurance company specialize in?"
                    className="min-h-[100px] resize-none border-gray-200 rounded-xl focus-visible:ring-emerald-500"
                    value={formData.companyDescription}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center gap-4">
                    <Label className="text-sm font-semibold text-gray-700">Profile Picture</Label>
                    <div 
                      className="group relative h-32 w-32 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer"
                      onClick={() => document.getElementById("profile-upload")?.click()}
                    >
                      {formData.profilePictureUrl ? (
                        <img 
                          src={formData.profilePictureUrl} 
                          alt="Profile" 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <UserCircle className="h-12 w-12 text-slate-300" />
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <Pencil className="h-5 w-5" />
                        <span className="text-[10px] uppercase font-bold mt-1">Change</span>
                      </div>

                      {isUploading && uploadProgress["PROFILE"] > 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <Input 
                      type="file" 
                      id="profile-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "PROFILE")}
                    />
                    {formData.profilePictureUrl && (
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handlePhotoRemove("PROFILE")}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remove Photo
                      </Button>
                    )}
                  </div>

                  {/* Company Logo */}
                  <div className="flex flex-col items-center gap-4">
                    <Label className="text-sm font-semibold text-gray-700">Company Logo</Label>
                    <div 
                      className="group relative h-32 w-48 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                    >
                      {formData.companyLogoUrl ? (
                        <img 
                          src={formData.companyLogoUrl} 
                          alt="Logo" 
                          className="h-full w-full object-contain p-2" 
                        />
                      ) : (
                        <Building2 className="h-12 w-12 text-slate-300" />
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <Pencil className="h-5 w-5" />
                        <span className="text-[10px] uppercase font-bold mt-1">Change</span>
                      </div>

                      {isUploading && uploadProgress["LOGO"] > 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <Input 
                      type="file" 
                      id="logo-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "LOGO")}
                    />
                    {formData.companyLogoUrl && (
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handlePhotoRemove("LOGO")}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remove Logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-sm font-semibold text-gray-700">Primary Contact Person</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    placeholder="Full name of representative"
                    className="h-11 border-gray-200 rounded-xl"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="officialEmail" className="text-sm font-semibold text-gray-700">Official Email</Label>
                    <Input
                      id="officialEmail"
                      name="officialEmail"
                      type="email"
                      placeholder="e.g. contact@agrisure.com"
                      className="h-11 border-gray-200 rounded-xl"
                      value={formData.officialEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officialPhone" className="text-sm font-semibold text-gray-700">Official Phone</Label>
                    <Input
                      id="officialPhone"
                      name="officialPhone"
                      placeholder="e.g. +250 788 123 456"
                      className="h-11 border-gray-200 rounded-xl"
                      value={formData.officialPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex gap-4 items-start translate-y-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-800 leading-relaxed">
                    By completing this onboarding setup, you confirm that the entered business credentials are valid, complete, and legally represent your licensed agricultural insurance entity.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-6 p-6 border-t border-slate-100 bg-slate-50/50">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || updateProfile.isPending}
              className="px-6 border-gray-200 rounded-xl hover:bg-white text-gray-700 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {step < totalSteps ? (
              <Button onClick={nextStep} className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 transition-all shadow-sm cursor-pointer">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={updateProfile.isPending}
                className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Powered by Starhawk Insurance Core v3.2
        </p>
      </div>

      {cropperData && (
        <ImageCropper
          image={cropperData.image}
          title={cropperData.title}
          aspect={cropperData.aspect}
          circular={cropperData.circular}
          onCancel={() => setCropperData(null)}
          onCropComplete={uploadCroppedImage}
        />
      )}
    </div>
  );
};

export default Onboarding;
