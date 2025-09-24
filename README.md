# RegattaFlow - Professional Sailing & Racing App 🚤

This is a professional maritime application built with [Expo](https://expo.dev) for sailing enthusiasts and racing teams.

## Architecture Overview

### Mapping Engine: MapLibre GL

We use **MapLibre GL** as our primary mapping engine for the following reasons:

- **Cost Effective**: Free and open source (vs $0.50-$5 per 1k requests for commercial alternatives)
- **Maritime Focus**: Excellent integration with OpenSeaMap for nautical charts
- **No Vendor Lock-in**: Full control over mapping capabilities
- **Professional Features**: Advanced bathymetry, terrain rendering, and 3D visualization
- **Bundle Size**: ~200KB smaller than commercial alternatives

### Key Maritime Features

- **Nautical Charts**: Integrated OpenSeaMap support
- **Bathymetry Data**: NOAA and GEBCO integration for depth visualization
- **Real-time Weather**: Professional weather services integration
- **AIS Vessel Tracking**: Live vessel positions and fleet management
- **Racing Tools**: Tactical analysis, laylines, and course planning
- **3D Terrain**: Underwater topography and seafloor visualization

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Maritime Development Setup

3. Configure API keys (optional)
   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Add your API keys for enhanced features:
   # WEATHER_API_KEY=your_weather_api_key
   # AISSTREAM_API_KEY=your_ais_api_key
   ```

4. Enable professional features
   ```bash
   # Professional mode enables advanced maritime features
   npm run start -- --professional
   ```

## Technical Stack

### Core Technologies
- **React Native + Expo**: Cross-platform mobile development
- **MapLibre GL**: Open source mapping and visualization
- **TypeScript**: Type-safe development
- **React Three Fiber**: 3D graphics and terrain rendering

### Maritime Data Sources
- **OpenSeaMap**: Nautical charts and marine navigation aids
- **NOAA**: Bathymetry data and weather services
- **GEBCO**: Global ocean depth data
- **AIS Stream**: Real-time vessel tracking

### Professional Services Integration
- **Weather Services**: Multiple API providers for accurate marine weather
- **Bathymetry Services**: High-resolution seabed mapping
- **Tactical Services**: Racing strategy and navigation tools

## Development Resources

- [Expo documentation](https://docs.expo.dev/): Framework fundamentals and guides
- [MapLibre GL Documentation](https://maplibre.org/maplibre-gl-js-docs/): Mapping capabilities
- [OpenSeaMap](https://www.openseamap.org/): Nautical chart data source
- [NOAA Data Services](https://www.noaa.gov/): Weather and bathymetry APIs

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
