import { API_BASE_URL } from '@/config/api';

const BASE_URL = API_BASE_URL;

class RwandaApiService {
  async makeRequest(endpoint, params = {}) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error(`Rwanda API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getProvinces(query) {
    return this.makeRequest('/provinces', { q: query });
  }

  async getDistricts(provinceId, query) {
    return this.makeRequest('/districts', { p: provinceId, q: query });
  }

  async getSectors(districtId, provinceId, query) {
    return this.makeRequest('/sectors', { p: provinceId, d: districtId, q: query });
  }

  async getCells(sectorId, districtId, provinceId, query) {
    return this.makeRequest('/cells', { p: provinceId, d: districtId, s: sectorId, q: query });
  }

  async getVillages(cellId, sectorId, districtId, provinceId, query) {
    return this.makeRequest('/villages', { p: provinceId, d: districtId, s: sectorId, c: cellId, q: query });
  }

  async getLocationHierarchy(provinceId, districtId, sectorId, cellId, villageId) {
    const [provinces, districts, sectors, cells, villages] = await Promise.all([
      this.getProvinces(),
      provinceId ? this.getDistricts(provinceId) : Promise.resolve([]),
      districtId ? this.getSectors(districtId, provinceId) : Promise.resolve([]),
      sectorId ? this.getCells(sectorId, districtId, provinceId) : Promise.resolve([]),
      cellId ? this.getVillages(cellId, sectorId, districtId, provinceId) : Promise.resolve([]),
    ]);

    return { provinces, districts, sectors, cells, villages };
  }

  async searchLocations(query, type = 'all') {
    if (!query) return [];
    
    // We try to search on all levels using global query `q` where allowed.
    // The backend may require p,d,s for exact search but since we just pass q it might work or return empty.
    const promises = [];
    if (type === 'all' || type === 'provinces') promises.push(this.getProvinces(query).then(res => res.map(item => ({ ...item, type: 'province' }))));
    if (type === 'all' || type === 'districts') promises.push(this.getDistricts(null, query).then(res => res.map(item => ({ ...item, type: 'district' }))));
    if (type === 'all' || type === 'sectors') promises.push(this.getSectors(null, null, query).then(res => res.map(item => ({ ...item, type: 'sector' }))));
    if (type === 'all' || type === 'cells') promises.push(this.getCells(null, null, null, query).then(res => res.map(item => ({ ...item, type: 'cell' }))));
    if (type === 'all' || type === 'villages') promises.push(this.getVillages(null, null, null, null, query).then(res => res.map(item => ({ ...item, type: 'village' }))));
    
    try {
      const results = await Promise.all(promises);
      return results.flat();
    } catch(e) {
      console.warn("Global search failed:", e);
      return [];
    }
  }

  async getLocationByCoordinates(latitude, longitude) {
    return null;
  }
}

const rwandaApiService = new RwandaApiService();
export default rwandaApiService;
