/**
 * Wind Particle Layer - Platform-agnostic export
 *
 * Automatically selects the correct implementation based on platform:
 * - Web: Full animated particles with deck.gl-particle
 * - Native: Simplified vector arrows
 */

export * from './WindParticleLayer.web';
