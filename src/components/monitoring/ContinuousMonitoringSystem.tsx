import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  MapPin,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Camera,
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  Crop,
  CloudRain,
  Bell
} from "lucide-react";

interface MonitoringSchedule {
  id: string;
  policyId: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  location: string;
  scheduledDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assessorId?: string;
  assessorName?: string;
  monitoringStage: number;
  totalStages: number;
  stageDescription: string;
}

interface MonitoringResult {
  id: string;
  scheduleId: string;
  policyId: string;
  assessorId: string;
  assessorName: string;
  monitoringDate: string;
  stage: number;
  cropCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  growthProgress: number; // Percentage
  riskFactors: string[];
  photos: string[];
  notes: string;
  coordinates: [number, number];
  weatherConditions: string;
  recommendations: string[];
}

interface ContinuousMonitoringSystemProps {
  userRole: 'insurer' | 'assessor' | 'admin';
  userId: string;
}

export function ContinuousMonitoringSystem({ userRole, userId }: ContinuousMonitoringSystemProps) {
  const [activeTab, setActiveTab] = useState("schedule");
  const [monitoringSchedules, setMonitoringSchedules] = useState<MonitoringSchedule[]>([]);
  const [monitoringResults, setMonitoringResults] = useState<MonitoringResult[]>([]);

  // Mock data - In real implementation, this would come from API
  useEffect(() => {
    const mockSchedules: MonitoringSchedule[] = [
      {
        id: "SCH001",
        policyId: "POL001",
        farmerId: "FARM001",
        farmerName: "Jane Mukamana",
        cropType: "Maize",
        location: "Nyagatare District",
        scheduledDate: "2024-03-20",
        status: "pending",
        assessorId: "ASS001",
        assessorName: "John Assessor",
        monitoringStage: 1,
        totalStages: 4,
        stageDescription: "Early Growth Stage - Planting to 30 days"
      },
      {
        id: "SCH002",
        policyId: "POL002",
        farmerId: "FARM002",
        farmerName: "Peter Nkurunziza",
        cropType: "Rice",
        location: "Bugesera District",
        scheduledDate: "2024-03-18",
        status: "overdue",
        assessorId: "ASS002",
        assessorName: "Mary Assessor",
        monitoringStage: 2,
        totalStages: 3,
        stageDescription: "Vegetative Stage - 30 to 60 days"
      },
      {
        id: "SCH003",
        policyId: "POL003",
        farmerId: "FARM003",
        farmerName: "Alice Uwimana",
        cropType: "Beans",
        location: "Rulindo District",
        scheduledDate: "2024-03-25",
        status: "in_progress",
        assessorId: "ASS001",
        assessorName: "John Assessor",
        monitoringStage: 1,
        totalStages: 3,
        stageDescription: "Early Growth Stage - Planting to 30 days"
      }
    ];

    const mockResults: MonitoringResult[] = [
      {
        id: "RES001",
        scheduleId: "SCH001",
        policyId: "POL001",
        assessorId: "ASS001",
        assessorName: "John Assessor",
        monitoringDate: "2024-03-15",
        stage: 1,
        cropCondition: "good",
        growthProgress: 75,
        riskFactors: ["minor pest activity", "adequate soil moisture"],
        photos: ["photo1.jpg", "photo2.jpg"],
        notes: "Crops showing healthy growth. Minor pest activity observed but under control.",
        coordinates: [30.1234, -1.9456],
        weatherConditions: "sunny, 25°C",
        recommendations: ["Continue current irrigation schedule", "Monitor pest activity closely"]
      }
    ];

    setMonitoringSchedules(mockSchedules);
    setMonitoringResults(mockResults);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderMonitoringSchedule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Monitoring Schedule</h3>
          <p className="text-gray-600">Upcoming and overdue monitoring tasks</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Monitoring
        </Button>
      </div>

      <div className="grid gap-4">
        {monitoringSchedules.map((schedule) => (
          <Card key={schedule.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Crop className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{schedule.farmerName}</h4>
                    <p className="text-sm text-gray-600">{schedule.cropType} - {schedule.location}</p>
                    <p className="text-sm text-gray-500">{schedule.stageDescription}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(schedule.status)}>
                    {schedule.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    Due: {new Date(schedule.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Stage {schedule.monitoringStage}/{schedule.totalStages}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{schedule.assessorName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{schedule.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span>Policy {schedule.policyId}</span>
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {schedule.status === 'pending' && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Activity className="h-4 w-4 mr-2" />
                    Start Monitoring
                  </Button>
                )}
                {schedule.status === 'overdue' && (
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mark Urgent
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMonitoringResults = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Monitoring Results</h3>
          <p className="text-gray-600">Recent field assessments and crop evaluations</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <BarChart3 className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid gap-4">
        {monitoringResults.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Policy {result.policyId}</h4>
                    <p className="text-sm text-gray-600">
                      Assessed by {result.assessorName} on {new Date(result.monitoringDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">Stage {result.stage} Monitoring</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getConditionColor(result.cropCondition)}>
                    {result.cropCondition.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.growthProgress}% Growth Progress
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium mb-2">Assessment Details</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weather:</span>
                      <span>{result.weatherConditions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Photos:</span>
                      <span>{result.photos.length} images</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Factors:</span>
                      <span>{result.riskFactors.length} identified</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Notes & Recommendations</h5>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 line-clamp-2">{result.notes}</p>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Recommendations:</span>
                      <Badge variant="outline" className="text-xs">
                        {result.recommendations.length} items
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Report
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Camera className="h-4 w-4 mr-2" />
                  View Photos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Monitoring Analytics</h3>
        <p className="text-gray-600">Performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-semibold">
                  {monitoringSchedules.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold">
                  {monitoringSchedules.filter(s => s.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold">
                  {monitoringSchedules.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-semibold">
                  {monitoringSchedules.filter(s => s.status === 'overdue').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Completion Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="font-semibold">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Month</span>
                <span className="font-semibold">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CloudRain className="h-5 w-5" />
              <span>Risk Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Drought Warning</span>
                </div>
                <Badge variant="outline" className="text-xs">3 farms</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Pest Activity</span>
                </div>
                <Badge variant="outline" className="text-xs">7 farms</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Disease Outbreak</span>
                </div>
                <Badge variant="outline" className="text-xs">2 farms</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Continuous Monitoring System</CardTitle>
          <p className="text-center text-gray-600">
            Automated crop surveillance and field assessment management
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="mt-6">
              {renderMonitoringSchedule()}
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              {renderMonitoringResults()}
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              {renderAnalytics()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
