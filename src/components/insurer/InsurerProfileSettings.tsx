import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, updateUserProfile } from "@/services/usersAPI";
import { getUserId, getPhoneNumber, getEmail } from "@/services/authAPI";
import { photosService } from "@/lib/api/services/photos";
import ImageCropper from "@/components/ui/image-cropper";
import {
  User,
  Shield,
  Key,
  Save,
  Eye,
  EyeOff,
  Building2,
  Trash2,
  Loader2,
  Pencil,
  Plus
} from "lucide-react";

export default function InsurerProfileSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const insurerId = getUserId() || "";
  const insurerPhone = getPhoneNumber() || "";
  const insurerEmail = getEmail() || "";

  const [profileData, setProfileData] = useState({
    email: "",
    phone: "",
    companyName: "",
    contactPerson: "",
    companyLogoUrl: null as string | null,
    profilePictureUrl: null as string | null,
    insurerId: ""
  });

  const [cropperData, setCropperData] = useState<{
    image: string;
    type: string;
    title: string;
    aspect: number;
    circular: boolean;
  } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({
    LOGO: 0,
    PROFILE: 0,
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: true,
    sessionTimeout: "30"
  });

  const loadUserProfile = async () => {
    if (!insurerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response: any = await getUserProfile();
      const user = response.data || response;

      if (user) {
        setProfileData({
          email: user.email || insurerEmail || "",
          phone: user.phoneNumber || insurerPhone || "",
          companyName: user.insurerProfile?.companyName || "",
          contactPerson: user.insurerProfile?.contactPerson || "",
          companyLogoUrl: user.insurerProfile?.companyLogoUrl || null,
          profilePictureUrl: user.insurerProfile?.profilePictureUrl || null,
          insurerId: user._id || user.id || insurerId || ""
        });
      }
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
      setProfileData(prev => ({
        ...prev,
        email: insurerEmail || "",
        phone: insurerPhone || "",
        insurerId: insurerId || ""
      }));
      toast({
        title: "Warning",
        description: "Could not load full profile. Using basic information.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insurerId]);

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityUpdate = (field: string, value: string | boolean) => {
    setSecurityData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropperData({
        image: reader.result as string,
        type,
        title: type === "LOGO" ? "Crop Company Logo" : "Crop Profile Photo",
        aspect: 1,
        circular: type === "PROFILE",
      });
    });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadCroppedImage = async (croppedBlob: Blob) => {
    if (!cropperData || !insurerId) return;

    const type = cropperData.type;
    setCropperData(null);
    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    try {
      const response = await photosService.uploadPhoto(
        croppedBlob,
        type,
        insurerId,
        (progress) => setUploadProgress(prev => ({ ...prev, [type]: progress }))
      );

      setProfileData(prev => ({
        ...prev,
        [type === "LOGO" ? "companyLogoUrl" : "profilePictureUrl"]: response.url
      }));

      toast({
        title: "Success",
        description: `${type === "LOGO" ? "Company logo" : "Profile picture"} uploaded successfully.`,
      });
      
      // Reload profile
      await loadUserProfile();
    } catch (error: any) {
      toast({
        title: "Error uploading photo",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    }
  };

  const handlePhotoRemove = async (type: string) => {
    if (!insurerId) return;

    setIsUploading(true);
    try {
      await photosService.clearProfilePhoto(insurerId, type);
      
      setProfileData(prev => ({
        ...prev,
        [type === "LOGO" ? "companyLogoUrl" : "profilePictureUrl"]: null
      }));

      toast({
        title: "Success",
        description: `${type === "LOGO" ? "Company logo" : "Profile picture"} removed successfully.`,
      });
      
      // Reload profile
      await loadUserProfile();
    } catch (error: any) {
      toast({
        title: "Error removing photo",
        description: error.message || "Failed to remove photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!insurerId) return;

    setSaving(true);
    try {
      await updateUserProfile({
        email: profileData.email,
        phoneNumber: profileData.phone,
        insurerProfile: {
          companyName: profileData.companyName,
          contactPerson: profileData.contactPerson
        }
      });

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });

      await loadUserProfile();
    } catch (error: any) {
      toast({
        title: "Error saving changes",
        description: error.message || "Failed to save profile changes.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Photo / Logo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Company Logo</CardTitle>
            <CardDescription className="text-gray-500">Your organization's premium branding logo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div 
              className="group relative h-40 w-40 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer transition-all duration-300"
              onClick={() => document.getElementById("logo-upload")?.click()}
            >
              {profileData.companyLogoUrl ? (
                <img 
                  src={profileData.companyLogoUrl} 
                  alt="Logo" 
                  className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" 
                />
              ) : (
                <Building2 className="h-16 w-16 text-gray-400" />
              )}
              
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                {profileData.companyLogoUrl ? (
                  <Pencil className="h-6 w-6" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
                <span className="text-xs font-semibold px-2 text-center uppercase tracking-wider">
                  {profileData.companyLogoUrl ? "Edit Company Logo" : "Add Company Logo"}
                </span>
              </div>

              {isUploading && (uploadProgress["LOGO"] > 0) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 text-white animate-spin mb-2" />
                  <Progress value={uploadProgress["LOGO"]} className="h-1 w-full bg-white/20" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <Input 
                type="file" 
                id="logo-upload" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, "LOGO")}
              />
              {profileData.companyLogoUrl && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isUploading}
                  onClick={() => handlePhotoRemove("LOGO")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Logo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Profile Picture</CardTitle>
            <CardDescription className="text-gray-500">Your personal professional user avatar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div 
              className="group relative h-40 w-40 rounded-full border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer transition-all duration-300"
              onClick={() => document.getElementById("profile-upload")?.click()}
            >
              {profileData.profilePictureUrl ? (
                <img 
                  src={profileData.profilePictureUrl} 
                  alt="Profile" 
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}

              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                {profileData.profilePictureUrl ? (
                  <Pencil className="h-6 w-6" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
                <span className="text-xs font-semibold px-2 text-center uppercase tracking-wider">
                  {profileData.profilePictureUrl ? "Edit Photo" : "Add Photo"}
                </span>
              </div>

              {isUploading && (uploadProgress["PROFILE"] > 0) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 text-white animate-spin mb-2" />
                  <Progress value={uploadProgress["PROFILE"]} className="h-1 w-full bg-white/20" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <Input 
                type="file" 
                id="profile-upload" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, "PROFILE")}
              />
              {profileData.profilePictureUrl && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isUploading}
                  onClick={() => handlePhotoRemove("PROFILE")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Photo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {cropperData && (
        <ImageCropper
          image={cropperData.image}
          aspect={cropperData.aspect}
          circular={cropperData.circular}
          title={cropperData.title}
          onCancel={() => setCropperData(null)}
          onCropComplete={uploadCroppedImage}
        />
      )}

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-gray-900 font-semibold text-base">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-gray-700 font-medium">Company Name</Label>
              <Input
                id="companyName"
                value={profileData.companyName}
                onChange={(e) => handleProfileUpdate("companyName", e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurerId" className="text-gray-700 font-medium">Insurer ID</Label>
              <Input
                id="insurerId"
                value={profileData.insurerId}
                disabled
                className="bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="text-gray-700 font-medium">Contact Person</Label>
              <Input
                id="contactPerson"
                value={profileData.contactPerson}
                onChange={(e) => handleProfileUpdate("contactPerson", e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileUpdate("email", e.target.value)}
                className="border-gray-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => handleProfileUpdate("phone", e.target.value)}
              className="border-gray-300"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-gray-900 font-semibold text-base">
            <Key className="h-5 w-5 mr-2 text-blue-600" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={securityData.currentPassword}
                onChange={(e) => handleSecurityUpdate("currentPassword", e.target.value)}
                className="border-gray-300 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={securityData.newPassword}
                onChange={(e) => handleSecurityUpdate("newPassword", e.target.value)}
                className="border-gray-300 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={securityData.confirmPassword}
                onChange={(e) => handleSecurityUpdate("confirmPassword", e.target.value)}
                className="border-gray-300 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] text-xs h-9">
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-gray-900 font-semibold text-base">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Switch
              checked={securityData.twoFactorEnabled}
              onCheckedChange={(checked) => handleSecurityUpdate("twoFactorEnabled", checked)}
            />
          </div>

          <Separator className="bg-gray-100" />

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Select value={securityData.sessionTimeout} onValueChange={(value) => handleSecurityUpdate("sessionTimeout", value)}>
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Security", icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  isTabActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "security" && renderSecurityTab()}
      </div>

      {/* Save Button */}
      {activeTab === "profile" && (
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] text-xs h-9"
            onClick={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
