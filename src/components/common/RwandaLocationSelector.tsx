import React, { useState, useEffect, useRef } from 'react';
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
    cell?: LocationData;
    village?: LocationData;
  }) => void;
  initialValues?: {
    provinceId?: string;
    districtId?: string;
    sectorId?: string;
    cellId?: string;
    villageId?: string;
  };
  levels?: ('province' | 'district' | 'sector' | 'cell' | 'village')[];
  className?: string;
}

const ensureArray = (data: any): LocationData[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.items && Array.isArray(data.items)) return data.items;
    if (data.results && Array.isArray(data.results)) return data.results;
  }
  return [];
};

export default function RwandaLocationSelector({
  onLocationChange,
  initialValues = {},
  levels = ['province', 'district', 'sector'],
  className = ''
}: RwandaLocationSelectorProps) {
  const [provinces, setProvinces] = useState<LocationData[]>([]);
  const [districts, setDistricts] = useState<LocationData[]>([]);
  const [sectors, setSectors] = useState<LocationData[]>([]);
  const [cells, setCells] = useState<LocationData[]>([]);
  const [villages, setVillages] = useState<LocationData[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string>(initialValues.provinceId || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialValues.districtId || '');
  const [selectedSector, setSelectedSector] = useState<string>(initialValues.sectorId || '');
  const [selectedCell, setSelectedCell] = useState<string>(initialValues.cellId || '');
  const [selectedVillage, setSelectedVillage] = useState<string>(initialValues.villageId || '');

  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    sectors: false,
    cells: false,
    villages: false,
  });

  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => { onLocationChangeRef.current = onLocationChange; }, [onLocationChange]);

  // Load provinces on mount
  useEffect(() => {
    const load = async () => {
      setLoading(prev => ({ ...prev, provinces: true }));
      try {
        const data = await rwandaApiService.getProvinces();
        const arr = ensureArray(data).map((p: any) => ({
          ...p,
          id: p.id || p.slug || '',
          name: p.name || '',
        })).filter((p: LocationData) => p.id && p.name);
        setProvinces(arr.length > 0 ? arr : [
          { id: 'kigali', name: 'City of Kigali' },
          { id: 'north', name: 'Northern Province' },
          { id: 'south', name: 'Southern Province' },
          { id: 'east', name: 'Eastern Province' },
          { id: 'west', name: 'Western Province' },
        ]);
      } catch {
        setProvinces([
          { id: 'kigali', name: 'City of Kigali' },
          { id: 'north', name: 'Northern Province' },
          { id: 'south', name: 'Southern Province' },
          { id: 'east', name: 'Eastern Province' },
          { id: 'west', name: 'Western Province' },
        ]);
      } finally {
        setLoading(prev => ({ ...prev, provinces: false }));
      }
    };
    load();
  }, []);

  // Load districts when province or levels change (e.g., user switches level to district+)
  useEffect(() => {
    if (selectedProvince && levels.includes('district')) {
      setLoading(prev => ({ ...prev, districts: true }));
      rwandaApiService.getDistricts(selectedProvince)
        .then(data => setDistricts(ensureArray(data)))
        .catch(() => setDistricts([]))
        .finally(() => setLoading(prev => ({ ...prev, districts: false })));
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedProvince, levels.join('|')]);

  // Load sectors when district or levels change
  useEffect(() => {
    if (selectedDistrict && levels.includes('sector')) {
      setLoading(prev => ({ ...prev, sectors: true }));
      rwandaApiService.getSectors(selectedDistrict, selectedProvince)
        .then(data => setSectors(ensureArray(data)))
        .catch(() => setSectors([]))
        .finally(() => setLoading(prev => ({ ...prev, sectors: false })));
    } else {
      setSectors([]);
      setSelectedSector('');
    }
  }, [selectedDistrict, levels.join('|')]);

  // Load cells when sector or levels change
  useEffect(() => {
    if (selectedSector && levels.includes('cell')) {
      setLoading(prev => ({ ...prev, cells: true }));
      rwandaApiService.getCells(selectedSector, selectedDistrict, selectedProvince)
        .then(data => setCells(ensureArray(data)))
        .catch(() => setCells([]))
        .finally(() => setLoading(prev => ({ ...prev, cells: false })));
    } else {
      setCells([]);
      setSelectedCell('');
    }
  }, [selectedSector, levels.join('|')]);

  // Load villages when cell or levels change
  useEffect(() => {
    if (selectedCell && levels.includes('village')) {
      setLoading(prev => ({ ...prev, villages: true }));
      rwandaApiService.getVillages(selectedCell, selectedSector, selectedDistrict, selectedProvince)
        .then(data => setVillages(ensureArray(data)))
        .catch(() => setVillages([]))
        .finally(() => setLoading(prev => ({ ...prev, villages: false })));
    } else {
      setVillages([]);
      setSelectedVillage('');
    }
  }, [selectedCell, levels.join('|')]);

  // Notify parent when selection changes
  useEffect(() => {
    if (onLocationChangeRef.current) {
      onLocationChangeRef.current({
        province: provinces.find(p => p.id === selectedProvince),
        district: districts.find(d => d.id === selectedDistrict),
        sector: sectors.find(s => s.id === selectedSector),
        cell: cells.find(c => c.id === selectedCell),
        village: villages.find(v => v.id === selectedVillage),
      });
    }
  }, [selectedProvince, selectedDistrict, selectedSector, selectedCell, selectedVillage, provinces, districts, sectors, cells, villages]);

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedDistrict('');
    setSelectedSector('');
    setSelectedCell('');
    setSelectedVillage('');
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedSector('');
    setSelectedCell('');
    setSelectedVillage('');
  };

  const handleSectorChange = (value: string) => {
    setSelectedSector(value);
    setSelectedCell('');
    setSelectedVillage('');
  };

  const handleCellChange = (value: string) => {
    setSelectedCell(value);
    setSelectedVillage('');
  };

  const handleVillageChange = (value: string) => {
    setSelectedVillage(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {levels.includes('province') && (
        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.provinces ? 'Loading provinces...' : 'Select province'} />
            </SelectTrigger>
            <SelectContent>
              {loading.provinces ? (
                <SelectItem value="loading" disabled>Loading provinces...</SelectItem>
              ) : provinces.length > 0 ? (
                provinces.map(province => (
                  <SelectItem key={province.id} value={province.id}>{province.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="no-data" disabled>No provinces available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {levels.includes('district') && selectedProvince && (
        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.districts ? 'Loading districts...' : 'Select district'} />
            </SelectTrigger>
            <SelectContent>
              {loading.districts ? (
                <SelectItem value="loading" disabled>Loading districts...</SelectItem>
              ) : districts.map(district => (
                <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
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
              <SelectValue placeholder={loading.sectors ? 'Loading sectors...' : 'Select sector'} />
            </SelectTrigger>
            <SelectContent>
              {loading.sectors ? (
                <SelectItem value="loading" disabled>Loading sectors...</SelectItem>
              ) : sectors.map(sector => (
                <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {levels.includes('cell') && selectedSector && (
        <div className="space-y-2">
          <Label htmlFor="cell">Cell</Label>
          <Select value={selectedCell} onValueChange={handleCellChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.cells ? 'Loading cells...' : 'Select cell'} />
            </SelectTrigger>
            <SelectContent>
              {loading.cells ? (
                <SelectItem value="loading" disabled>Loading cells...</SelectItem>
              ) : cells.map(cell => (
                <SelectItem key={cell.id} value={cell.id}>{cell.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {levels.includes('village') && selectedCell && (
        <div className="space-y-2">
          <Label htmlFor="village">Village</Label>
          <Select value={selectedVillage} onValueChange={handleVillageChange}>
            <SelectTrigger>
              <SelectValue placeholder={loading.villages ? 'Loading villages...' : 'Select village'} />
            </SelectTrigger>
            <SelectContent>
              {loading.villages ? (
                <SelectItem value="loading" disabled>Loading villages...</SelectItem>
              ) : villages.map(village => (
                <SelectItem key={village.id} value={village.id}>{village.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
