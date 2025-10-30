export interface GeoLocation {
  latitude: number
  longitude: number
  altitude?: number
}

export interface BoundingBox {
  northeast: GeoLocation
  southwest: GeoLocation
}

export interface Map3DConfig {
  elevation: {
    exaggeration: number
    seaFloorRendering: boolean
    contourLines: {
      depths: number[]
      colors: string[]
    }
  }
  camera: {
    pitch: number
    bearing: number
    zoom: number
    animation: 'smooth' | 'instant'
    followMode: 'off' | 'GPS' | 'compass'
  }
  layers: {
    nauticalChart: boolean
    satellite: boolean
    bathymetry: boolean
    currentFlow: boolean
    windField: boolean
    hazards: boolean
  }
}

export interface RaceMark {
  id: string
  name: string
  position: GeoLocation
  type: 'start' | 'finish' | 'windward' | 'leeward' | 'gate' | 'offset'
  rounding: 'port' | 'starboard'
  color?: string
  size?: number
}

export interface WeatherConditions {
  wind: {
    speed: number
    direction: number
    gusts: number
  }
  tide: {
    height: number
    direction: 'flood' | 'ebb' | 'slack' | 'unknown'
    speed: number
  }
  waves: {
    height: number
    period: number
    direction: number
  }
  temperature?: number
  humidity?: number
  precipitation?: number
  cloudCover?: number
  timestamp: Date
}

export interface OfflineRegion {
  id: string
  name: string
  bounds: BoundingBox
  zoom: { min: number; max: number }
  layers: string[]
  size: number // MB
  progress: number // 0-100
  status: 'pending' | 'downloading' | 'complete' | 'error'
}
