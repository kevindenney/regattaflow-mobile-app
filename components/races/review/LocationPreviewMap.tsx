/**
 * LocationPreviewMap - Base module for TypeScript resolution.
 * Platform-specific implementations live in .native.tsx and .web.tsx.
 * At runtime Metro/webpack will select the correct platform file.
 */

export { LocationPreviewMap } from './LocationPreviewMap.native';
