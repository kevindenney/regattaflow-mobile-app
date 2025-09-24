# RegattaFlow Architecture Documentation

## Overview

RegattaFlow is a professional maritime application designed for sailing enthusiasts and racing teams. The architecture prioritizes performance, cost-effectiveness, and maritime-specific functionality.

## Mapping Engine Decision: MapLibre vs Mapbox

### Decision: MapLibre GL

After careful evaluation, we chose **MapLibre GL** as our primary mapping engine over Mapbox GL for the following reasons:

#### Cost Analysis
- **MapLibre**: Free and open source
- **Mapbox**: $0.50-$5.00 per 1,000 map loads
- **Projected Savings**: $2,000-$10,000 annually for typical usage

#### Maritime Functionality
- **OpenSeaMap Integration**: Native support for nautical charts
- **Bathymetry Support**: NOAA and GEBCO data integration
- **Custom Styling**: Full control over nautical chart appearance
- **Performance**: Optimized for marine data visualization

#### Technical Benefits
- **Bundle Size**: ~200KB smaller than Mapbox GL
- **No API Keys Required**: Simplified deployment and development
- **Open Source**: No vendor lock-in, community-driven development
- **Professional Features**: Advanced 3D terrain and bathymetry rendering

## Core Architecture

### Map Engine Layer (`src/components/map/engines/`)
- **MapLibreEngine**: Primary mapping implementation
- **Capabilities**: 3D terrain, nautical charts, performance optimization
- **Data Sources**: OpenSeaMap, NOAA, GEBCO

### Service Layer (`src/services/`)
- **Weather Services**: Real-time marine weather data
- **Bathymetry Services**: Seabed depth and topography
- **AIS Services**: Vessel tracking and fleet management
- **Tactical Services**: Racing strategy and navigation

### Data Layer (`src/data/`)
- **Sailing Locations**: Venue configurations and coordinates
- **Race Marks**: Course definitions and waypoints
- **Weather Patterns**: Historical and forecast data

## Professional Features

### Real-time Updates
- Weather conditions updated every 15 minutes
- AIS vessel positions updated every 30 seconds
- Automatic performance optimization based on device capabilities

### Maritime Visualization
- 3D underwater terrain with exaggerated relief
- Depth contours with customizable intervals
- Nautical symbols and navigation aids
- Current flow and tidal information

### Racing Tools
- Tactical layline calculations
- Start line advantage analysis
- Fleet tracking and positioning
- Course optimization algorithms

## Performance Characteristics

### Memory Usage
- Base map: ~50MB
- With bathymetry: ~150MB
- Professional mode: ~250MB
- Automatic garbage collection for long sessions

### Network Efficiency
- Tile-based loading with intelligent caching
- Compression for maritime data layers
- Progressive enhancement for high-resolution features
- Offline capability for cached areas

### Device Optimization
- Automatic quality adjustment for low-end devices
- Frame rate monitoring with dynamic scaling
- Memory pressure handling
- Battery impact optimization

## Data Sources and APIs

### Nautical Charts
- **OpenSeaMap**: Primary source for nautical symbols and navigation aids
- **Coverage**: Global marine areas with regular updates
- **License**: Open Database License (ODbL)

### Bathymetry Data
- **NOAA**: High-resolution US coastal waters
- **GEBCO**: Global ocean depth data
- **Resolution**: Up to 1-meter resolution in key areas

### Weather Services
- **WeatherAPI Pro**: Marine-specific forecasting
- **PredictWind**: Sailing-optimized weather models
- **Update Frequency**: 15-minute intervals for professional mode

### Vessel Tracking
- **AIS Stream**: Real-time vessel positions
- **Coverage**: Global AIS network
- **Data Types**: Position, speed, course, vessel details

## Security and Privacy

### API Key Management
- Environment-based configuration
- No sensitive data in client code
- Optional API keys for enhanced features

### Data Handling
- Minimal personal data collection
- Location data processed locally
- No tracking of sailing patterns or performance

## Future Enhancements

### Planned Features
1. **Advanced Weather Routing**: AI-powered course optimization
2. **Collaborative Racing**: Multi-crew tactical planning
3. **Performance Analytics**: Detailed sailing performance metrics
4. **Offline Navigation**: Complete offline capability for remote areas

### Scalability Considerations
- Microservices architecture for service scaling
- CDN deployment for global tile serving
- Database sharding for historical data
- Real-time event streaming for live racing

## Development Guidelines

### Code Organization
- Feature-based module structure
- Separation of maritime domain logic
- Reusable components for map interactions
- Comprehensive TypeScript typing

### Performance Standards
- 60fps target for smooth animations
- <200ms response time for tactical calculations
- <5MB memory growth per hour of usage
- <10% battery impact during normal use

### Testing Strategy
- Unit tests for navigation calculations
- Integration tests for service APIs
- Performance tests for map rendering
- End-to-end tests for racing scenarios

## Conclusion

The MapLibre-based architecture provides RegattaFlow with a cost-effective, performant, and maritime-focused foundation. The open-source approach ensures long-term maintainability while the professional feature set meets the demanding requirements of competitive sailing and yacht racing.