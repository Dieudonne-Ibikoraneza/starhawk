import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/ui/skeletons";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { 
  Users, 
  Sprout, 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ChevronDown,
  AlertCircle,
  X
} from "lucide-react";

interface AssessorDashboardOverviewProps {
  totalFarmers: number;
  totalFields: number;
  totalArea: number;
  activeAssessments: number;
  activeView: "farmers" | "fields" | "farmerFields";
  setActiveView: (view: "farmers" | "fields" | "farmerFields") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setFilterDialogOpen: (open: boolean) => void;
  setShowDrawField: (show: boolean) => void;
  error: string | null;
  farmsError: string | null;
  loadAssessments: () => void;
  loadFarms: () => void;
  loading: boolean;
  farmsLoading: boolean;
  exportToCSV: () => void;
  exportToPDF: () => void;
  farmers: any[];
  expandedFarmers: Set<string>;
  farmerFields: Record<string, any[]>;
  loadingFields: Record<string, boolean>;
  onFarmerRowClick: (id: string) => void;
  onViewFarmerFields: (farmer: any) => void;
  onToggleFarmerExpansion: (id: string) => void;
  onViewFarmerDetail: (farmer: any) => void;
}

export default function AssessorDashboardOverview({
  totalFarmers,
  totalFields,
  totalArea,
  activeAssessments,
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  setFilterDialogOpen,
  setShowDrawField,
  error,
  farmsError,
  loadAssessments,
  loadFarms,
  loading,
  farmsLoading,
  exportToCSV,
  exportToPDF,
  farmers,
  expandedFarmers,
  farmerFields,
  loadingFields,
  onFarmerRowClick,
  onViewFarmerFields,
  onToggleFarmerExpansion,
  onViewFarmerDetail
}: AssessorDashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-600 border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-100 mb-1">Total Farmers</p>
                <p className="text-2xl font-bold">{totalFarmers}</p>
                <p className="text-[10px] text-green-100/80 mt-1">All registered</p>
              </div>
              <div className="bg-green-500/50 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-600 border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-100 mb-1">Total Fields</p>
                <p className="text-2xl font-bold">{totalFields}</p>
                <p className="text-[10px] text-emerald-100/80 mt-1">Across all farmers</p>
              </div>
              <div className="bg-emerald-500/50 p-2 rounded-lg">
                <Sprout className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-teal-600 border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-100 mb-1">Total Area</p>
                <p className="text-2xl font-bold">{totalArea.toFixed(1)} ha</p>
                <p className="text-[10px] text-teal-100/80 mt-1">Cultivated area</p>
              </div>
              <div className="bg-teal-500/50 p-2 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-lime-600 border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-lime-100 mb-1">Active Assessments</p>
                <p className="text-2xl font-bold">{activeAssessments}</p>
                <p className="text-[10px] text-lime-100/80 mt-1">In progress</p>
              </div>
              <div className="bg-lime-500/50 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setActiveView("farmers")}
            size="sm"
            className={activeView === "farmers"
              ? "bg-green-600 hover:bg-green-700 text-white h-9 rounded-xl border-0"
              : "bg-white hover:bg-gray-50 text-gray-700 h-9 rounded-xl border border-gray-200"}
          >
            View Farmers
          </Button>
          <Button
            onClick={() => setActiveView("fields")}
            size="sm"
            className={activeView === "fields"
              ? "bg-green-600 hover:bg-green-700 text-white h-9 rounded-xl border-0"
              : "bg-white hover:bg-gray-50 text-gray-700 h-9 rounded-xl border border-gray-200"}
          >
            View All Fields
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 w-64 text-sm bg-white border-gray-200 rounded-xl"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilterDialogOpen(true)}
            className="bg-white border-gray-200 h-9 rounded-xl"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button 
            onClick={() => setShowDrawField(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white h-9 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {(error || farmsError) && (
        <Card className="bg-red-50 border-red-200 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700 font-medium">{error || farmsError}</p>
              </div>
              <Button
                onClick={() => { loadAssessments(); loadFarms(); }}
                variant="outline"
                size="sm"
                className="bg-white border-red-200 text-red-700 hover:bg-red-50 rounded-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-900">
              {activeView === "farmers" ? "Farmers Management" : "Fields Management"}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 h-9 rounded-xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-gray-100">
                <DropdownMenuItem onClick={exportToCSV} className="rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="rounded-lg">
                  <FileText className="h-4 w-4 mr-2 text-red-600" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading || farmsLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} columns={6} />
            </div>
          ) : activeView === "farmers" ? (
            farmers.length === 0 ? (
              <div className="p-20 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-900 font-bold">No farmers found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto p-4">
                <table className="w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-2 px-6 text-left">Name</th>
                      <th className="py-2 px-6 text-left">Email</th>
                      <th className="py-2 px-6 text-left">Phone</th>
                      <th className="py-2 px-6 text-left">National ID</th>
                      <th className="py-2 px-6 text-left">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmers
                      .filter(farmer => {
                        if (!searchQuery) return true;
                        const farmerName = (farmer.name || (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') || "").toLowerCase();
                        const searchLower = searchQuery.toLowerCase();
                        return farmerName.includes(searchLower) || (farmer.email || "").toLowerCase().includes(searchLower);
                      })
                      .map((farmer, index) => {
                        const farmerId = farmer._id || farmer.id || `temp-${index}`;
                        const farmerName = farmer.name || (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') || "Unknown";
                        const location = farmer.location || (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') || "N/A";
                        
                        return (
                          <tr
                            key={farmerId}
                            onClick={() => onViewFarmerDetail(farmer)}
                            className="bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md hover:border-green-100 transition-all cursor-pointer group"
                          >
                            <td className="py-4 px-6 rounded-l-2xl">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                  {farmerName.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{farmerName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">{farmer.email || "N/A"}</td>
                            <td className="py-4 px-6 text-sm text-gray-600 font-medium">{farmer.phoneNumber || farmer.phone || "N/A"}</td>
                            <td className="py-4 px-6 text-sm text-gray-400 font-mono">{farmer.nationalId || "N/A"}</td>
                            <td className="py-4 px-6 rounded-r-2xl">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 text-rose-500" />
                                <span className="font-medium">{location}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="p-20 text-center">
              <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-900 font-bold">Fields View Coming Soon</p>
              <p className="text-sm text-gray-500 mt-1">Please use the Farmers view to manage fields</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
