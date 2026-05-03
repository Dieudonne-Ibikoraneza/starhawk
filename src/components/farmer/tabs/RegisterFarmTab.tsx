import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { 
  Sprout, Calendar, Building2, CheckCircle2, 
  ArrowLeft, Loader2, ShieldCheck, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createFarm } from "@/services/farmsApi";

// Predefined crop types
const PREDEFINED_CROPS = [
  "MAIZE",
  "BEANS",
  "RICE",
  "WHEAT",
  "SORGHUM",
  "POTATOES",
  "CASSAVA",
  "BANANAS",
  "COFFEE",
  "TEA",
  "OTHER"
];

interface RegisterFarmTabProps {
  onSuccess: () => void;
  onCancel: () => void;
  insurerId?: string;
  insurerName?: string;
}

export default function RegisterFarmTab({ onSuccess, onCancel, insurerId, insurerName }: RegisterFarmTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Default sowing date to 14 days from now
  const defaultSowingDate = format(addDays(new Date(), 14), "yyyy-MM-dd");
  
  const [formData, setFormData] = useState({
    cropType: "",
    sowingDate: defaultSowingDate,
  });

  const handleSubmit = async () => {
    if (!formData.cropType) {
      toast({
        title: "Crop Type Required",
        description: "Please select a crop type before continuing.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Auto-generate name based on crop
      const cropName = formData.cropType.charAt(0).toUpperCase() + formData.cropType.slice(1).toLowerCase();
      const generatedName = `New ${cropName} Farm`;

      await createFarm({
        name: generatedName,
        cropType: formData.cropType,
        sowingDate: formData.sowingDate,
        insurerId: insurerId,
        // Placeholder coordinates, real mapping is handled by admins/assessors
        coordinates: [0, 0] 
      });

      toast({
        title: "Farm Registered Successfully",
        description: "Your farm has been created. Admins and assessors will handle the mapping and validation.",
      });
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "An error occurred during registration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-500 hover:text-gray-900 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>

      <Card className="border-gray-200 shadow-xl bg-white overflow-hidden">
        <div className="h-2 bg-green-600 w-full" />
        <CardHeader className="pb-8 pt-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Sprout className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Register New Farm</CardTitle>
          <CardDescription className="text-base mt-2">
            Just provide the basics. Our assessors and admins will handle the field mapping and GIS onboarding.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 px-8">
          {/* Insurer Section (if provided) */}
          {insurerName && (
            <div className="p-5 bg-green-50/50 border border-green-100 rounded-2xl flex items-center gap-4">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600 shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-green-800/60 text-xs uppercase tracking-wider font-bold">Selected Insurer</Label>
                <div className="text-lg font-bold text-green-900 flex items-center gap-2">
                  {insurerName}
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="crop" className="text-sm font-semibold text-gray-700">What are you growing?</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PREDEFINED_CROPS.map((crop) => (
                  <button
                    key={crop}
                    onClick={() => setFormData({...formData, cropType: crop})}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      formData.cropType === crop 
                        ? 'bg-green-600 border-green-600 text-white shadow-md' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {formData.cropType === crop && <CheckCircle2 className="h-4 w-4" />}
                    {crop.charAt(0) + crop.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="sowing" className="text-sm font-semibold text-gray-700">Expected Sowing Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input 
                  id="sowing" 
                  type="date" 
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500 text-base"
                  value={formData.sowingDate}
                  onChange={(e) => setFormData({...formData, sowingDate: e.target.value})}
                />
              </div>
              <p className="text-xs text-gray-500 px-1">
                Defaults to 14 days from today to allow time for field assessment and mapping.
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-blue-900">What happens next?</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Once submitted, an assessor will be assigned to visit your farm, verify boundaries, and collect the required GIS data for satellite monitoring.
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50/50 border-t border-gray-100 py-6 px-8 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={loading} className="px-6 rounded-xl">Cancel</Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-green-200"
            onClick={handleSubmit}
            disabled={loading || !formData.cropType}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sprout className="h-5 w-5 mr-2" />}
            Register Farm
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
