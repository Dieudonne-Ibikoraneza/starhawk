import { useState, useEffect } from "react";
import { getClaims } from "@/services/claimsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight,
  Eye,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  FileText
} from "lucide-react";

interface Claim {
  id: string;
  farmerId: string;
  farmerName: string;
  policyId: string;
  cropType: string;
  claimAmount: number;
  status: string;
  filedDate: string;
  incidentDate: string;
  description: string;
  location: string;
  assessorId: string;
  assessorName: string;
  priority: string;
}

export default function ClaimsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Load claims from API
  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const response: any = await getClaims(1, 100);
      let claimsData: any[] = [];
      
      if (Array.isArray(response)) {
        claimsData = response;
      } else if (response && typeof response === 'object') {
        claimsData = response.data || response.claims || [];
      }
      
      // Map API response to Claim interface
      const mappedClaims: Claim[] = claimsData.map((claim: any) => ({
        id: claim._id || claim.id || '',
        farmerId: claim.farmerId || claim.farmer?._id || claim.farmer?.id || '',
        farmerName: claim.farmer?.firstName && claim.farmer?.lastName 
          ? `${claim.farmer.firstName} ${claim.farmer.lastName}` 
          : claim.farmer?.name || claim.farmerName || 'Unknown Farmer',
        policyId: claim.policyId || claim.policy?._id || claim.policy?.id || '',
        cropType: claim.cropType || claim.policy?.cropType || 'Unknown',
        claimAmount: claim.amount || claim.claimAmount || 0,
        status: claim.status || 'pending_review',
        filedDate: claim.filedDate || claim.createdAt || new Date().toISOString().split('T')[0],
        incidentDate: claim.incidentDate || claim.incidentDate || new Date().toISOString().split('T')[0],
        description: claim.description || claim.lossDescription || '',
        location: claim.location || claim.farm?.location || 'Unknown',
        assessorId: claim.assessorId || claim.assessor?._id || claim.assessor?.id || '',
        assessorName: claim.assessor?.firstName && claim.assessor?.lastName
          ? `${claim.assessor.firstName} ${claim.assessor.lastName}`
          : claim.assessor?.name || claim.assessorName || 'Unassigned',
        priority: claim.priority || 'medium',
      }));
      
      setClaims(mappedClaims);
    } catch (err: any) {
      console.error('Failed to load claims:', err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "under_investigation": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-white/90";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_review": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <AlertTriangle className="h-4 w-4" />;
      case "under_investigation": return <Eye className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-white/90";
    }
  };

  const nextClaim = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === claims.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevClaim = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? claims.length - 1 : prevIndex - 1
    );
  };

  const goToClaim = (index: number) => {
    setCurrentIndex(index);
  };

  const currentClaim = claims[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Claims Review</h2>
          <p className="text-white/70">Browse through claims for review and decision making</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {currentIndex + 1} of {claims.length}
          </Badge>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        <Button
          variant="outline"
          size="sm"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg"
          onClick={prevClaim}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg"
          onClick={nextClaim}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Claim Card */}
        <Card className="mx-12 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <CardTitle className="text-xl">{currentClaim?.id || 'N/A'}</CardTitle>
                  <p className="text-sm text-white/70">Filed on {currentClaim?.filedDate || 'N/A'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(currentClaim?.priority || 'medium')}>
                    {currentClaim?.priority || 'medium'} priority
                  </Badge>
                  <Badge className={getStatusColor(currentClaim?.status || 'pending')}>
                    {getStatusIcon(currentClaim?.status || 'pending')}
                    <span className="ml-1 capitalize">{(currentClaim?.status || 'pending').replace('_', ' ')}</span>
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Claim Overview */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column - Claim Details */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-3">Claim Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">Claim Amount:</span>
                      <span className="font-semibold text-green-600">
                        {(currentClaim?.claimAmount || 0).toLocaleString()} RWF
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Policy ID:</span>
                      <span className="font-medium">{currentClaim?.policyId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Crop Type:</span>
                      <span className="font-medium">{currentClaim?.cropType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Incident Date:</span>
                      <span className="font-medium">{currentClaim?.incidentDate || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-3">Farmer Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{currentClaim?.farmerName || 'Unknown Farmer'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-white/70">ID: {currentClaim?.farmerId || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-white/70">{currentClaim?.location || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column - Assessment & Actions */}
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-3">Assessment Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{currentClaim?.assessorName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-white/70">ID: {currentClaim?.assessorId || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3 mr-1" />
                      Contact Assessor
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-3">Description</h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {currentClaim?.description || 'No description available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-4 border-t">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Navigate to detailed claim review page
                  if (currentClaim?.id) {
                    window.location.href = `/claim-review/${currentClaim.id}`;
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Review Full Details
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </Button>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                View Location
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center space-x-2">
        {claims.map((_, index) => (
          <button
            key={index}
            onClick={() => goToClaim(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex 
                ? "bg-blue-600" 
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {claims.filter(c => c.status === 'pending_review').length}
            </div>
            <p className="text-sm text-white/70">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {claims.filter(c => c.status === 'under_investigation').length}
            </div>
            <p className="text-sm text-white/70">Under Investigation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {claims.filter(c => c.status === 'approved').length}
            </div>
            <p className="text-sm text-white/70">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {claims.filter(c => c.status === 'rejected').length}
            </div>
            <p className="text-sm text-white/70">Rejected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
