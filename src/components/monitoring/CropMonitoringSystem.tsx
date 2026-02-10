import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  Satellite,
  Layers,
  Calendar
} from "lucide-react";


// EOS Statistics API Service (via backend proxy)
const eosStatisticsApi = {
  async createTask(geometry, dateStart, dateEnd, bmType = ["ndvi"]) {
    const response = await fetch('/api/eos-statistics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        geometry,
        dateStart,
        dateEnd,
        bmType
      })
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the status text
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`EOS API error: ${errorMessage}`);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  },
  
  async checkTaskStatus(taskId) {
    const response = await fetch(`/api/eos-statistics?taskId=${taskId}`);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the status text
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`EOS API error: ${errorMessage}`);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }
};

// EOS Statistics Component
const EOSStatisticsWidget = ({ bbox = "-2.0,29.5,-1.5,30.0", timeRange = "2024-10-01/2024-10-15" }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);

  const convertBboxToPolygon = (bbox) => {
    const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
    return [
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat] // Close the polygon
    ];
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, show demo statistics due to CORS limitations
      // TODO: Implement proper backend API for EOS integration
      console.log('EOS Statistics API temporarily disabled due to CORS - showing demo data');
      
      // Simulate API delay
      setTimeout(() => {
        const demoStats = [
          {
            scene_id: "demo_scene_1",
            date: "2024-10-01",
            cloud: 15,
            average: 0.65,
            std: 0.12,
            max: 0.89,
            min: 0.23,
            median: 0.67,
            variance: 0.014,
            q1: 0.58,
            q3: 0.74,
            p10: 0.45,
            p90: 0.82
          },
          {
            scene_id: "demo_scene_2", 
            date: "2024-10-05",
            cloud: 8,
            average: 0.72,
            std: 0.08,
            max: 0.91,
            min: 0.34,
            median: 0.74,
            variance: 0.006,
            q1: 0.68,
            q3: 0.78,
            p10: 0.52,
            p90: 0.85
          },
          {
            scene_id: "demo_scene_3",
            date: "2024-10-10", 
            cloud: 22,
            average: 0.58,
            std: 0.15,
            max: 0.83,
            min: 0.18,
            median: 0.61,
            variance: 0.023,
            q1: 0.48,
            q3: 0.71,
            p10: 0.35,
            p90: 0.79
          }
        ];
        
        setStatistics(demoStats);
        setLoading(false);
        setTaskStatus("completed");
        setError(null); // Clear error since we have demo data
      }, 2000);
      
      // Uncomment below when proper backend API is implemented:
      /*
      const geometry = convertBboxToPolygon(bbox);
      const [dateStart, dateEnd] = timeRange.split('/');
      
      console.log('Creating EOS statistics task...');
      const taskResponse = await eosStatisticsApi.createTask(geometry, dateStart, dateEnd, ["ndvi"]);
      
      if (taskResponse.status === "created") {
        setTaskId(taskResponse.task_id);
        setTaskStatus("created");
        console.log('Task created:', taskResponse.task_id);
        
        // Start polling for results
        pollTaskStatus(taskResponse.task_id);
      } else {
        throw new Error(`Task creation failed: ${taskResponse.status}`);
      }
      */
    } catch (err) {
      console.error('EOS statistics error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const pollTaskStatus = async (taskId) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`Checking task status (attempt ${attempts}/${maxAttempts})...`);
        
        const statusResponse = await eosStatisticsApi.checkTaskStatus(taskId);
        setTaskStatus(statusResponse.status || "unknown");
        
        if (statusResponse.result && statusResponse.result.length > 0) {
          console.log('Statistics received:', statusResponse.result);
          setStatistics(statusResponse.result);
          setLoading(false);
          return;
        }
        
        if (attempts >= maxAttempts) {
          setError('Task timeout - statistics processing took too long');
          setLoading(false);
          return;
        }
        
        // Poll every 10 seconds
        setTimeout(poll, 10000);
      } catch (err) {
        console.error('Polling error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    poll();
  };

  useEffect(() => {
    // Auto-fetch statistics when component mounts
    fetchStatistics();
  }, [bbox, timeRange]);

  if (loading) {
    return (
      <div className="w-full h-[200px] bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-white/70">Processing satellite statistics...</p>
          <p className="text-xs text-white/50 mt-1">Status: {taskStatus || 'Starting...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[200px] bg-red-900/20 border border-red-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-400">Statistics unavailable</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
          <button 
            onClick={fetchStatistics}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Retry
          </button>
              </div>
            </div>
    );
  }

  if (!statistics || statistics.length === 0) {
    return (
      <div className="w-full h-[200px] bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">No statistics data available</p>
          <button 
            onClick={fetchStatistics}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Load Statistics
          </button>
              </div>
            </div>
    );
  }

  // Calculate average statistics across all scenes
  const avgStats = statistics.reduce((acc, scene) => {
    Object.keys(scene).forEach(key => {
      if (typeof scene[key] === 'number' && !isNaN(scene[key])) {
        acc[key] = (acc[key] || 0) + scene[key];
      }
    });
    return acc;
  }, {});

  const sceneCount = statistics.length;
  Object.keys(avgStats).forEach(key => {
    if (typeof avgStats[key] === 'number') {
      avgStats[key] = avgStats[key] / sceneCount;
    }
  });

  return (
    <div className="w-full bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">NDVI Statistics Analysis</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            Demo Data
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{avgStats.average?.toFixed(3) || 'N/A'}</div>
          <div className="text-xs text-white/70">Average NDVI</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{avgStats.std?.toFixed(3) || 'N/A'}</div>
          <div className="text-xs text-white/70">Std Deviation</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{avgStats.max?.toFixed(3) || 'N/A'}</div>
          <div className="text-xs text-white/70">Max NDVI</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{avgStats.min?.toFixed(3) || 'N/A'}</div>
          <div className="text-xs text-white/70">Min NDVI</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-white/60">
        <p>Analysis based on {sceneCount} satellite scenes</p>
        <p>Time range: {timeRange}</p>
        <p className="text-orange-400 mt-1">📊 Demo data - CORS limitations prevent live API access</p>
      </div>
    </div>
  );
};


export default function CropMonitoringSystem() {
  const [activeTab, setActiveTab] = useState("dashboard");


  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
                <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Crop Monitoring</h1>
          <p className="text-white/60 mt-1">Satellite-based crop health analysis</p>
                </div>
              </div>

              {/* EOS Statistics Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Satellite className="h-5 w-5 mr-2" />
                    Crop Health Analysis (NDVI Statistics)
                  </CardTitle>
                  <p className="text-sm text-white/70">Statistical analysis of vegetation health using satellite data</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-white/70">
                          <span className="font-medium">Rwanda Region:</span> -2.0°S, 29.5°E to -1.5°S, 30.0°E
                        </div>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          Demo Mode
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Time Range
                        </Button>
                      </div>
                    </div>
                    
                    {/* EOS Statistics Widget */}
                    <EOSStatisticsWidget 
                      bbox="-2.0,29.5,-1.5,30.0" 
                      timeRange="2024-10-01/2024-10-15" 
                    />
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                        <div className="text-red-400 font-semibold">Low Vegetation</div>
                        <div className="text-xs text-red-300">NDVI: 0.0 - 0.3</div>
                      </div>
                      <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <div className="text-yellow-400 font-semibold">Moderate Vegetation</div>
                        <div className="text-xs text-yellow-300">NDVI: 0.3 - 0.6</div>
                      </div>
                      <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                        <div className="text-green-400 font-semibold">High Vegetation</div>
                        <div className="text-xs text-green-300">NDVI: 0.6 - 1.0</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderDashboard()}
    </div>
  );
}
