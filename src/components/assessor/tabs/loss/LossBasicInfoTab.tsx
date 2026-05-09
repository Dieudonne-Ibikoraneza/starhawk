import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, MapPin, Calendar, Info, Clock, CheckCircle2, User, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FieldMapWithLayers } from "../../FieldMapWithLayers";
import { Claim } from "@/lib/api/services/claims";
import { formatBackendEnumLabel, formatCropTypeLabel } from "@/lib/crops";

interface LossBasicInfoTabProps {
  field: any;
  claim: Claim;
  farmerName: string;
  farmer?: any;
  policy?: any;
  showFinancials?: boolean;
}

export const LossBasicInfoTab = ({
  field,
  claim,
  farmerName,
  farmer,
  policy,
  showFinancials,
}: LossBasicInfoTabProps) => {
  const actualFieldId = field?._id || field?.id;
  const formattedFieldId = actualFieldId
    ? `FLD-${actualFieldId.slice(0, 3).toUpperCase()}`
    : "N/A";

  const locationCoords = field?.location?.coordinates || field?.locationCoords;
  const center =
    locationCoords && locationCoords.length >= 2
      ? ([locationCoords[1], locationCoords[0]] as [number, number])
      : undefined;

  const dateFiled = claim.filedAt || claim.filedDate || claim.createdAt;
  const lossEventDate = claim.lossEventDate || claim.incidentDate;
  const lossDescription = claim.lossDescription || claim.description;
  const estimatedLoss = claim.estimatedLoss !== undefined && claim.estimatedLoss !== null 
    ? claim.estimatedLoss 
    : (claim.claimAmount || claim.amount || undefined);
  const damagePhotos = claim.damagePhotos || (claim as any).photos || [];

  const formatSowingDate = (sowingDate?: string): string => {
    if (!sowingDate) return "N/A";
    try {
      const date = new Date(sowingDate);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getLocation = (f: any): string => {
    if (f?.locationName) return f.locationName;
    if (f?.location?.coordinates && f.location.coordinates.length >= 2) {
      const lat = f.location.coordinates[1];
      const lng = f.location.coordinates[0];
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return "Location not available";
  };

  const getSeasonFromSowingDate = (sowingDate?: string): string => {
    if (!sowingDate) return "Season A";
    const date = new Date(sowingDate);
    if (isNaN(date.getTime())) return "Season A";
    const month = date.getMonth(); // 0-11
    // Rwanda has two seasons:
    // Season A: September-January
    // Season B: February-June
    if (month >= 8 || month <= 0) {
      return "Season A";
    } else if (month >= 1 && month <= 5) {
      return "Season B";
    }
    return "Season A";
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Field & Farmer Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Field Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Farmer</p>
                <p className="font-medium">{farmerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Field ID</p>
                <p className="font-medium font-mono text-sm">{formattedFieldId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Crop Type</p>
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-primary" />
                  <p className="font-medium">{formatCropTypeLabel(field?.cropType)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Area</p>
                <p className="font-medium">{field?.area || "0"} hectares</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Season</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <p className="font-medium">{getSeasonFromSowingDate(field?.sowingDate)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="font-medium">{getLocation(field)}</p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Financials (Optional - for Insurer) */}
          {showFinancials && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary uppercase flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Policy Premium</span>
                  <span className="font-semibold">
                    {policy?.premiumAmount?.toLocaleString()} RWF
                  </span>
                </div>
                {claim.payoutAmount !== undefined && claim.payoutAmount !== null ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payout Decided</span>
                      <span className="font-semibold text-green-600">
                        {claim.payoutAmount.toLocaleString()} RWF
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold">Total Payout</span>
                      <span className="text-xl font-bold text-primary">
                        {claim.payoutAmount.toLocaleString()} RWF
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground italic text-xs">
                      Payout pending decision...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Claim Info */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Claim Information</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium bg-muted text-muted-foreground">
                ID: {claim._id.substring(claim._id.length - 8).toUpperCase()}
              </Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {formatBackendEnumLabel(claim.lossEventType)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date Filed</p>
                  <p className="font-medium">{dateFiled ? new Date(dateFiled).toLocaleDateString() : "N/A"}</p>
                </div>
                {lossEventDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Incident Date</p>
                    <p className="font-medium">{new Date(lossEventDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Loss Event</p>
                  <p className="font-medium text-lg text-destructive">
                    {formatBackendEnumLabel(claim.lossEventType)}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Claim Status</p>
                  <Badge variant="secondary" className="font-medium capitalize">
                    {claim.status.replace("_", " ")}
                  </Badge>
                </div>
                {estimatedLoss !== undefined && estimatedLoss !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Loss</p>
                    <p className="font-black text-xl text-amber-600">{estimatedLoss.toLocaleString()} RWF</p>
                  </div>
                )}
              </div>

              {lossDescription && (
                <div className="col-span-2 pt-4 border-t border-gray-100">
                  <p className="text-sm text-muted-foreground mb-1.5">Loss Description</p>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700 leading-relaxed italic">
                    "{lossDescription}"
                  </div>
                </div>
              )}

              {damagePhotos && damagePhotos.length > 0 && (
                <div className="col-span-2 pt-4 border-t border-gray-100">
                  <p className="text-sm text-muted-foreground mb-2">Damage Evidence Photos ({damagePhotos.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {damagePhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group hover:shadow-md transition-all">
                        <img 
                          src={photo} 
                          alt={`Damage Photo ${index + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                          <span className="text-white text-xs font-semibold px-2.5 py-1 bg-black/60 rounded-lg">Photo {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t h-[400px]">
               <FieldMapWithLayers
                fieldId={field?.id}
                showLayerControls={false}
                boundary={field?.boundary}
                center={center}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
