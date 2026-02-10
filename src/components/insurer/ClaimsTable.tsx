import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClaimDetailView from "./ClaimDetailView";
import claimsApiService, { getClaims, approveClaim as approveClaimApi, rejectClaim as rejectClaimApi, assignAssessor as assignAssessorApi } from "@/services/claimsApi";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Filter,
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
  FileText,
  ChevronDown,
  ChevronUp
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

export default function ClaimsTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedPriority, setExpandedPriority] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load claims from API
  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try different pagination strategies to handle API inconsistencies
      let response: any = null;
      let claimsData: any[] = [];
      
      // Strategy 1: Try page 1 first
      console.log('Trying page 1 for claims...');
      response = await getClaims(1, 100);
      console.log('Claims API Response (page 1):', response);
      
      // Extract claims from response - handle multiple response structures
      // Response structure: { success: true, message: '...', data: Array(0) }
      if (response?.success && Array.isArray(response.data)) {
        // Direct array in data property (non-paginated)
        claimsData = response.data;
        console.log('Extracted claims from response.data (direct array):', claimsData);
      } else if (response?.success && response?.data?.items) {
        // Paginated response: { success: true, data: { items: [], ... } }
        claimsData = Array.isArray(response.data.items) ? response.data.items : [];
        console.log('Extracted claims from response.data.items (paginated):', claimsData);
      } else if (response?.success && response?.data?.data) {
        // Nested data structure: { success: true, data: { data: [] } }
        claimsData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('Extracted claims from response.data.data:', claimsData);
      } else if (Array.isArray(response)) {
        claimsData = response;
      } else if (Array.isArray(response?.data)) {
        claimsData = response.data;
      } else if (Array.isArray(response?.items)) {
        claimsData = response.items;
      } else if (Array.isArray(response?.results)) {
        claimsData = response.results;
      } else if (response?.data?.claims && Array.isArray(response.data.claims)) {
        claimsData = response.data.claims;
      } else if (response?.claims && Array.isArray(response.claims)) {
        claimsData = response.claims;
      }
      
      // Strategy 2: If page 1 returned empty items but totalItems > 0, try page 0
      if (claimsData.length === 0 && (response?.data?.totalItems > 0 || response?.data?.totalPages > 0)) {
        console.log('Page 1 returned empty items but totalItems > 0, trying page 0...');
        response = await getClaims(0, 100);
        console.log('Claims API Response (page 0):', response);
        
        if (response?.success && Array.isArray(response.data)) {
          claimsData = response.data;
        } else if (response?.success && response?.data?.items) {
          claimsData = Array.isArray(response.data.items) ? response.data.items : [];
        } else if (response?.success && response?.data?.data) {
          claimsData = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response)) {
          claimsData = response;
        } else if (Array.isArray(response?.data)) {
          claimsData = response.data;
        }
      }
      
      // Strategy 3: Try with larger page size if still empty
      if (claimsData.length === 0 && (response?.data?.totalItems > 0 || response?.data?.totalPages > 0)) {
        console.log('Trying with larger page size (500)...');
        response = await getClaims(0, 500);
        
        if (response?.success && Array.isArray(response.data)) {
          claimsData = response.data;
        } else if (response?.success && response?.data?.items) {
          claimsData = Array.isArray(response.data.items) ? response.data.items : [];
        } else if (response?.success && response?.data?.data) {
          claimsData = Array.isArray(response.data.data) ? response.data.data : [];
        }
      }
      
      // Strategy 4: Check if data structure has claims at a different location
      if (claimsData.length === 0 && response?.success) {
        console.warn('⚠️ Claims API returned success but no claims found in expected locations.');
        console.warn('Full response structure:', JSON.stringify(response, null, 2));
        
        // Check all possible locations for claims data
        if (response?.data && typeof response.data === 'object') {
          const possibleKeys = ['claims', 'items', 'results', 'content', 'data'];
          for (const key of possibleKeys) {
            if (Array.isArray(response.data[key])) {
              claimsData = response.data[key];
              console.log(`Found claims array at response.data.${key}:`, claimsData);
              break;
            }
          }
        }
      }
      
      console.log('Final extracted claims data:', claimsData);
      
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
      setError(err.message || 'Failed to load claims');
      toast({
        title: "Error",
        description: err.message || 'Failed to load claims',
        variant: "destructive",
      });
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
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_review": return <Clock className="h-3 w-3" />;
      case "approved": return <CheckCircle className="h-3 w-3" />;
      case "rejected": return <AlertTriangle className="h-3 w-3" />;
      case "under_investigation": return <Eye className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const handleViewClaim = (claim: Claim) => {
    setSelectedClaim(claim);
  };

  const handleBackToList = () => {
    setSelectedClaim(null);
  };

  const handleApproveClaim = async (claimId: string, approvedAmount?: number, notes?: string) => {
    try {
      await approveClaimApi(claimId, approvedAmount, notes);
      toast({
        title: "Success",
        description: "Claim approved successfully",
        variant: "default",
      });
      // Reload claims
      loadClaims();
      setSelectedClaim(null);
    } catch (err: any) {
      console.error('Failed to approve claim:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to approve claim',
        variant: "destructive",
      });
    }
  };

  const handleRejectClaim = async (claimId: string, reason: string) => {
    try {
      await rejectClaimApi(claimId, reason);
      toast({
        title: "Success",
        description: "Claim rejected successfully",
        variant: "default",
      });
      // Reload claims
      loadClaims();
      setSelectedClaim(null);
    } catch (err: any) {
      console.error('Failed to reject claim:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to reject claim',
        variant: "destructive",
      });
    }
  };

  const handleAssignAssessor = async (claimId: string, assessorId: string) => {
    try {
      await assignAssessorApi(claimId, assessorId);
      toast({
        title: "Success",
        description: "Assessor assigned successfully",
        variant: "default",
      });
      // Reload claims
      loadClaims();
    } catch (err: any) {
      console.error('Failed to assign assessor:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to assign assessor',
        variant: "destructive",
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Clock className="h-4 w-4" />;
      case "low": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.cropType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || claim.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group claims by priority
  const groupedClaims = {
    high: filteredClaims.filter(claim => claim.priority === "high"),
    medium: filteredClaims.filter(claim => claim.priority === "medium"),
    low: filteredClaims.filter(claim => claim.priority === "low")
  };

  const togglePriority = (priority: string) => {
    setExpandedPriority(expandedPriority === priority ? null : priority);
  };

  const renderClaimCard = (claim: Claim) => (
    <Card key={claim.id} className={`${dashboardTheme.card} cursor-pointer border-l-4 border-l-blue-400`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{claim.id}</h3>
            <p className="text-sm text-gray-600">{claim.farmerName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(claim.status)}>
              {getStatusIcon(claim.status)}
              <span className="ml-1 text-xs">{claim.status.replace('_', ' ')}</span>
            </Badge>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-green-600">
              {claim.claimAmount.toLocaleString()} RWF
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Crop:</span>
            <span className="font-medium text-gray-900">{claim.cropType}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Filed:</span>
            <span className="font-medium text-gray-900">{claim.filedDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {claim.location}
          </div>
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            {claim.assessorName}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => handleViewClaim(claim)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
          <Button size="sm" variant="outline">
            <Phone className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPrioritySection = (priority: string, claims: Claim[]) => {
    if (claims.length === 0) return null;

    const priorityLabels = {
      high: "High Priority",
      medium: "Medium Priority", 
      low: "Low Priority"
    };

    const isExpanded = expandedPriority === priority;

    return (
      <div key={priority} className="mb-6">
        <Card className={`${dashboardTheme.card} mb-4`}>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => togglePriority(priority)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPriorityColor(priority)}`}>
                  {getPriorityIcon(priority)}
                </div>
                <div>
                  <CardTitle className="text-lg">{priorityLabels[priority as keyof typeof priorityLabels]}</CardTitle>
                  <p className="text-sm text-gray-600">{claims.length} claims</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(priority)}>
                  {claims.length}
                </Badge>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </Card>

        {isExpanded && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {claims.map(renderClaimCard)}
          </div>
        )}
      </div>
    );
  };

  // Show detailed view if a claim is selected
  if (selectedClaim) {
    return (
      <ClaimDetailView
        claim={selectedClaim}
        onBack={handleBackToList}
        onApprove={handleApproveClaim}
        onReject={handleRejectClaim}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Claims Review</h1>
        <p className="text-sm text-gray-600 mt-1">Review and manage insurance claims by priority</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search claims by ID, farmer name, or crop type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="under_investigation">Under Investigation</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Sections */}
      {Object.entries(groupedClaims).map(([priority, claims]) => 
        renderPrioritySection(priority, claims)
      )}

      {/* Empty State */}
      {filteredClaims.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {groupedClaims.high.length}
            </div>
            <p className="text-sm text-gray-600">High Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {groupedClaims.medium.length}
            </div>
            <p className="text-sm text-gray-600">Medium Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {groupedClaims.low.length}
            </div>
            <p className="text-sm text-gray-600">Low Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredClaims.length}
            </div>
            <p className="text-sm text-gray-600">Total Claims</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
