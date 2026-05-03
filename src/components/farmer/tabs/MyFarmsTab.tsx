import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crop, TrendingUp, Shield, MapPin, Loader2, Plus, Search } from "lucide-react";
import { getFarms, getAllFarms } from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";

interface MyFarmsTabProps {
  onRegisterFarm: () => void;
  onViewDetails: (farm: any) => void;
  onViewAnalytics: (farm: any) => void;
  onRequestInsurance: (farm: any) => void;
}

export default function MyFarmsTab({ 
  onRegisterFarm, 
  onViewDetails, 
  onViewAnalytics,
  onRequestInsurance
}: MyFarmsTabProps) {
  const { toast } = useToast();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    setLoading(true);
    try {
      // API uses 0-indexed pages
      const response = await getFarms(0, 100);
      // Handle multiple response shapes: { data: { items } }, { items }, { data: [...] }, or direct array
      const items = response?.data?.items 
        || response?.items 
        || (Array.isArray(response?.data) ? response.data : null)
        || (Array.isArray(response) ? response : []);
      console.log('🌾 Farms loaded:', items.length, 'from response:', response);
      setFarms(items);
    } catch (err: any) {
      console.error('Failed to load farms:', err);
      toast({
        title: "Error",
        description: "Failed to load your farms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toDisplayText = (value: any, fallback: string = "N/A"): string => {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "object") return value.name || value.label || fallback;
    return String(value);
  };

  const formatLocation = (farm: any): string => {
    if (farm.locationName) return farm.locationName;
    if (farm.location?.name) return farm.location.name;
    const coords = farm.location?.coordinates || farm.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      return `${coords[1]?.toFixed(4)}, ${coords[0]?.toFixed(4)}`;
    }
    return "N/A";
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Farms</h1>
          <p className="text-gray-500 mt-1">Manage and monitor your registered agricultural fields.</p>
        </div>
        <Button 
          onClick={onRegisterFarm}
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Register New Farm
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {farms.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crop className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No farms registered</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                Start by registering your first farm to access insurance and monitoring services.
              </p>
              <Button 
                onClick={onRegisterFarm}
                variant="outline"
                className="mt-6 border-green-600 text-green-600 hover:bg-green-50"
              >
                Register Your First Farm
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Farm Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Crop Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Location</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {farms.map((farm) => {
                    const farmId = farm._id || farm.id;
                    const status = farm.status?.toUpperCase() || "REGISTERED";
                    
                    return (
                      <tr key={farmId} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900">{toDisplayText(farm.name, "Unnamed Farm")}</div>
                          <div className="text-xs text-gray-400 mt-0.5">ID: {farmId.substring(0, 8)}...</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            {toDisplayText(farm.cropType || farm.crop, "N/A")}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {formatLocation(farm)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`${
                            status === 'INSURED' ? 'bg-green-100 text-green-700 border-green-200' :
                            status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {status === 'REGISTERED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRequestInsurance(farm)}
                                className="h-8 border-green-600 text-green-600 hover:bg-green-50"
                              >
                                <Shield className="h-3.5 w-3.5 mr-1" />
                                Get Insured
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onViewAnalytics(farm)}
                              className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <TrendingUp className="h-3.5 w-3.5 mr-1" />
                              Analytics
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onViewDetails(farm)}
                              className="h-8 text-gray-500 hover:text-gray-900"
                            >
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
