# Rwanda Administrative API Integration

This document describes the integration of the Rwanda Administrative API into the agricultural insurance dashboard system.

## Overview

The Rwanda API provides access to all administrative divisions in Rwanda including provinces, districts, sectors, villages, and cells. This integration allows the system to use real, up-to-date location data instead of hardcoded values.

## API Details

- **Base URL**: `https://rwanda.p.rapidapi.com`
- **API Key**: `9f48ad82c6msh098f90f39b10139p116d6djsnc81534a14605`
- **Host**: `rwanda.p.rapidapi.com`

## Files Created/Modified

### 1. API Service (`src/services/rwandaApi.js`)
- Centralized service for all Rwanda API calls
- Handles authentication and error management
- Provides methods for all administrative levels

### 2. Location Selector Component (`src/components/common/RwandaLocationSelector.tsx`)
- Reusable React component for location selection
- Supports hierarchical selection (province → district → sector → village → cell)
- Handles loading states and API errors gracefully

### 3. Location Search Component (`src/components/common/LocationSearch.tsx`)
- Search functionality for finding locations by name
- Real-time search with dropdown results
- Supports all administrative levels

### 4. Updated Components
- **Assessor Dashboard**: Added location search and real Rwanda locations
- **Farmer Registration**: Replaced hardcoded location data with API-driven selection

## Usage Examples

### Basic API Usage

```javascript
import rwandaApiService from '@/services/rwandaApi';

// Get all provinces
const provinces = await rwandaApiService.getProvinces();

// Get districts for a province
const districts = await rwandaApiService.getDistricts(provinceId);

// Search for locations
const results = await rwandaApiService.searchLocations('Kigali');
```

### Using Location Selector Component

```jsx
import RwandaLocationSelector from '@/components/common/RwandaLocationSelector';

function MyComponent() {
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <RwandaLocationSelector
      onLocationChange={setSelectedLocation}
      levels={['province', 'district', 'sector']}
      className="my-4"
    />
  );
}
```

### Using Location Search Component

```jsx
import LocationSearch from '@/components/common/LocationSearch';

function MyComponent() {
  const handleLocationSelect = (location) => {
    console.log('Selected location:', location);
  };

  return (
    <LocationSearch
      onLocationSelect={handleLocationSelect}
      placeholder="Search for locations..."
    />
  );
}
```

## API Methods

### `getProvinces()`
Returns all provinces in Rwanda.

### `getDistricts(provinceId)`
Returns all districts for a specific province.

### `getSectors(districtId)`
Returns all sectors for a specific district.

### `getVillages(sectorId)`
Returns all villages for a specific sector.

### `getCells(villageId)`
Returns all cells for a specific village.

### `searchLocations(query, type)`
Searches for locations by name across all administrative levels.

### `getLocationHierarchy(provinceId, districtId, sectorId, villageId)`
Returns a complete hierarchy of locations for the specified IDs.

## Error Handling

All API methods include proper error handling:
- Network errors are caught and logged
- API errors return meaningful messages
- Components handle loading and error states gracefully

## Performance Considerations

- API calls are cached where possible
- Components use loading states to prevent multiple simultaneous calls
- Search functionality includes debouncing to reduce API calls

## Future Enhancements

1. **Caching**: Implement local storage caching for frequently accessed data
2. **Offline Support**: Cache location data for offline usage
3. **Reverse Geocoding**: Add coordinate-based location lookup
4. **Validation**: Add location validation for form submissions

## Testing

The integration includes example usage in `src/examples/RwandaApiExample.js` that demonstrates all API methods and component usage.

## Security Notes

- API key is stored in the service file (consider environment variables for production)
- All API calls are made over HTTPS
- No sensitive data is stored locally

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure the RapidAPI key is valid and active
2. **Network Errors**: Check internet connection and API availability
3. **Component Not Loading**: Verify all imports are correct
4. **Search Not Working**: Check if the API service is properly initialized

### Debug Mode

Enable debug logging by setting `console.log` statements in the API service methods to track API calls and responses.
