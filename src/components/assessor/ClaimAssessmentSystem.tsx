import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  MapPin,
  Search,
  Filter,
  Plus,
  FileText,
  AlertCircle
} from "lucide-react";

interface AssessmentSummary {
  id: string;
  farmerName: string;
  location: string;
  type: string;
  status: string;
  date: string;
}

interface Field {
  id: string;
  farmerName: string;
  crop: string;
  area: number;
  season: string;
  status: string;
  fieldName: string;
  sowingDate: string;
}

export default function ClaimAssessmentSystem() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentSummary | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "fieldSelection" | "fieldDetail">("list");
  
  // Mock data for Claim Assessments only
  const assessments: AssessmentSummary[] = [
    {
      id: "CLAIM-001",
      farmerName: "Uwase Marie",
      location: "Bugesera, Eastern Province",
      type: "Claim Assessment",
      status: "Under Review",
      date: "2024-10-01"
    },
    {
      id: "CLAIM-002",
      farmerName: "Kayitesi Grace",
      location: "Kirehe, Eastern Province",
      type: "Claim Assessment",
      status: "Pending",
      date: "2024-09-28"
    },
    {
      id: "CLAIM-003",
      farmerName: "Niyonshuti Joseph",
      location: "Ngoma, Eastern Province",
      type: "Claim Assessment",
      status: "Submitted",
      date: "2024-09-20"
    }
  ];

  // Mock field data for farmers
  const fieldsByFarmer: Record<string, Field[]> = {
    "Uwase Marie": [
      {
        id: "FLD-006",
        farmerName: "Uwase Marie",
        crop: "Beans",
        area: 1.2,
        season: "B",
        status: "Processing Needed",
        fieldName: "Primary Bean Field",
        sowingDate: "2025-09-08"
      }
    ],
    "Kayitesi Grace": [
      {
        id: "FLD-008",
        farmerName: "Kayitesi Grace",
        crop: "Maize",
        area: 2.0,
        season: "A",
        status: "Processed",
        fieldName: "Central Maize Field",
        sowingDate: "2025-03-15"
      }
    ],
    "Niyonshuti Joseph": [
      {
        id: "FLD-009",
        farmerName: "Niyonshuti Joseph",
        crop: "Rice",
        area: 1.8,
        season: "B",
        status: "Processed",
        fieldName: "River Rice Paddy",
        sowingDate: "2025-09-01"
      }
    ]
  };

  const getFieldsForAssessment = (assessment: AssessmentSummary): Field[] => {
    return fieldsByFarmer[assessment.farmerName] || [];
  };

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = searchQuery === "" ||
      assessment.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
  };

  const handleAssessmentClick = (assessment: AssessmentSummary) => {
    setSelectedAssessment(assessment);
    setViewMode("fieldSelection");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedAssessment(null);
    setSelectedField(null);
  };

  const renderFieldSelection = () => {
    if (!selectedAssessment) return null;
    const fields = getFieldsForAssessment(selectedAssessment);
    
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={handleBackToList}
            className="text-teal-400 hover:text-teal-300"
          >
            Claim Assessments
          </button>
          <span className="text-white/60">/</span>
          <span className="text-white">{selectedAssessment.farmerName}</span>
        </div>

        {/* Table */}
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-6 font-medium text-white/80">Field ID</th>
                    <th className="text-left py-4 px-6 font-medium text-white/80">Farmer</th>
                    <th className="text-left py-4 px-6 font-medium text-white/80">Crop</th>
                    <th className="text-left py-4 px-6 font-medium text-white/80">Area (ha)</th>
                    <th className="text-left py-4 px-6 font-medium text-white/80">Season</th>
                    <th className="text-left py-4 px-6 font-medium text-white/80">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr
                      key={field.id}
                      className={`border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors ${
                        index % 2 === 0 ? "bg-gray-950/30" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-white">{field.id}</td>
                      <td className="py-4 px-6 text-white">{field.farmerName}</td>
                      <td className="py-4 px-6 text-white">{field.crop}</td>
                      <td className="py-4 px-6 text-white">{field.area} ha</td>
                      <td className="py-4 px-6 text-white">{field.season}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          field.status === "Processed"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}>
                          {field.status}
                        </span>
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
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-4xl font-bold text-white">Claim Assessments</h1>
        <p className="text-white/70 mt-2">Manage and review claim assessments for farmers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Claims</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{assessments.length}</div>
            <p className="text-xs text-white/60 mt-1">All claim assessments</p>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Submitted</CardTitle>
            <FileText className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{assessments.filter(a => a.status === "Submitted").length}</div>
            <p className="text-xs text-white/60 mt-1">Ready for review</p>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card} border-l-4 border-l-yellow-500`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Pending</CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{assessments.filter(a => a.status === "Pending").length}</div>
            <p className="text-xs text-white/60 mt-1">Awaiting submission</p>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Under Review</CardTitle>
            <FileText className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{assessments.filter(a => a.status === "Under Review").length}</div>
            <p className="text-xs text-white/60 mt-1">In review process</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            View Claims
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${dashboardTheme.input} pl-10 w-64 border-gray-300`}
            />
          </div>
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button className={`${dashboardTheme.card} text-white hover:bg-gray-800 border border-gray-700`}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className={`${dashboardTheme.card} border-gray-800`}>
              <DialogHeader>
                <DialogTitle className="text-white">Filter Claim Assessments</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="status-filter" className="text-white/80">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className={`${dashboardTheme.select} mt-1`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={dashboardTheme.card}>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => setFilterDialogOpen(false)}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Claim Assessment
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className={`${dashboardTheme.card}`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-6 font-medium text-white/80">Assessment ID</th>
                  <th className="text-left py-4 px-6 font-medium text-white/80">Farmer Name</th>
                  <th className="text-left py-4 px-6 font-medium text-white/80">Location</th>
                  <th className="text-left py-4 px-6 font-medium text-white/80">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-white/80">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment, index) => (
                    <tr
                      key={assessment.id}
                      onClick={() => handleAssessmentClick(assessment)}
                      className={`border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors cursor-pointer ${
                        index % 2 === 0 ? "bg-gray-950/30" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-white">{assessment.id}</td>
                      <td className="py-4 px-6 text-white">{assessment.farmerName}</td>
                      <td className="py-4 px-6 text-white/80">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-teal-500" />
                          {assessment.location}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          {assessment.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-white/80">{assessment.date}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render view based on mode
  if (viewMode === "fieldSelection") {
    return renderFieldSelection();
  }

  return renderDashboard();
}
