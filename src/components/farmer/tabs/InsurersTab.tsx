import { useState, useEffect } from "react";
import { getInsurers } from "@/services/usersAPI";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Building2, Globe, Mail, Phone, Info, ArrowRight, 
  ShieldCheck, ArrowLeft, MapPin, FileText, Sprout, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InsurersTabProps {
  /** Called when user explicitly selects a provider (e.g. from a "Select" CTA) */
  onSelectProvider?: (insurerId: string) => void;
  /** Called when user wants to register a farm with a specific insurer */
  onRegisterFarm?: (insurerId: string, insurerName: string) => void;
  /** If true, shows prominent "Select" buttons (used in the farm registration flow) */
  selectionMode?: boolean;
}

export default function InsurersTab({ onSelectProvider, onRegisterFarm, selectionMode = false }: InsurersTabProps) {
  const { toast } = useToast();
  const [insurers, setInsurers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsurer, setSelectedInsurer] = useState<any | null>(null);

  useEffect(() => {
    fetchInsurers();
  }, []);

  const fetchInsurers = async () => {
    setLoading(true);
    try {
      const response = await getInsurers(0, 100);
      const items = response?.data?.items 
        || response?.items 
        || (Array.isArray(response?.data) ? response.data : null)
        || (Array.isArray(response) ? response : []);
      setInsurers(items);
    } catch (err: any) {
      console.error('Failed to fetch insurers:', err);
      toast({
        title: "Error",
        description: "Could not load insurers. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInsurerName = (insurer: any): string => {
    return insurer.insurerProfile?.companyName 
      || `${insurer.firstName || ''} ${insurer.lastName || ''}`.trim() 
      || "Insurance Provider";
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  // ── Detail View ──
  if (selectedInsurer) {
    const insurer = selectedInsurer;
    const name = getInsurerName(insurer);
    const profile = insurer.insurerProfile || {};

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedInsurer(null)}
          className="text-gray-500 hover:text-gray-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Insurers
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 flex items-center justify-center shrink-0">
            {profile.companyLogoUrl ? (
              <img 
                src={profile.companyLogoUrl} 
                alt={name} 
                className="h-full w-full object-cover rounded-2xl" 
              />
            ) : (
              <Building2 className="h-12 w-12 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
            <p className="text-gray-500 text-lg mt-1">
              {profile.bio || profile.companyDescription || "Licensed agricultural insurance provider."}
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{profile.officialEmail || insurer.email || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.officialPhone || insurer.phoneNumber || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Website</p>
                  {profile.website ? (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-green-600 hover:underline flex items-center gap-1">
                      {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">N/A</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional details */}
        {(profile.licenseNumber || profile.address || profile.specialties) && (
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.licenseNumber && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">License Number</p>
                    <p className="text-sm text-gray-900">{profile.licenseNumber}</p>
                  </div>
                </div>
              )}
              {profile.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Address</p>
                    <p className="text-sm text-gray-900">{profile.address}</p>
                  </div>
                </div>
              )}
              {profile.specialties && (
                <div className="flex items-start gap-3">
                  <Sprout className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Specialties</p>
                    <p className="text-sm text-gray-900">{Array.isArray(profile.specialties) ? profile.specialties.join(', ') : profile.specialties}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action: Register farm with this insurer */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                  <Sprout className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Register a Farm with {name}</h3>
                  <p className="text-sm text-gray-600">Start the farm registration process with this insurer pre-selected.</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  const id = insurer._id || insurer.id;
                  if (onRegisterFarm) {
                    onRegisterFarm(id, name);
                  } else if (onSelectProvider) {
                    onSelectProvider(id);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 px-8 whitespace-nowrap"
              >
                <Sprout className="h-4 w-4 mr-2" />
                Register Farm
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          {selectionMode && (
            <Badge variant="outline" className="text-amber-600 border-amber-600/20 bg-amber-50 px-3 py-1">
              Step 1 — Choose Your Insurer
            </Badge>
          )}
          {!selectionMode && (
            <Badge variant="outline" className="text-green-600 border-green-600/20 bg-green-50 px-3 py-1">
              Marketplace
            </Badge>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {selectionMode ? "Select an Insurance Provider" : "Insurance Providers"}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            {selectionMode 
              ? "Choose an insurance provider for your new farm. You can view their details before selecting."
              : "Browse through our trusted insurance partners. Click on a provider to view their full details."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insurers.map((insurer: any) => {
          const name = getInsurerName(insurer);
          const profile = insurer.insurerProfile || {};
          
          return (
            <Card 
              key={insurer.id || insurer._id} 
              className="group overflow-hidden border-gray-200 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl shadow-sm bg-white cursor-pointer"
              onClick={() => setSelectedInsurer(insurer)}
            >
              <CardHeader className="pb-4 relative">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 transition-transform duration-500">
                    {profile.companyLogoUrl ? (
                      <img 
                        src={profile.companyLogoUrl} 
                        alt={name} 
                        className="h-full w-full object-cover rounded-xl" 
                      />
                    ) : (
                      <Building2 className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl group-hover:text-green-600 transition-colors text-gray-900">
                      {name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1 min-h-[1.25rem] text-gray-500">
                      {profile.website && (
                        <>
                          <Globe className="h-3 w-3" />
                          {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3 min-h-[4.5rem]">
                  {profile.bio || profile.companyDescription || "No description available for this insurance provider."}
                </p>
                
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Mail className="h-4 w-4 text-green-600/70" />
                    <span className="truncate">{profile.officialEmail || insurer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Phone className="h-4 w-4 text-green-600/70" />
                    <span>{profile.officialPhone || insurer.phoneNumber}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50/50 pt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-gray-200 text-gray-700 hover:bg-white"
                  onClick={(e) => { e.stopPropagation(); setSelectedInsurer(insurer); }}
                >
                  <Info className="h-4 w-4" />
                  View Details
                </Button>
                {selectionMode && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const id = insurer._id || insurer.id;
                      if (onRegisterFarm) {
                        onRegisterFarm(id, name);
                      } else if (onSelectProvider) {
                        onSelectProvider?.(id);
                      }
                    }}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200"
                  >
                    Select
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {insurers.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-gray-50 border-gray-200">
          <ShieldCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">No insurers found</h3>
          <p className="text-gray-500">We couldn't find any active insurance providers at the moment.</p>
        </div>
      )}
    </div>
  );
}
