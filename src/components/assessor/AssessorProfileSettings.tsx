import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { getUserId, getPhoneNumber, getEmail } from "@/services/authAPI";
import { getUserById, updateUserProfile, getUserProfile } from "@/services/usersAPI";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Bell, 
  Globe,
  Save,
  Eye,
  EyeOff,
  Upload,
  Camera,
  Award,
  Calendar,
  Map,
  GraduationCap
} from "lucide-react";

export default function AssessorProfileSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get logged-in assessor data from localStorage
  const assessorId = getUserId() || "";
  const assessorPhone = getPhoneNumber() || "";
  const assessorEmail = getEmail() || "";

  const [profileData, setProfileData] = useState({
    fullName: assessorEmail || assessorPhone || "Assessor",
    assessorId: assessorId || "",
    email: assessorEmail || "",
    phone: assessorPhone || "",
    address: "",
    specialization: "",
    experience: "",
    licenseNumber: "",
    certificationDate: "",
    bio: ""
  });

  // Load user data from localStorage and API on component mount
  useEffect(() => {
    // Update profile data with real user information from localStorage
    setProfileData(prev => ({
      ...prev,
      fullName: assessorEmail || assessorPhone || "Assessor",
      assessorId: assessorId || "",
      email: assessorEmail || "",
      phone: assessorPhone || "",
    }));

    // Fetch full user profile from API if userId is available
    const loadUserProfile = async () => {
      if (!assessorId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Try to get user profile first (current user's own profile)
        let userData: any;
        try {
          userData = await getUserProfile();
        } catch (err) {
          // If getUserProfile fails, try getUserById
          userData = await getUserById(assessorId);
        }
        
        const user = userData.data || userData;
        
        if (user) {
          // Update profile with full user data
          setProfileData(prev => ({
            ...prev,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || user.phoneNumber || assessorEmail || assessorPhone || "Assessor",
            assessorId: user._id || user.id || assessorId || "",
            email: user.email || assessorEmail || "",
            phone: user.phoneNumber || assessorPhone || "",
            address: user.assessorProfile?.address || user.address || user.province || user.district || prev.address || "",
            specialization: user.assessorProfile?.specialization || prev.specialization || "",
            experience: user.assessorProfile?.experienceYears ? `${user.assessorProfile.experienceYears} years` : prev.experience || "",
            licenseNumber: user.assessorProfile?.licenseNumber || prev.licenseNumber || "",
            certificationDate: user.assessorProfile?.certificationDate || prev.certificationDate || "",
            bio: user.assessorProfile?.bio || prev.bio || "",
          }));

          // Load work preferences from assessor profile
          if (user.assessorProfile) {
            setWorkData(prev => ({
              ...prev,
              assignedRegion: user.assessorProfile.assignedRegion || user.province || user.district || prev.assignedRegion || "",
              maxAssessmentsPerDay: user.assessorProfile.maxAssessmentsPerDay?.toString() || prev.maxAssessmentsPerDay || "3",
              preferredWorkingHours: user.assessorProfile.preferredWorkingHours || prev.preferredWorkingHours || "08:00-17:00",
              vehicleType: user.assessorProfile.vehicleType || prev.vehicleType || "",
              equipment: user.assessorProfile.equipment || prev.equipment || [],
              languages: user.assessorProfile.languages || prev.languages || [],
            }));
          }
        }
      } catch (err: any) {
        console.error('Failed to load user profile:', err);
        toast({
          title: 'Error loading profile',
          description: err.message || 'Failed to load profile data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [assessorId, assessorEmail, assessorPhone]);

  const [workData, setWorkData] = useState({
    assignedRegion: "",
    maxAssessmentsPerDay: "3",
    preferredWorkingHours: "08:00-17:00",
    vehicleType: "",
    equipment: [] as string[],
    languages: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    sessionTimeout: "30"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    assignmentAlerts: true,
    dueDateReminders: true,
    trainingAlerts: true,
    equipmentAlerts: false,
    performanceReports: true,
    weatherAlerts: true
  });

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkUpdate = (field: string, value: string) => {
    setWorkData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityUpdate = (field: string, value: string | boolean) => {
    setSecurityData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationUpdate = (field: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!assessorId) {
      toast({
        title: 'Error',
        description: 'User ID not found. Please log in again.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Prepare update data
      const updateData: any = {
        firstName: profileData.fullName.split(' ')[0] || '',
        lastName: profileData.fullName.split(' ').slice(1).join(' ') || '',
        email: profileData.email,
        phoneNumber: profileData.phone,
        address: profileData.address,
        assessorProfile: {
          address: profileData.address,
          specialization: profileData.specialization,
          experienceYears: profileData.experience ? parseInt(profileData.experience.replace(' years', '')) : undefined,
          licenseNumber: profileData.licenseNumber,
          certificationDate: profileData.certificationDate,
          bio: profileData.bio,
          assignedRegion: workData.assignedRegion,
          maxAssessmentsPerDay: parseInt(workData.maxAssessmentsPerDay) || 3,
          preferredWorkingHours: workData.preferredWorkingHours,
          vehicleType: workData.vehicleType,
          equipment: workData.equipment,
          languages: workData.languages,
        }
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      Object.keys(updateData.assessorProfile).forEach(key => {
        if (updateData.assessorProfile[key] === undefined || updateData.assessorProfile[key] === '') {
          delete updateData.assessorProfile[key];
        }
      });

      await updateUserProfile(updateData);

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      // Reload profile data
      const userData: any = await getUserProfile().catch(() => getUserById(assessorId));
      const user = userData.data || userData;
      if (user) {
        setProfileData(prev => ({
          ...prev,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || user.phoneNumber || assessorEmail || assessorPhone || "Assessor",
          email: user.email || assessorEmail || "",
          phone: user.phoneNumber || assessorPhone || "",
          address: user.assessorProfile?.address || user.address || prev.address || "",
          specialization: user.assessorProfile?.specialization || prev.specialization || "",
          experience: user.assessorProfile?.experienceYears ? `${user.assessorProfile.experienceYears} years` : prev.experience || "",
          licenseNumber: user.assessorProfile?.licenseNumber || prev.licenseNumber || "",
          certificationDate: user.assessorProfile?.certificationDate || prev.certificationDate || "",
          bio: user.assessorProfile?.bio || prev.bio || "",
        }));

        if (user.assessorProfile) {
          setWorkData(prev => ({
            ...prev,
            assignedRegion: user.assessorProfile.assignedRegion || user.province || user.district || prev.assignedRegion || "",
            maxAssessmentsPerDay: user.assessorProfile.maxAssessmentsPerDay?.toString() || prev.maxAssessmentsPerDay || "3",
            preferredWorkingHours: user.assessorProfile.preferredWorkingHours || prev.preferredWorkingHours || "08:00-17:00",
            vehicleType: user.assessorProfile.vehicleType || prev.vehicleType || "",
            equipment: user.assessorProfile.equipment || prev.equipment || [],
            languages: user.assessorProfile.languages || prev.languages || [],
          }));
        }
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast({
        title: 'Error updating profile',
        description: err.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-base font-semibold text-gray-900">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => handleProfileUpdate('fullName', e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessorId">Assessor ID</Label>
              <Input
                id="assessorId"
                value={profileData.assessorId}
                disabled
                className="bg-gray-100 border-gray-300 text-gray-600"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileUpdate('email', e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={profileData.address}
              onChange={(e) => handleProfileUpdate('address', e.target.value)}
              className="bg-gray-50 border-gray-300 text-gray-900"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkTab = () => (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="flex items-center text-gray-900 text-base font-semibold">
            <Map className="h-5 w-5 mr-2 text-gray-600" />
            Work Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignedRegion">Assigned Region</Label>
              <Select value={workData.assignedRegion} onValueChange={(value) => handleWorkUpdate('assignedRegion', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eastern Province">Eastern Province</SelectItem>
                  <SelectItem value="Western Province">Western Province</SelectItem>
                  <SelectItem value="Northern Province">Northern Province</SelectItem>
                  <SelectItem value="Southern Province">Southern Province</SelectItem>
                  <SelectItem value="Kigali City">Kigali City</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAssessmentsPerDay">Max Assessments Per Day</Label>
              <Select value={workData.maxAssessmentsPerDay} onValueChange={(value) => handleWorkUpdate('maxAssessmentsPerDay', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferredWorkingHours">Preferred Working Hours</Label>
              <Select value={workData.preferredWorkingHours} onValueChange={(value) => handleWorkUpdate('preferredWorkingHours', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00-15:00">06:00-15:00</SelectItem>
                  <SelectItem value="07:00-16:00">07:00-16:00</SelectItem>
                  <SelectItem value="08:00-17:00">08:00-17:00</SelectItem>
                  <SelectItem value="09:00-18:00">09:00-18:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select value={workData.vehicleType} onValueChange={(value) => handleWorkUpdate('vehicleType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Bicycle">Bicycle</SelectItem>
                  <SelectItem value="Public Transport">Public Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900">Available Equipment</Label>
            <div className="flex flex-wrap gap-3">
              {["GPS Device", "Camera", "Soil Testing Kit", "Drone", "Weather Station", "Tablet"].map((equipment) => (
                <label key={equipment} className="flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={workData.equipment.includes(equipment)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setWorkData(prev => ({
                          ...prev,
                          equipment: [...prev.equipment, equipment]
                        }));
                      } else {
                        setWorkData(prev => ({
                          ...prev,
                          equipment: prev.equipment.filter(eq => eq !== equipment)
                        }));
                      }
                    }}
                    className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-white cursor-pointer group-hover:border-gray-400 transition-colors" 
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{equipment}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900">Languages</Label>
            <div className="flex flex-wrap gap-3">
              {["Kinyarwanda", "English", "French", "Swahili"].map((language) => (
                <label key={language} className="flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={workData.languages.includes(language)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setWorkData(prev => ({
                          ...prev,
                          languages: [...prev.languages, language]
                        }));
                      } else {
                        setWorkData(prev => ({
                          ...prev,
                          languages: prev.languages.filter(lang => lang !== language)
                        }));
                      }
                    }}
                    className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-white cursor-pointer group-hover:border-gray-400 transition-colors" 
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{language}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-base font-semibold text-gray-900">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={securityData.currentPassword}
                onChange={(e) => handleSecurityUpdate('currentPassword', e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
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
                onChange={(e) => handleSecurityUpdate('newPassword', e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
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
                onChange={(e) => handleSecurityUpdate('confirmPassword', e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <Button className="bg-green-600 hover:bg-green-700 text-white text-xs h-9">
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="flex items-center text-gray-900 text-base font-semibold">
            <Bell className="h-5 w-5 mr-2 text-gray-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Communication Channels</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationUpdate('emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) => handleNotificationUpdate('smsNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive browser push notifications</p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) => handleNotificationUpdate('pushNotifications', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Assessment Alerts</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">New Assignment Alerts</p>
                  <p className="text-xs text-gray-500">New assessment assignments</p>
                </div>
                <Switch
                  checked={notificationSettings.assignmentAlerts}
                  onCheckedChange={(checked) => handleNotificationUpdate('assignmentAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Due Date Reminders</p>
                  <p className="text-xs text-gray-500">Assessment due date reminders</p>
                </div>
                <Switch
                  checked={notificationSettings.dueDateReminders}
                  onCheckedChange={(checked) => handleNotificationUpdate('dueDateReminders', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Weather Alerts</p>
                  <p className="text-xs text-gray-500">Weather conditions for field work</p>
                </div>
                <Switch
                  checked={notificationSettings.weatherAlerts}
                  onCheckedChange={(checked) => handleNotificationUpdate('weatherAlerts', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Professional Development</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Training Alerts</p>
                  <p className="text-xs text-gray-500">Training session reminders</p>
                </div>
                <Switch
                  checked={notificationSettings.trainingAlerts}
                  onCheckedChange={(checked) => handleNotificationUpdate('trainingAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Equipment Alerts</p>
                  <p className="text-xs text-gray-500">Equipment maintenance reminders</p>
                </div>
                <Switch
                  checked={notificationSettings.equipmentAlerts}
                  onCheckedChange={(checked) => handleNotificationUpdate('equipmentAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Performance Reports</p>
                  <p className="text-xs text-gray-500">Monthly performance summaries</p>
                </div>
                <Switch
                  checked={notificationSettings.performanceReports}
                  onCheckedChange={(checked) => handleNotificationUpdate('performanceReports', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Clean Header */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "profile", label: "Profile", icon: User },
                { id: "security", label: "Security", icon: Shield }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-green-500 text-gray-900"
                        : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
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
          <div className="p-6">
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "security" && renderSecurityTab()}
          </div>

          {/* Save Button */}
          <div className="flex justify-end px-6 pb-6 pt-4 border-t border-gray-200">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white min-w-[120px] text-xs h-9"
              onClick={handleSaveChanges}
              disabled={saving || loading}
            >
              <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
