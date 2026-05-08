import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, Clock, MapPin, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMonitoringById } from "@/services/cropMonitoringApi";
import { getVegetationStats, getHistoricalWeather } from "@/services/farmsApi";

import { MonitoringOverviewTab } from "../assessor/tabs/MonitoringOverviewTab";
import { MonitoringDroneReportTab } from "../assessor/tabs/MonitoringDroneReportTab";
import { MonitoringWeatherTab } from "../assessor/tabs/MonitoringWeatherTab";
import { MonitoringBasicInfoTab } from "../assessor/tabs/MonitoringBasicInfoTab";

export default function InsurerCropMonitoringDetail({ 
  monitoringId, 
  onBack, 
  onActionComplete 
}: { 
  monitoringId: string; 
  onBack: () => void;
  onActionComplete: () => void;
}) {
  const { toast } = useToast();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fieldStatistics, setFieldStatistics] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    loadRecord();
  }, [monitoringId]);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const response = await getMonitoringById(monitoringId);
      const data = response.data || response;
      setRecord(data);
      if (data.farmId?._id) {
        await loadFieldData(data.farmId._id);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load monitoring details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFieldData = async (farmId: string) => {
    setLoadingData(true);
    try {
      const formatDateForApi = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const now = new Date();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
      const startDate = new Date();
      startDate.setFullYear(yesterday.getFullYear() - 1); // 1 year for monitoring
      
      const startDateStr = formatDateForApi(startDate);
      const endDateStr = formatDateForApi(yesterday);

      try {
        const stats = await getVegetationStats(farmId, startDateStr, endDateStr, "NDVI,MSAVI,NDMI,EVI");
        setFieldStatistics(stats.data || stats);
      } catch (err) {
        console.warn("Failed to load field statistics:", err);
      }

      try {
        const weather = await getHistoricalWeather(farmId, startDateStr, endDateStr);
        setWeatherData(weather.data || weather);
      } catch (err) {
        console.warn("Failed to load weather data:", err);
      }
    } catch (err: any) {
      console.error("Failed to load field data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-12 text-center">
          <img src="/loading.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-500">Loading comprehensive monitoring data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!record) return null;

  const farm = record.farmId || record.farm || {};
  const farmer = farm.farmerId || {};

    const farmerName = (() => {
    if (farmer.firstName && farmer.lastName) return `${farmer.firstName} ${farmer.lastName}`;
    if (farmer.name) return farmer.name;
    if (record.policyId?.farmerId?.name) return record.policyId.farmerId.name;
    if (record.policyId?.farmerId?.firstName) {
      return `${record.policyId.farmerId.firstName} ${record.policyId.farmerId.lastName || ''}`.trim();
    }
    return 'Grace Wanjiru';
  })();

  const cropType = record.policyId?.cropType || farm.cropType || "Wheat";
  const locationStr = farm.locationName || (farm.location?.coordinates ? `${farm.location.coordinates[1].toFixed(4)}, ${farm.location.coordinates[0].toFixed(4)}` : "Nyagatare District, Eastern Province, Rwanda");

  return (
    <div className="space-y-6">
      {/* Insurer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Logs
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Cycle {record.monitoringNumber || 1}</h1>
          <p className="text-sm text-gray-600 flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
            {farm.name || "Unknown Farm"} • {new Date(record.monitoringDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={`h-8 px-4 font-semibold border-none ${
            record.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {record.status}
          </Badge>
        </div>
      </div>

      {/* Reused Assessor Tabs for Data Representation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border border-gray-100 p-1 mb-6 rounded-xl flex flex-wrap gap-2 justify-start shadow-sm h-auto">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="drone" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Drone Data</TabsTrigger>
          <TabsTrigger value="weather" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Weather Analysis</TabsTrigger>
          <TabsTrigger value="basic-info" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Basic Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <MonitoringOverviewTab 
            monitoringId={record._id}
            policyId={record.policyId?.policyNumber || (typeof record.policyId === "object" ? record.policyId?._id : record.policyId) || ""}
            fieldName={farm.name || "Unknown Farm"}
            farmerName={farmerName}
            cropType={cropType}
            area={farm.area || 1.8}
            location={locationStr}
            cycles={[record]}
            activeCycle={record}
            readOnly={true}
          />
        </TabsContent>
        <TabsContent value="drone" className="mt-0">
          <MonitoringDroneReportTab 
            monitoringId={record._id}
            activeCycle={record}
            cycles={[record]}
            fieldName={farm.name || "Unknown Farm"}
            farmerName={farmerName}
            location={locationStr}
            cropType={cropType}
            area={farm.area || 1.8}
            readOnly={true}
          />
        </TabsContent>
        <TabsContent value="weather" className="mt-0">
          <MonitoringWeatherTab cycles={[record]} />
        </TabsContent>
        <TabsContent value="basic-info" className="mt-0">
          <MonitoringBasicInfoTab 
            fieldId={farm._id || farm.id || ""}
            fieldName={farm.name || "Unknown Farm"}
            farmerName={farmerName}
            cropType={cropType}
            area={farm.area || 1.8}
            season={farm.season || "Season A"}
            location={locationStr}
            boundary={farm.boundary}
            locationCoords={farm.location?.coordinates}
            cycles={[record]}
            activeCycle={record.status === "IN_PROGRESS" ? record : undefined}
            onStartCycle={() => {}}
            isStartingCycle={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
