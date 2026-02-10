"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

interface MapPickerProps {
  value?: [number, number];
  onChange: (coords: [number, number]) => void;
  className?: string;
}

export function MapPicker({ value, onChange, className = "h-64 w-full rounded-xl" }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(value || [30.1, -1.95]);

  // Mock map implementation - in real app, use Mapbox GL or Leaflet
  useEffect(() => {
    if (mapRef.current) {
      // Simulate map loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert click position to coordinates (simplified)
    const lng = 29.5 + (x / rect.width) * 1.2; // Rough bounds for Rwanda
    const lat = -2.8 + (y / rect.height) * 1.5;
    
    const newCoords: [number, number] = [lng, lat];
    setCurrentCoords(newCoords);
    onChange(newCoords);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setCurrentCoords(coords);
          onChange(coords);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} border bg-muted flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Click on the map to select your farm location
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          Use Current Location
        </Button>
      </div>
      
      <div
        ref={mapRef}
        className={`${className} border bg-gradient-to-br from-green-100 to-blue-100 relative cursor-crosshair`}
        onClick={handleMapClick}
      >
        {/* Mock map background with grid */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#000" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Marker */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${((currentCoords[0] - 29.5) / 1.2) * 100}%`,
            top: `${((currentCoords[1] + 2.8) / 1.5) * 100}%`,
          }}
        >
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <MapPin className="h-3 w-3 text-white" />
          </div>
        </div>
        
        {/* Coordinates display */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
          {currentCoords[0].toFixed(4)}, {currentCoords[1].toFixed(4)}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Selected coordinates: {currentCoords[0].toFixed(6)}, {currentCoords[1].toFixed(6)}</p>
      </div>
    </div>
  );
}
