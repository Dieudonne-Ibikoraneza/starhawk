import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PolicyDetailsView from "./PolicyDetailsView";
import { getPolicies, getPolicyById, updatePolicy as updatePolicyApi, deletePolicy as deletePolicyApi } from "@/services/policiesApi";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Shield,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from "lucide-react";

interface Policy {
  id: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  coverageAmount: number;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "expired" | "cancelled";
  location: string;
  farmSize: number;
  riskLevel: "low" | "medium" | "high";
  deductible: number;
  createdAt: string;
}

interface PolicyManagementProps {
  onNavigateToCreate?: () => void;
}

export default function PolicyManagement({ onNavigateToCreate }: PolicyManagementProps = {}) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cropFilter, setCropFilter] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);

  // Load policies from API
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await getPolicies(1, 100);
      let policiesData: any[] = [];
      
      if (Array.isArray(response)) {
        policiesData = response;
      } else if (response && typeof response === 'object') {
        policiesData = response.data || response.policies || [];
      }
      
      // Map API response to Policy interface
      const mappedPolicies: Policy[] = policiesData.map((policy: any) => ({
        id: policy._id || policy.id || '',
        farmerId: policy.farmerId || policy.farmer?._id || policy.farmer?.id || '',
        farmerName: policy.farmer?.firstName && policy.farmer?.lastName 
          ? `${policy.farmer.firstName} ${policy.farmer.lastName}` 
          : policy.farmer?.name || policy.farmerName || 'Unknown Farmer',
        cropType: policy.cropType || 'Unknown',
        coverageAmount: policy.coverageAmount || policy.coverage || 0,
        premiumAmount: policy.premiumAmount || policy.premium || 0,
        startDate: policy.startDate || policy.validityPeriod?.start || new Date().toISOString().split('T')[0],
        endDate: policy.endDate || policy.validityPeriod?.end || policy.validityPeriod || new Date().toISOString().split('T')[0],
        status: (policy.status || 'pending').toLowerCase() as "active" | "pending" | "expired" | "cancelled",
        location: policy.location || policy.farm?.location || 'Unknown',
        farmSize: policy.farmSize || policy.farm?.size || 0,
        riskLevel: (policy.riskLevel || 'medium').toLowerCase() as "low" | "medium" | "high",
        deductible: policy.deductible || 0,
        createdAt: policy.createdAt || policy.created || new Date().toISOString().split('T')[0],
      }));
      
      setPolicies(mappedPolicies);
    } catch (err: any) {
      console.error('Failed to load policies:', err);
      setError(err.message || 'Failed to load policies');
      toast({
        title: "Error",
        description: err.message || 'Failed to load policies',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  // Form state for edit
  const [formData, setFormData] = useState({
    farmerId: "",
    farmerName: "",
    cropType: "",
    coverageAmount: "",
    premiumAmount: "",
    startDate: "",
    endDate: "",
    location: "",
    farmSize: "",
    riskLevel: "low",
    deductible: ""
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "expired": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-700 text-white";
      default: return "bg-gray-700 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "expired": return <AlertTriangle className="h-4 w-4" />;
      case "cancelled": return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-700 text-white";
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.farmerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || policy.status === statusFilter;
    const matchesCrop = cropFilter === "all" || policy.cropType === cropFilter;
    
    return matchesSearch && matchesStatus && matchesCrop;
  });


  const handleEditPolicy = async () => {
    if (!selectedPolicy) return;

    try {
      const updateData = {
        coverageAmount: parseFloat(formData.coverageAmount),
        premium: parseFloat(formData.premiumAmount),
        endDate: formData.endDate,
        status: selectedPolicy.status,
        notes: formData.location ? `Location: ${formData.location}` : undefined,
      };

      await updatePolicyApi(selectedPolicy.id, updateData);
      
      toast({
        title: "Success",
        description: "Policy updated successfully",
        variant: "default",
      });
      
      // Reload policies
      loadPolicies();
      setIsEditDialogOpen(false);
      setSelectedPolicy(null);
      resetForm();
    } catch (err: any) {
      console.error('Failed to update policy:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to update policy',
        variant: "destructive",
      });
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) {
      return;
    }

    try {
      await deletePolicyApi(policyId);
      
      toast({
        title: "Success",
        description: "Policy deleted successfully",
        variant: "default",
      });
      
      // Reload policies
      loadPolicies();
    } catch (err: any) {
      console.error('Failed to delete policy:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to delete policy',
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (policyId: string, newStatus: Policy["status"]) => {
    try {
      await updatePolicyApi(policyId, { status: newStatus });
      
      toast({
        title: "Success",
        description: "Policy status updated successfully",
        variant: "default",
      });
      
      // Reload policies
      loadPolicies();
    } catch (err: any) {
      console.error('Failed to update policy status:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to update policy status',
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (policy: Policy) => {
    setSelectedPolicy(policy);
    setFormData({
      farmerId: policy.farmerId,
      farmerName: policy.farmerName,
      cropType: policy.cropType,
      coverageAmount: policy.coverageAmount.toString(),
      premiumAmount: policy.premiumAmount.toString(),
      startDate: policy.startDate,
      endDate: policy.endDate,
      location: policy.location,
      farmSize: policy.farmSize.toString(),
      riskLevel: policy.riskLevel,
      deductible: policy.deductible.toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleViewPolicy = (policy: Policy) => {
    setViewingPolicy(policy);
  };

  const handleBackToList = () => {
    setViewingPolicy(null);
  };

  const handleEditFromDetails = (updatedPolicy: Policy) => {
    setPolicies(policies.map(policy => 
      policy.id === updatedPolicy.id ? updatedPolicy : policy
    ));
  };

  const handleCreateClick = () => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
  };

  const renderEditPolicyForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-cropType">Crop Type</Label>
          <Select value={formData.cropType} onValueChange={(value) => setFormData({...formData, cropType: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select crop type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maize">Maize</SelectItem>
              <SelectItem value="rice">Rice</SelectItem>
              <SelectItem value="potatoes">Potatoes</SelectItem>
              <SelectItem value="beans">Beans</SelectItem>
              <SelectItem value="wheat">Wheat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-farmSize">Farm Size (hectares)</Label>
          <Input
            id="edit-farmSize"
            type="number"
            value={formData.farmSize}
            onChange={(e) => setFormData({...formData, farmSize: e.target.value})}
            placeholder="Enter farm size"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-coverageAmount">Coverage Amount (RWF)</Label>
          <Input
            id="edit-coverageAmount"
            type="number"
            value={formData.coverageAmount}
            onChange={(e) => setFormData({...formData, coverageAmount: e.target.value})}
            placeholder="Enter coverage amount"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-premiumAmount">Premium Amount (RWF)</Label>
          <Input
            id="edit-premiumAmount"
            type="number"
            value={formData.premiumAmount}
            onChange={(e) => setFormData({...formData, premiumAmount: e.target.value})}
            placeholder="Enter premium amount"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-startDate">Start Date</Label>
          <Input
            id="edit-startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-endDate">End Date</Label>
          <Input
            id="edit-endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-location">Location</Label>
          <Input
            id="edit-location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="Enter location"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-riskLevel">Risk Level</Label>
          <Select value={formData.riskLevel} onValueChange={(value) => setFormData({...formData, riskLevel: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-deductible">Deductible (RWF)</Label>
        <Input
          id="edit-deductible"
          type="number"
          value={formData.deductible}
          onChange={(e) => setFormData({...formData, deductible: e.target.value})}
          placeholder="Enter deductible amount"
        />
      </div>
    </div>
  );

  // If viewing a specific policy, show the details view
  if (viewingPolicy) {
    return (
      <PolicyDetailsView
        policy={viewingPolicy}
        onBack={handleBackToList}
        onEdit={handleEditFromDetails}
        onDelete={handleDeletePolicy}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage insurance policies for farmers</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
          >
            {viewMode === "table" ? "Grid View" : "Table View"}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Create Policy
              </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search policies by farmer name, ID, or policy ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cropFilter} onValueChange={setCropFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Crop Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  <SelectItem value="maize">Maize</SelectItem>
                  <SelectItem value="rice">Rice</SelectItem>
                  <SelectItem value="potatoes">Potatoes</SelectItem>
                  <SelectItem value="beans">Beans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
              <Button
                onClick={loadPolicies}
                variant="outline"
                size="sm"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Total Policies</p>
                <p className="text-2xl font-bold text-white">{policies.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Active Policies</p>
                <p className="text-2xl font-bold text-white">{policies.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Pending Policies</p>
                <p className="text-2xl font-bold text-white">{policies.filter(p => p.status === 'pending').length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Total Coverage</p>
                <p className="text-2xl font-bold text-white">
                  {(policies.reduce((sum, p) => sum + p.coverageAmount, 0) / 1000000).toFixed(1)}M RWF
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policies ({filteredPolicies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-white/60">Loading policies...</p>
              </div>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-white/40" />
                <p className="text-white/60">No policies found</p>
                {searchTerm || statusFilter !== "all" || cropFilter !== "all" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCropFilter("all");
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Policy ID</th>
                    <th className="text-left p-3 font-medium">Farmer</th>
                    <th className="text-left p-3 font-medium">Crop</th>
                    <th className="text-left p-3 font-medium">Coverage</th>
                    <th className="text-left p-3 font-medium">Premium</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Risk</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{policy.id}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{policy.farmerName}</div>
                        <div className="text-sm text-gray-500">{policy.farmerId}</div>
                      </div>
                    </td>
                    <td className="p-3">{policy.cropType}</td>
                    <td className="p-3">{policy.coverageAmount.toLocaleString()} RWF</td>
                    <td className="p-3">{policy.premiumAmount.toLocaleString()} RWF</td>
                    <td className="p-3">
                      <Badge className={getStatusColor(policy.status)}>
                        {getStatusIcon(policy.status)}
                        <span className="ml-1 capitalize">{policy.status}</span>
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={getRiskLevelColor(policy.riskLevel)}>
                        {policy.riskLevel} risk
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPolicy(policy)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(policy)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePolicy(policy.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Select
                          value={policy.status}
                          onValueChange={(value) => handleUpdateStatus(policy.id, value as Policy["status"])}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Policy - {selectedPolicy?.id}</DialogTitle>
          </DialogHeader>
          {renderEditPolicyForm()}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPolicy}>
              Update Policy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
