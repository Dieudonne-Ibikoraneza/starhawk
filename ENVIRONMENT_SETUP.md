# Environment Configuration Guide

This document explains how to configure the frontend for different environments using environment variables.

## Environment Variables

The application uses a single environment variable `VITE_API_URL` to configure the backend API endpoint for different environments.

### Development (.env)
```bash
# API Configuration
# Change this URL for different environments (development, staging, production)
VITE_API_URL=http://localhost:3000

# For production, change to: https://your-production-backend.com
# For staging, change to: https://your-staging-backend.com
```

### Production (.env.production)
```bash
VITE_API_URL=https://starhawk-backend-agriplatform-a39f.onrender.com
```

### Staging (.env.staging)
```bash
VITE_API_URL=https://your-staging-backend.com
```

## How It Works

1. **Single Source of Truth**: All API calls use `VITE_API_URL` environment variable
2. **Automatic Fallback**: If not set, defaults to `http://localhost:3000`
3. **Easy Deployment**: Just change the `.env` file for different environments

## Files Updated

The following files have been updated to use the environment variable:

- `src/config/api.ts` - Main API configuration
- `src/lib/api.ts` - API client class
- `src/services/authAPI.ts` - Authentication service
- `src/services/usersAPI.ts` - Users service
- `src/components/assessor/RiskAssessmentSystem.tsx` - Main assessment component
- `src/components/insurer/SatelliteStatistics.tsx` - Satellite statistics
- `src/components/insurer/WeatherForecast.tsx` - Weather forecast

## Usage Examples

### Development
```bash
# Copy the example file
cp .env.example .env

# Start development server
npm run dev
```

### Production
```bash
# Set production environment variable
export VITE_API_URL=https://your-production-backend.com

# Build for production
npm run build
```

### Docker/CI/CD
```yaml
# Example for GitHub Actions
- name: Build and Deploy
  env:
    VITE_API_URL: ${{ secrets.PRODUCTION_API_URL }}
  run: |
    npm run build
```

## Benefits

✅ **Easy Environment Switching**: Change one variable to switch between dev/staging/prod
✅ **No Hardcoded URLs**: No more searching and replacing URLs in code
✅ **Consistent Configuration**: All files use the same environment variable
✅ **Production Ready**: Simple deployment process for any environment
✅ **Team Collaboration**: `.env.example` provides template for new developers
