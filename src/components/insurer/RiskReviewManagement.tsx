import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RiskReviewDetailsView from "./RiskReviewDetailsView";
import { 
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Crop,
  BarChart3
} from "lucide-react";

interface RiskAssessment {
  id: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  farmSize: number;
  location: string;
  assessorId: string;
  assessorName: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending_review" | "approved" | "rejected" | "under_review";
  submittedDate: string;
  reviewDate?: string;
  coverageRecommendation?: number;
  premiumRecommendation?: number;
  riskFactors: string[];
  mitigationMeasures: string[];
  weatherRisk: number;
  soilQuality: number;
  marketRisk: number;
  pestRisk: number;
  overallScore: number;
  notes?: string;
  reviewerNotes?: string;
  decision?: "approve" | "reject" | "request_more_info";
}

export default function RiskReviewManagement() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskLevelFilter, setRiskLevelFilter] = useState("all");
  const [viewingAssessment, setViewingAssessment] = useState<RiskAssessment | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "under_review": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-white/90";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_review": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <AlertTriangle className="h-4 w-4" />;
      case "under_review": return <Eye className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-white/90";
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.farmerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
    const matchesRiskLevel = riskLevelFilter === "all" || assessment.riskLevel === riskLevelFilter;
    
    return matchesSearch && matchesStatus && matchesRiskLevel;
  });

  const handleViewAssessment = (assessment: RiskAssessment) => {
    setViewingAssessment(assessment);
  };

  const handleBackToList = () => {
    setViewingAssessment(null);
  };

  const handleApprove = (assessmentId: string) => {
    setAssessments(assessments.map(assessment => 
      assessment.id === assessmentId 
        ? { ...assessment, status: "approved", reviewDate: new Date().toISOString().split('T')[0] }
        : assessment
    ));
    setViewingAssessment(null);
  };

  const handleReject = (assessmentId: string) => {
    setAssessments(assessments.map(assessment => 
      assessment.id === assessmentId 
        ? { ...assessment, status: "rejected", reviewDate: new Date().toISOString().split('T')[0] }
        : assessment
    ));
    setViewingAssessment(null);
  };

  const handleRequestMoreInfo = (assessmentId: string) => {
    setAssessments(assessments.map(assessment => 
      assessment.id === assessmentId 
        ? { ...assessment, status: "under_review" }
        : assessment
    ));
    setViewingAssessment(null);
  };

  // If viewing a specific assessment, show the details view
  if (viewingAssessment) {
    return (
      <RiskReviewDetailsView
        assessment={viewingAssessment}
        onBack={handleBackToList}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestMoreInfo={handleRequestMoreInfo}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Risk Assessment Reviews</h1>
        <p className="text-sm text-gray-600 mt-1">Review and approve risk assessments for farmers</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assessments by farmer name, ID, or assessment ID..."
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
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{assessments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.filter(a => a.status === 'pending_review').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.filter(a => a.status === 'approved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">High Risk</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.filter(a => a.riskLevel === 'high').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Risk Assessments ({filteredAssessments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Assessment ID</th>
                  <th className="text-left p-3 font-medium">Farmer</th>
                  <th className="text-left p-3 font-medium">Crop</th>
                  <th className="text-left p-3 font-medium">Risk Level</th>
                  <th className="text-left p-3 font-medium">Score</th>
                  <th className="text-left p-3 font-medium">Assessor</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{assessment.id}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{assessment.farmerName}</div>
                        <div className="text-sm text-gray-500">{assessment.farmerId}</div>
                      </div>
                    </td>
                    <td className="p-3">{assessment.cropType}</td>
                    <td className="p-3">
                      <Badge className={getRiskLevelColor(assessment.riskLevel)}>
                        {assessment.riskLevel} risk
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{assessment.overallScore}/100</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              assessment.overallScore >= 70 ? 'bg-green-500' : 
                              assessment.overallScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${assessment.overallScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{assessment.assessorName}</td>
                    <td className="p-3">
                      <Badge className={getStatusColor(assessment.status)}>
                        {getStatusIcon(assessment.status)}
                        <span className="ml-1 capitalize">{assessment.status.replace('_', ' ')}</span>
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAssessment(assessment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
