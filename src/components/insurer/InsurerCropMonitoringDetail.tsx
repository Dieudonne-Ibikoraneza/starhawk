import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, Clock, MapPin, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMonitoringById, getMonitoringHistory } from "@/services/cropMonitoringApi";
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
  const [allCycles, setAllCycles] = useState<any[]>([]);
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

      const pId = data.policyId?._id || data.policyId;

      try {
        const history = await getMonitoringHistory();
        const historyData = Array.isArray(history) ? history : (history.data || []);
        const filteredCycles = historyData.filter((m: any) => {
          const mPolicyId = m.policyId?._id || m.policyId;
          return String(mPolicyId) === String(pId);
        }).sort((a: any, b: any) => b.monitoringNumber - a.monitoringNumber);
        
        setAllCycles(filteredCycles);
      } catch (err) {
        console.warn("Failed to load cycles history:", err);
        setAllCycles([data]);
      }

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

  const displayFieldId = farm._id ? `FLD-${String(farm._id).slice(-3).padStart(3, '0')}` : 'FLD-000';
  const policyDisplayId = record.policyId?.policyNumber || (record.policyId?._id ? `POL-${record.policyId._id.slice(-6).toUpperCase()}` : "N/A");

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2 text-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Crop Monitoring
        </button>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 uppercase">
            CROP MONITORING AUDIT: {displayFieldId}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {farmerName} — {cropType} • {allCycles.length} {allCycles.length === 1 ? 'Cycle' : 'Cycles'} Evaluated
          </p>
        </div>
        {record.policyId && (
          <Badge
            variant="outline"
            className="text-sm px-4 py-1.5 border-green-200 bg-green-50 text-green-700 font-semibold"
          >
            Active Policy: {policyDisplayId}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="basic" 
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 font-medium py-2 rounded-md transition-all"
          >
            📋 Basic Info
          </TabsTrigger>
          <TabsTrigger 
            value="weather" 
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 font-medium py-2 rounded-md transition-all"
          >
            🌦️ Weather Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="drone" 
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 font-medium py-2 rounded-md transition-all"
          >
            🛸 Drone Report
          </TabsTrigger>
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 font-medium py-2 rounded-md transition-all"
          >
            📝 Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-0">
          <MonitoringBasicInfoTab 
            fieldId={farm._id || farm.id || ""}
            fieldName={farm.name || "Unknown Farm"}
            farmerName={farmerName}
            cropType={cropType}
            area={farm.area || 1.8}
            season={farm.season || "Season A"}
            location={locationStr}
            boundary={farm.boundary}
            locationCoords={(() => {
              if (farm?.location?.coordinates && Array.isArray(farm.location.coordinates)) {
                const coords = farm.location.coordinates;
                if (coords.length >= 2) return [coords[1], coords[0]];
              }
              return undefined;
            })()}
            cycles={allCycles}
            activeCycle={allCycles.find(c => c.status === "IN_PROGRESS")}
            onStartCycle={() => {}}
            isStartingCycle={false}
            readOnly={true}
          />
        </TabsContent>

        <TabsContent value="weather" className="mt-0">
          <MonitoringWeatherTab cycles={allCycles} />
        </TabsContent>

        <TabsContent value="drone" className="mt-0">
          <MonitoringDroneReportTab 
            monitoringId={record._id}
            activeCycle={allCycles.find(c => c.status === "IN_PROGRESS")}
            cycles={allCycles}
            fieldName={farm.name || "Unknown Farm"}
            farmerName={farmerName}
            location={locationStr}
            cropType={cropType}
            area={farm.area || 1.8}
            readOnly={true}
          />
        </TabsContent>

        <TabsContent value="overview" className="mt-0">
          <MonitoringOverviewTab 
            monitoringId={record._id}
            policyId={record.policyId?.policyNumber || (typeof record.policyId === "object" ? record.policyId?._id : record.policyId) || ""}
            fieldName={farm.name || "Unknown Farm"}
            farmerName={farmerName}
            cropType={cropType}
            area={farm.area || 1.8}
            location={locationStr}
            cycles={allCycles}
            activeCycle={allCycles.find(c => c.status === "IN_PROGRESS")}
            readOnly={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
