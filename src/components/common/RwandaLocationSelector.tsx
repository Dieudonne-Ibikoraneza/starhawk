import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import rwandaApiService from '@/services/rwandaApi';

interface LocationData {
  id: string;
  name: string;
  type?: string;
}

interface RwandaLocationSelectorProps {
  onLocationChange?: (location: {
    province?: LocationData;
    district?: LocationData;
    sector?: LocationData;
    village?: LocationData;
    cell?: LocationData;
  }) => void;
  initialValues?: {
    provinceId?: string;
    districtId?: string;
    sectorId?: string;
    villageId?: string;
    cellId?: string;
  };
  levels?: ('province' | 'district' | 'sector' | 'village' | 'cell')[];
  className?: string;
}

export default function RwandaLocationSelector({
  onLocationChange,
  initialValues = {},
  levels = ['province', 'district', 'sector'],
  className = ''
}: RwandaLocationSelectorProps) {
  const [provinces, setProvinces] = useState<LocationData[]>([]);
  const [districts, setDistricts] = useState<LocationData[]>([]);
  const [sectors, setSectors] = useState<LocationData[]>([]);
  const [villages, setVillages] = useState<LocationData[]>([]);
  const [cells, setCells] = useState<LocationData[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string>(initialValues.provinceId || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialValues.districtId || '');
  const [selectedSector, setSelectedSector] = useState<string>(initialValues.sectorId || '');
  const [selectedVillage, setSelectedVillage] = useState<string>(initialValues.villageId || '');
  const [selectedCell, setSelectedCell] = useState<string>(initialValues.cellId || '');

  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    sectors: false,
    villages: false,
    cells: false
  });

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince && levels.includes('district')) {
      loadDistricts(selectedProvince);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedProvince, levels]);

  // Load sectors when district changes
  useEffect(() => {
    if (selectedDistrict && levels.includes('sector')) {
      loadSectors(selectedDistrict);
    } else {
      setSectors([]);
      setSelectedSector('');
    }
  }, [selectedDistrict, levels]);

  // Load villages when sector changes
  useEffect(() => {
    if (selectedSector && levels.includes('village')) {
      loadVillages(selectedSector);
    } else {
      setVillages([]);
      setSelectedVillage('');
    }
  }, [selectedSector, levels]);

  // Load cells when village changes
  useEffect(() => {
    if (selectedVillage && levels.includes('cell')) {
      loadCells(selectedVillage);
    } else {
      setCells([]);
      setSelectedCell('');
    }
  }, [selectedVillage, levels]);

  // Notify parent component when location changes
  useEffect(() => {
    if (onLocationChange) {
      const location = {
        province: provinces.find(p => p.id === selectedProvince),
        district: districts.find(d => d.id === selectedDistrict),
        sector: sectors.find(s => s.id === selectedSector),
        village: villages.find(v => v.id === selectedVillage),
        cell: cells.find(c => c.id === selectedCell)
      };
      onLocationChange(location);
    }
  }, [selectedProvince, selectedDistrict, selectedSector, selectedVillage, selectedCell, provinces, districts, sectors, villages, cells, onLocationChange]);

  // Helper function to ensure data is an array
  const ensureArray = (data: any): LocationData[] => {
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object') {
      // Check if data has a nested array property
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      }
      if (data.results && Array.isArray(data.results)) {
        return data.results;
      }
      // Check for other common formats
      if (data.provinces && Array.isArray(data.provinces)) {
        return data.provinces;
      }
      if (data.districts && Array.isArray(data.districts)) {
        return data.districts;
      }
      if (data.sectors && Array.isArray(data.sectors)) {
        return data.sectors;
      }
    }
    console.warn('API returned non-array data, defaulting to empty array:', data);
    return [];
  };

  const loadProvinces = async () => {
    setLoading(prev => ({ ...prev, provinces: true }));
    try {
      const data = await rwandaApiService.getProvinces();
      console.log('Provinces API response:', data);
      const provincesArray = ensureArray(data);
      console.log('Processed provinces array:', provincesArray);
      
      if (provincesArray.length === 0) {
        console.warn('No provinces found, using fallback mock data');
        // Use mock data as fallback
        setProvinces([
          { id: '1', name: 'Kigali City' },
          { id: '2', name: 'Northern Province' },
          { id: '3', name: 'Southern Province' },
          { id: '4', name: 'Eastern Province' },
          { id: '5', name: 'Western Province' }
        ]);
      } else {
        setProvinces(provincesArray);
      }
    } catch (error) {
      console.error('Failed to load provinces:', error);
      // Use mock data on error
      setProvinces([
        { id: '1', name: 'Kigali City' },
        { id: '2', name: 'Northern Province' },
        { id: '3', name: 'Southern Province' },
        { id: '4', name: 'Eastern Province' },
        { id: '5', name: 'Western Province' }
      ]);
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  };

  const loadDistricts = async (provinceId: string) => {
    setLoading(prev => ({ ...prev, districts: true }));
    try {
      const data = await rwandaApiService.getDistricts(provinceId);
      setDistricts(ensureArray(data));
    } catch (error) {
      console.error('Failed to load districts:', error);
      setDistricts([]);
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  const loadSectors = async (districtId: string) => {
    setLoading(prev => ({ ...prev, sectors: true }));
    try {
      const data = await rwandaApiService.getSectors(districtId);
      setSectors(ensureArray(data));
    } catch (error) {
      console.error('Failed to load sectors:', error);
      setSectors([]);
    } finally {
      setLoading(prev => ({ ...prev, sectors: false }));
    }
  };

  const loadVillages = async (sectorId: string) => {
    setLoading(prev => ({ ...prev, villages: true }));
    try {
      const data = await rwandaApiService.getVillages(sectorId);
      setVillages(ensureArray(data));
    } catch (error) {
      console.error('Failed to load villages:', error);
      setVillages([]);
    } finally {
      setLoading(prev => ({ ...prev, villages: false }));
    }
  };

  const loadCells = async (villageId: string) => {
    setLoading(prev => ({ ...prev, cells: true }));
    try {
      const data = await rwandaApiService.getCells(villageId);
      setCells(ensureArray(data));
    } catch (error) {
      console.error('Failed to load cells:', error);
      setCells([]);
    } finally {
      setLoading(prev => ({ ...prev, cells: false }));
    }
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedDistrict('');
    setSelectedSector('');
    setSelectedVillage('');
    setSelectedCell('');
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedSector('');
    setSelectedVillage('');
    setSelectedCell('');
  };

  const handleSectorChange = (value: string) => {
    setSelectedSector(value);
    setSelectedVillage('');
    setSelectedCell('');
  };

  const handleVillageChange = (value: string) => {
    setSelectedVillage(value);
    setSelectedCell('');
  };

  const handleCellChange = (value: string) => {
    setSelectedCell(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {levels.includes('province') && (
        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.provinces ? "Loading provinces..." : "Select province"} />
            </SelectTrigger>
            <SelectContent>
              {loading.provinces ? (
                <SelectItem value="loading" disabled>Loading provinces...</SelectItem>
              ) : Array.isArray(provinces) && provinces.length > 0 ? (
                provinces.map((province) => (
                  <SelectItem key={province.id} value={province.id}>
                    {province.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-data" disabled>No provinces available</SelectItem>
              )}
            </SelectContent>
          </Select>
          {!loading.provinces && (!Array.isArray(provinces) || provinces.length === 0) && (
            <p className="text-xs text-yellow-600">Unable to load provinces. Please refresh the page.</p>
          )}
        </div>
      )}

      {levels.includes('district') && selectedProvince && (
        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.districts ? "Loading districts..." : "Select district"} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(districts) && districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {levels.includes('sector') && selectedDistrict && (
        <div className="space-y-2">
          <Label htmlFor="sector">Sector</Label>
          <Select value={selectedSector} onValueChange={handleSectorChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.sectors ? "Loading sectors..." : "Select sector"} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(sectors) && sectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {levels.includes('village') && selectedSector && (
        <div className="space-y-2">
          <Label htmlFor="village">Village</Label>
          <Select value={selectedVillage} onValueChange={handleVillageChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.villages ? "Loading villages..." : "Select village"} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(villages) && villages.map((village) => (
                <SelectItem key={village.id} value={village.id}>
                  {village.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {levels.includes('cell') && selectedVillage && (
        <div className="space-y-2">
          <Label htmlFor="cell">Cell</Label>
          <Select value={selectedCell} onValueChange={handleCellChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.cells ? "Loading cells..." : "Select cell"} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(cells) && cells.map((cell) => (
                <SelectItem key={cell.id} value={cell.id}>
                  {cell.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
