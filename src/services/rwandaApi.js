// Rwanda Administrative API Service
const RAPIDAPI_KEY = '9f48ad82c6msh098f90f39b10139p116d6djsnc81534a14605';
const RAPIDAPI_HOST = 'rwanda.p.rapidapi.com';
const BASE_URL = 'https://rwanda.p.rapidapi.com';

class RwandaApiService {
  constructor() {
    this.headers = {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': RAPIDAPI_KEY,
      'Content-Type': 'application/json'
    };
  }

  async makeRequest(endpoint) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Rwanda API request failed:', error);
      throw error;
    }
  }

  // Get all provinces
  async getProvinces() {
    try {
      return await this.makeRequest('/provinces');
    } catch (error) {
      console.warn('Rwanda API not available, using mock data:', error);
      // Return mock data if API fails
      return [
        { id: '1', name: 'Kigali City' },
        { id: '2', name: 'Northern Province' },
        { id: '3', name: 'Southern Province' },
        { id: '4', name: 'Eastern Province' },
        { id: '5', name: 'Western Province' }
      ];
    }
  }

  // Get districts by province
  async getDistricts(provinceId) {
    return this.makeRequest(`/provinces/${provinceId}/districts`);
  }

  // Get sectors by district
  async getSectors(districtId) {
    return this.makeRequest(`/districts/${districtId}/sectors`);
  }

  // Get villages by sector
  async getVillages(sectorId) {
    return this.makeRequest(`/sectors/${sectorId}/villages`);
  }

  // Get cells by village
  async getCells(villageId) {
    return this.makeRequest(`/villages/${villageId}/cells`);
  }

  // Get all administrative levels for a specific location
  async getLocationHierarchy(provinceId, districtId, sectorId, villageId) {
    try {
      const [provinces, districts, sectors, villages] = await Promise.all([
        this.getProvinces(),
        districtId ? this.getDistricts(provinceId) : null,
        sectorId ? this.getSectors(districtId) : null,
        villageId ? this.getVillages(sectorId) : null
      ]);

      return {
        provinces,
        districts,
        sectors,
        villages
      };
    } catch (error) {
      console.error('Failed to fetch location hierarchy:', error);
      throw error;
    }
  }

  // Search locations by name
  async searchLocations(query, type = 'all') {
    try {
      const allProvinces = await this.getProvinces();
      const results = [];

      // Ensure allProvinces is an array
      if (!Array.isArray(allProvinces)) {
        console.warn('Provinces data is not an array:', allProvinces);
        return [];
      }

      // Search in provinces
      if (type === 'all' || type === 'provinces') {
        const provinceMatches = allProvinces.filter(province =>
          province.name && province.name.toLowerCase().includes(query.toLowerCase())
        );
        results.push(...provinceMatches.map(p => ({ ...p, type: 'province' })));
      }

      // Search in districts (if we have a province context)
      if (type === 'all' || type === 'districts') {
        for (const province of allProvinces) {
          try {
            const districts = await this.getDistricts(province.id);
            const districtMatches = districts.filter(district =>
              district.name.toLowerCase().includes(query.toLowerCase())
            );
            results.push(...districtMatches.map(d => ({ ...d, type: 'district', provinceId: province.id })));
          } catch (error) {
            // Continue if district fetch fails
            console.warn(`Failed to fetch districts for province ${province.id}:`, error);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Location search failed:', error);
      throw error;
    }
  }

  // Get location details by coordinates (if the API supports it)
  async getLocationByCoordinates(latitude, longitude) {
    // This would depend on the API's reverse geocoding capabilities
    // For now, we'll implement a basic search
    try {
      const searchResults = await this.searchLocations(`${latitude},${longitude}`);
      return searchResults[0] || null;
    } catch (error) {
      console.error('Failed to get location by coordinates:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const rwandaApiService = new RwandaApiService();
export default rwandaApiService;
