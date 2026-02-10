// Example usage of Rwanda API Service
import rwandaApiService from '../services/rwandaApi';

// Example: Get all provinces
async function getAllProvinces() {
  try {
    const provinces = await rwandaApiService.getProvinces();
    console.log('Rwanda Provinces:', provinces);
    return provinces;
  } catch (error) {
    console.error('Error fetching provinces:', error);
  }
}

// Example: Get districts for a specific province
async function getDistrictsForProvince(provinceId) {
  try {
    const districts = await rwandaApiService.getDistricts(provinceId);
    console.log('Districts for province:', districts);
    return districts;
  } catch (error) {
    console.error('Error fetching districts:', error);
  }
}

// Example: Search for locations
async function searchLocations(query) {
  try {
    const results = await rwandaApiService.searchLocations(query);
    console.log('Search results for "' + query + '":', results);
    return results;
  } catch (error) {
    console.error('Error searching locations:', error);
  }
}

// Example: Get complete location hierarchy
async function getLocationHierarchy(provinceId, districtId, sectorId, villageId) {
  try {
    const hierarchy = await rwandaApiService.getLocationHierarchy(provinceId, districtId, sectorId, villageId);
    console.log('Location hierarchy:', hierarchy);
    return hierarchy;
  } catch (error) {
    console.error('Error fetching location hierarchy:', error);
  }
}

// Example usage
export async function runExamples() {
  console.log('=== Rwanda API Examples ===');
  
  // Get all provinces
  await getAllProvinces();
  
  // Search for specific locations
  await searchLocations('Kigali');
  await searchLocations('Musanze');
  
  // Get districts for first province (if any exist)
  const provinces = await getAllProvinces();
  if (provinces && provinces.length > 0) {
    await getDistrictsForProvince(provinces[0].id);
  }
}

// Export individual functions for use in components
export {
  getAllProvinces,
  getDistrictsForProvince,
  searchLocations,
  getLocationHierarchy
};
