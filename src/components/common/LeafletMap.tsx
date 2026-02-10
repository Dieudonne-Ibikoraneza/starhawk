import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL, getAuthToken } from "@/config/api";

// Fix for default marker icon in Leaflet with Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  height?: string;
  geoJsonData?: any; // GeoJSON data for field boundaries
  kmlUrl?: string; // URL to KML file to display
  boundary?: any; // Farm boundary object (GeoJSON Polygon format)
  showControls?: boolean;
  tileLayer?: "osm" | "satellite" | "terrain";
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

export default function LeafletMap({
  center = [-1.9441, 30.0619], // Default: Kigali, Rwanda
  zoom = 13,
  height = "500px",
  geoJsonData,
  kmlUrl,
  boundary,
  showControls = true,
  tileLayer = "satellite",
  onMapClick,
  className = ""
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Layer | null>(null);
  const kmlLayerRef = useRef<L.Layer | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Validate center coordinates
    let validCenter = center;
    const [lat, lng] = center;
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Invalid center coordinates, using default:', center);
      validCenter = [-1.9441, 30.0619]; // Default: Kigali, Rwanda
    }

    // Initialize map with max zoom set to 18
    const map = L.map(mapRef.current, {
      maxZoom: 18
    }).setView(validCenter, zoom);
    mapInstanceRef.current = map;

    // Tile layer options
    let tileUrl: string;
    let attribution: string;

    switch (tileLayer) {
      case "osm":
        tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        break;
      case "satellite":
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = '&copy; <a href="https://www.esri.com/">ESRI</a>';
        break;
      case "terrain":
        tileUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
        attribution = '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
        break;
      default:
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = '&copy; <a href="https://www.esri.com/">ESRI</a>';
    }

    // Add tile layer
    const tileLayerInstance = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 18
    }).addTo(map);
    tileLayerRef.current = tileLayerInstance;

    // Add zoom controls if requested
    if (showControls) {
      L.control.zoom({
        position: 'topright'
      }).addTo(map);
    }

    // Helper function to convert boundary to GeoJSON Feature
    const boundaryToGeoJSON = (boundary: any): any => {
      if (!boundary) return null;
      
      // If it's already a GeoJSON Feature or FeatureCollection, return as is
      if (boundary.type === 'Feature' || boundary.type === 'FeatureCollection') {
        return boundary;
      }
      
      // If it's a GeoJSON Polygon, wrap it in a Feature
      if (boundary.type === 'Polygon' && boundary.coordinates) {
        return {
          type: 'Feature',
          geometry: boundary,
          properties: {}
        };
      }
      
      // If it has coordinates but no type, assume Polygon
      if (boundary.coordinates && Array.isArray(boundary.coordinates)) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: boundary.coordinates
          },
          properties: {}
        };
      }
      
      return null;
    };

    // Determine which data to use (priority: geoJsonData > boundary, but kmlUrl is handled separately)
    let dataToDisplay = geoJsonData;
    if (!dataToDisplay && boundary && !kmlUrl) {
      // Only use boundary if kmlUrl is not provided (KML takes priority for display)
      dataToDisplay = boundaryToGeoJSON(boundary);
    }

    // Add marker at center if no data to display (boundary/GeoJSON/KML)
    if (!dataToDisplay && !kmlUrl) {
      L.marker(validCenter).addTo(map);
    }

    // Add GeoJSON layer if provided (but only if kmlUrl is not provided)
    if (dataToDisplay && !kmlUrl) {
      const geoJsonLayer = L.geoJSON(dataToDisplay, {
        style: {
          color: "#22c55e", // Green color for boundary lines
          weight: 4, // Thicker lines for better visibility
          fillColor: "#22c55e",
          fillOpacity: 0.2,
          dashArray: "5, 5", // Dashed line style
          lineCap: "round",
          lineJoin: "round"
        },
        onEachFeature: (feature, layer) => {
          // Add hover effect
          layer.on({
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 6,
                color: "#16a34a",
                fillOpacity: 0.3
              });
            },
            mouseout: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 4,
                color: "#22c55e",
                fillOpacity: 0.2
              });
            }
          });
        }
      }).addTo(map);
      layerRef.current = geoJsonLayer;

      // Fit map to bounds
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }

    // Load KML if URL is provided (initial load - will be handled by useEffect if URL changes)
    // Note: KML loading on mount is now handled by the separate useEffect to avoid duplication

    // Handle map clicks
    if (onMapClick) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    setMapLoaded(true);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update tile layer when prop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Remove old tile layer
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    // Get new tile layer URL and attribution
    let tileUrl: string;
    let attribution: string;

    switch (tileLayer) {
      case "osm":
        tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        break;
      case "satellite":
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = '&copy; <a href="https://www.esri.com/">ESRI</a>';
        break;
      case "terrain":
        tileUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
        attribution = '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
        break;
      default:
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = '&copy; <a href="https://www.esri.com/">ESRI</a>';
    }

    // Add new tile layer
    const newTileLayer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 18
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [tileLayer, mapLoaded]);

  // Helper function to manually parse KML coordinates (fallback)
  const parseKMLManually = (kmlDoc: Document): any => {
    try {
      // Find all coordinates in the KML
      const coordinates = kmlDoc.querySelectorAll('coordinates');
      if (coordinates.length === 0) {
        console.warn('No coordinates found in KML');
        return null;
      }

      const polygons: number[][][] = [];
      coordinates.forEach((coordEl) => {
        const coordText = coordEl.textContent?.trim();
        if (!coordText) return;

        // Parse coordinates (format: "lng,lat,alt lng,lat,alt ...")
        const points = coordText.split(/\s+/).map(point => {
          const parts = point.split(',');
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lng, lat];
          }
          return null;
        }).filter(p => p !== null) as number[][];

        if (points.length > 0) {
          polygons.push(points);
        }
      });

      if (polygons.length === 0) {
        return null;
      }

      // Create GeoJSON FeatureCollection
      const features = polygons.map(polygon => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [polygon] // Polygon needs to be wrapped in array
        },
        properties: {}
      }));

      return {
        type: 'FeatureCollection',
        features: features.length === 1 ? features : features
      };
    } catch (error) {
      console.error('Manual KML parsing error:', error);
      return null;
    }
  };

  // Helper function to convert boundary to GeoJSON
  const boundaryToGeoJSON = (boundary: any): any => {
    if (!boundary) return null;
    
    if (boundary.type === 'Feature' || boundary.type === 'FeatureCollection') {
      return boundary;
    }
    
    if (boundary.type === 'Polygon' && boundary.coordinates) {
      return {
        type: 'Feature',
        geometry: boundary,
        properties: {}
      };
    }
    
    if (boundary.coordinates && Array.isArray(boundary.coordinates)) {
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: boundary.coordinates
        },
        properties: {}
      };
    }
    
    return null;
  };

  // Update GeoJSON/boundary layer if data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Don't show boundary if kmlUrl is provided (KML takes priority)
    if (kmlUrl) return;

    // Determine which data to use
    let dataToDisplay = geoJsonData;
    if (!dataToDisplay && boundary) {
      dataToDisplay = boundaryToGeoJSON(boundary);
    }

    if (!dataToDisplay) return;

    // Remove existing GeoJSON layers (but keep base tile layer)
    if (layerRef.current) {
      mapInstanceRef.current.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    // Add new GeoJSON layer
    const geoJsonLayer = L.geoJSON(dataToDisplay, {
      style: {
        color: "#22c55e", // Green color for boundary lines
        weight: 4, // Thicker lines for better visibility
        fillColor: "#22c55e",
        fillOpacity: 0.2,
        dashArray: "5, 5", // Dashed line style
        lineCap: "round",
        lineJoin: "round"
      },
      onEachFeature: (feature, layer) => {
        // Add hover effect
        layer.on({
          mouseover: (e) => {
            const layer = e.target;
            layer.setStyle({
              weight: 6,
              color: "#16a34a",
              fillOpacity: 0.3
            });
          },
          mouseout: (e) => {
            const layer = e.target;
            layer.setStyle({
              weight: 4,
              color: "#22c55e",
              fillOpacity: 0.2
            });
          }
        });
      }
    }).addTo(mapInstanceRef.current);
    layerRef.current = geoJsonLayer;

    // Fit map to bounds
    const bounds = geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [geoJsonData, boundary, kmlUrl, mapLoaded]);

  // Update center if it changes
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      // Validate center coordinates before setting view
      const [lat, lng] = center;
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        mapInstanceRef.current.setView(center, zoom);
      }
    }
  }, [center, zoom, mapLoaded]);

  // Update KML layer when kmlUrl changes
  useEffect(() => {
    console.log('LeafletMap KML useEffect triggered:', { 
      hasMap: !!mapInstanceRef.current, 
      mapLoaded, 
      kmlUrl,
      hasWindow: typeof window !== 'undefined'
    });
    
    if (!mapInstanceRef.current || !mapLoaded || !kmlUrl || typeof window === 'undefined') {
      if (!kmlUrl) {
        console.log('LeafletMap - No KML URL provided');
      }
      return;
    }

    // Remove existing KML layer if it exists
    if (kmlLayerRef.current) {
      mapInstanceRef.current.removeLayer(kmlLayerRef.current);
      kmlLayerRef.current = null;
    }

    // Helper function to load and display KML
    const loadKML = async () => {
      // Function to get toGeoJSON library reference
      const getToGeoJSON = () => {
        if (typeof window === 'undefined') return null;
        // Try different possible names
        return (window as any).toGeoJSON || 
               (window as any).togeojson ||
               (window as any).toGeoJSON?.kml ||
               (window as any).togeojson?.kml ||
               null;
      };

      // Check if library is already available
      let toGeoJSONLib = getToGeoJSON();
      
      if (!toGeoJSONLib) {
        console.log('Loading toGeoJSON library...');
        // Dynamically load toGeoJSON library for KML parsing
        try {
          await new Promise<void>((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector('script[src*="togeojson"]');
            if (existingScript) {
              console.log('toGeoJSON script already exists, waiting for load...');
              let attempts = 0;
              const maxAttempts = 50; // 5 seconds max
              const checkInterval = setInterval(() => {
                attempts++;
                toGeoJSONLib = getToGeoJSON();
                if (toGeoJSONLib) {
                  clearInterval(checkInterval);
                  console.log('toGeoJSON library is now available');
                  resolve();
                } else if (attempts >= maxAttempts) {
                  clearInterval(checkInterval);
                  reject(new Error('toGeoJSON library failed to load after timeout'));
                }
              }, 100);
              return;
            }

            const script = document.createElement('script');
            // Try alternative CDN if main one fails
            script.src = 'https://unpkg.com/@mapbox/togeojson@0.16.0/togeojson.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.onload = () => {
              console.log('toGeoJSON script loaded, waiting for library initialization...');
              // Wait for library to initialize
              let attempts = 0;
              const maxAttempts = 50;
              const checkInterval = setInterval(() => {
                attempts++;
                toGeoJSONLib = getToGeoJSON();
                if (toGeoJSONLib) {
                  clearInterval(checkInterval);
                  console.log('toGeoJSON library initialized successfully');
                  resolve();
                } else if (attempts >= maxAttempts) {
                  clearInterval(checkInterval);
                  reject(new Error('toGeoJSON library loaded but not initialized'));
                }
              }, 100);
            };
            script.onerror = () => {
              console.error('Failed to load toGeoJSON script');
              reject(new Error('Failed to load toGeoJSON library'));
            };
            document.head.appendChild(script);
          });
        } catch (error) {
          console.error('Error loading toGeoJSON:', error);
          // Try to continue anyway - maybe it's available now
          toGeoJSONLib = getToGeoJSON();
          if (!toGeoJSONLib) {
            console.error('Cannot proceed without toGeoJSON library');
            return;
          }
        }
      } else {
        console.log('toGeoJSON library already loaded');
      }
      
      // Now fetch and process KML
      fetchKML();
    };

    const fetchKML = () => {
      // Convert relative URL to absolute URL if needed
      let fullKmlUrl = kmlUrl;
      if (kmlUrl && !kmlUrl.startsWith('http://') && !kmlUrl.startsWith('https://')) {
        // If it's a relative URL, prepend the API base URL
        if (kmlUrl.startsWith('/')) {
          fullKmlUrl = `${API_BASE_URL}${kmlUrl}`;
        } else {
          fullKmlUrl = `${API_BASE_URL}/${kmlUrl}`;
        }
      }
      
      console.log('Loading KML from URL:', fullKmlUrl);
      
      // Prepare headers with authentication if available
      const headers: HeadersInit = {};
      const token = getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      fetch(fullKmlUrl, { headers })
        .then(response => {
          console.log('KML fetch response status:', response.status);
          console.log('KML fetch response headers:', Object.fromEntries(response.headers.entries()));
          if (!response.ok) {
            const errorText = response.statusText || 'Unknown error';
            console.error(`KML fetch failed: ${response.status} ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
          const contentType = response.headers.get('content-type') || '';
          console.log('KML content type:', contentType);
          return response.text();
        })
        .then(kmlText => {
          console.log('KML loaded successfully, length:', kmlText.length);
          console.log('KML first 500 chars:', kmlText.substring(0, 500));
          if (!kmlText || kmlText.trim().length === 0) {
            throw new Error('KML file is empty');
          }
          
          // Check if it's actually KML/XML
          if (!kmlText.trim().startsWith('<?xml') && !kmlText.trim().startsWith('<kml') && !kmlText.trim().startsWith('<')) {
            console.warn('KML file might not be valid XML/KML format');
          }
          
          const parser = new DOMParser();
          const kml = parser.parseFromString(kmlText, 'text/xml');
          
          // Check for parsing errors
          const parserError = kml.querySelector('parsererror');
          if (parserError) {
            console.error('KML parsing error:', parserError.textContent);
            throw new Error('Failed to parse KML file');
          }
          
          // Get toGeoJSON library reference
          const getToGeoJSON = () => {
            if (typeof window === 'undefined') return null;
            // Try different possible ways the library might be exposed
            const win = window as any;
            return win.toGeoJSON || 
                   win.togeojson ||
                   (win.toGeoJSON && win.toGeoJSON.kml ? win.toGeoJSON : null) ||
                   (win.togeojson && win.togeojson.kml ? win.togeojson : null) ||
                   null;
          };
          
          const toGeoJSONLib = getToGeoJSON();
          if (!toGeoJSONLib) {
            console.error('toGeoJSON library not available');
            console.error('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('geo')));
            throw new Error('toGeoJSON library not loaded');
          }
          
          // Convert KML to GeoJSON
          let geojson;
          try {
            // The library might expose kml as a method directly or as a property
            if (typeof toGeoJSONLib.kml === 'function') {
              geojson = toGeoJSONLib.kml(kml);
            } else if (typeof toGeoJSONLib === 'function') {
              geojson = toGeoJSONLib(kml);
            } else {
              // Try to find the kml method in the object
              const kmlMethod = toGeoJSONLib.kml || toGeoJSONLib.KML;
              if (typeof kmlMethod === 'function') {
                geojson = kmlMethod(kml);
              } else {
                throw new Error('toGeoJSON.kml is not a function');
              }
            }
            console.log('KML converted to GeoJSON:', geojson);
          } catch (conversionError: any) {
            console.error('Error converting KML to GeoJSON:', conversionError);
            console.error('toGeoJSONLib type:', typeof toGeoJSONLib);
            console.error('toGeoJSONLib keys:', Object.keys(toGeoJSONLib || {}));
            console.error('KML document root:', kml.documentElement?.tagName);
            
            // Try manual parsing as fallback
            console.log('Attempting manual KML parsing as fallback...');
            try {
              geojson = parseKMLManually(kml);
              if (geojson) {
                console.log('Manual KML parsing succeeded');
              } else {
                throw new Error('Manual parsing also failed');
              }
            } catch (manualError) {
              console.error('Manual parsing failed:', manualError);
              throw new Error(`Failed to convert KML to GeoJSON: ${conversionError?.message || 'Unknown error'}`);
            }
          }
          
          if (!geojson) {
            console.warn('No GeoJSON data returned from KML conversion');
            // Fallback to boundary if available
            if (boundary && mapInstanceRef.current) {
              console.log('Falling back to boundary prop');
              const boundaryGeoJSON = boundaryToGeoJSON(boundary);
              if (boundaryGeoJSON) {
                const boundaryLayer = L.geoJSON(boundaryGeoJSON, {
                  style: {
                    color: "#22c55e",
                    weight: 4,
                    fillColor: "#22c55e",
                    fillOpacity: 0.2,
                    dashArray: "5, 5",
                    lineCap: "round",
                    lineJoin: "round"
                  }
                }).addTo(mapInstanceRef.current);
                kmlLayerRef.current = boundaryLayer;
                const bounds = boundaryLayer.getBounds();
                if (bounds.isValid()) {
                  mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
                }
              }
            }
            return;
          }
          
          if (mapInstanceRef.current) {
            // Handle both Feature and FeatureCollection
            let geojsonData;
            if (geojson.type === 'FeatureCollection') {
              geojsonData = geojson;
            } else if (geojson.type === 'Feature') {
              geojsonData = {
                type: 'FeatureCollection',
                features: [geojson]
              };
            } else {
              // If it's a geometry, wrap it in a Feature
              geojsonData = {
                type: 'FeatureCollection',
                features: [{
                  type: 'Feature',
                  geometry: geojson,
                  properties: {}
                }]
              };
            }
            
            const kmlLayer = L.geoJSON(geojsonData, {
              style: {
                color: "#22c55e", // Green color for KML boundary lines
                weight: 4, // Thicker lines for better visibility
                fillColor: "#22c55e",
                fillOpacity: 0.2,
                dashArray: "5, 5", // Dashed line style
                lineCap: "round",
                lineJoin: "round"
              },
              onEachFeature: (feature, layer) => {
                // Add hover effect
                layer.on({
                  mouseover: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                      weight: 6,
                      color: "#16a34a",
                      fillOpacity: 0.3
                    });
                  },
                  mouseout: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                      weight: 4,
                      color: "#22c55e",
                      fillOpacity: 0.2
                    });
                  }
                });
              }
            }).addTo(mapInstanceRef.current);
            kmlLayerRef.current = kmlLayer;
            
            const bounds = kmlLayer.getBounds();
            if (bounds.isValid()) {
              mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
              console.log('KML boundaries displayed on map, bounds:', bounds.toBBoxString());
            } else {
              console.warn('KML bounds are invalid');
            }
          } else {
            console.warn('No map instance available');
          }
        })
        .catch(error => {
          console.error('Failed to load KML:', error);
          console.error('KML URL was:', fullKmlUrl);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          // Try to use boundary as fallback if KML fails
          if (boundary && mapInstanceRef.current) {
            console.log('Attempting to use boundary prop as fallback...');
            try {
              const boundaryGeoJSON = boundaryToGeoJSON(boundary);
              if (boundaryGeoJSON) {
                // Remove any existing layers first
                if (kmlLayerRef.current) {
                  mapInstanceRef.current.removeLayer(kmlLayerRef.current);
                  kmlLayerRef.current = null;
                }
                
                const boundaryLayer = L.geoJSON(boundaryGeoJSON, {
                  style: {
                    color: "#22c55e",
                    weight: 4,
                    fillColor: "#22c55e",
                    fillOpacity: 0.2,
                    dashArray: "5, 5",
                    lineCap: "round",
                    lineJoin: "round"
                  }
                }).addTo(mapInstanceRef.current);
                kmlLayerRef.current = boundaryLayer;
                const bounds = boundaryLayer.getBounds();
                if (bounds.isValid()) {
                  mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
                  console.log('Boundary displayed as fallback');
                }
              }
            } catch (boundaryError) {
              console.error('Failed to display boundary fallback:', boundaryError);
            }
          }
        });
    };

    loadKML();
  }, [kmlUrl, mapLoaded, boundary]);

  // Expose debug function for testing KML loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testKML = (testUrl?: string) => {
        const urlToTest = testUrl || kmlUrl;
        if (!urlToTest) {
          console.error('No KML URL provided. Usage: window.testKML("your-kml-url")');
          return;
        }
        console.log('=== KML Debug Test ===');
        console.log('Testing URL:', urlToTest);
        console.log('Map loaded:', mapLoaded);
        console.log('Map instance:', !!mapInstanceRef.current);
        console.log('toGeoJSON available:', !!(window as any).toGeoJSON || !!(window as any).togeojson);
        
        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        fetch(urlToTest, { headers })
          .then(r => {
            console.log('Response status:', r.status);
            console.log('Content-Type:', r.headers.get('content-type'));
            return r.text();
          })
          .then(text => {
            console.log('KML content length:', text.length);
            console.log('First 300 chars:', text.substring(0, 300));
            const parser = new DOMParser();
            const kml = parser.parseFromString(text, 'text/xml');
            const coords = kml.querySelectorAll('coordinates');
            console.log('Coordinates found:', coords.length);
            if (coords.length > 0) {
              console.log('First coordinate:', coords[0].textContent?.substring(0, 150));
            }
            const placemarks = kml.querySelectorAll('Placemark');
            console.log('Placemarks found:', placemarks.length);
          })
          .catch(err => console.error('Test fetch error:', err));
      };
    }
  }, [kmlUrl, mapLoaded]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
        </div>
      )}
    </div>
  );
}

