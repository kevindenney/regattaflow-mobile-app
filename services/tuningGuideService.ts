/**
 * Tuning Guide Service
 * Manages tuning guides for boat classes including auto-scraping, uploads, and library management
 */

import { getDefaultGuidesForClass, normalizeClassKey } from '@/data/default-tuning-guides';
import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

export interface TuningGuide {
  id: string;
  classId: string;
  hull?: string | null;
  mast?: string | null;
  sailmaker?: string | null;
  rig?: string | null;
  title: string;
  source: string;
  sourceUrl?: string;
  fileUrl?: string;
  fileType: 'pdf' | 'doc' | 'image' | 'link';
  description?: string;
  year?: number;
  tags: string[];
  autoScraped: boolean;
  scrapeSuccessful: boolean;
  lastScrapedAt?: string;
  scrapeError?: string;
  uploadedBy?: string;
  isPublic: boolean;
  downloads: number;
  rating: number;
  extractedContent?: string;
  extractedSections?: any[];
  extractionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  extractionError?: string;
  extractedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FleetTuningGuide extends TuningGuide {
  sharedBy?: string;
  sharedByName?: string;
  shareNotes?: string;
  isRecommended?: boolean;
  sharedAt?: string;
}

export interface TuningGuideSource {
  name: string;
  urlPattern: string;
}

const logger = createLogger('tuningGuideService');
class TuningGuideService {
  /**
   * Get tuning guides for a specific boat class
   */
  async getGuidesForClass(classId: string, className?: string | null): Promise<TuningGuide[]> {
    return this.getGuidesByReference({ classId, className });
  }

  /**
   * Get sailor's personal tuning guide library
   */
  async getSailorLibrary(sailorId: string): Promise<TuningGuide[]> {
    const { data, error } = await supabase
      .from('sailor_tuning_guides')
      .select(`
        *,
        guide:tuning_guides(*)
      `)
      .eq('sailor_id', sailorId)
      .order('added_at', { ascending: false });

    if (error) {
      logger.error('Error fetching sailor library:', error);
      throw error;
    }

    return data?.map(item => this.mapGuide(item.guide)) || [];
  }

  /**
   * Get favorite tuning guides for a sailor
   */
  async getFavoriteGuides(sailorId: string): Promise<TuningGuide[]> {
    const { data, error } = await supabase
      .from('sailor_tuning_guides')
      .select(`
        *,
        guide:tuning_guides(*)
      `)
      .eq('sailor_id', sailorId)
      .eq('is_favorite', true)
      .order('added_at', { ascending: false });

    if (error) {
      logger.error('Error fetching favorite guides:', error);
      throw error;
    }

    return data?.map(item => this.mapGuide(item.guide)) || [];
  }

  /**
   * Add a guide to sailor's library
   */
  async addToLibrary(sailorId: string, guideId: string): Promise<void> {
    const { error } = await supabase
      .from('sailor_tuning_guides')
      .insert({
        sailor_id: sailorId,
        guide_id: guideId,
      });

    if (error) {
      logger.error('Error adding guide to library:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for a guide
   */
  async toggleFavorite(sailorId: string, guideId: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('sailor_tuning_guides')
      .update({ is_favorite: isFavorite })
      .eq('sailor_id', sailorId)
      .eq('guide_id', guideId);

    if (error) {
      logger.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Upload a new tuning guide
   */
  async uploadGuide(params: {
    classId: string;
    title: string;
    source: string;
    file: Blob;
    description?: string;
    year?: number;
    tags?: string[];
    isPublic?: boolean;
  }): Promise<TuningGuide> {
    const { classId, title, source, file, description, year, tags, isPublic } = params;
    
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tuning-guides')
      .upload(fileName, file);

    if (uploadError) {
      logger.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tuning-guides')
      .getPublicUrl(fileName);

    // Create database record
    const { data, error } = await supabase
      .from('tuning_guides')
      .insert({
        class_id: classId,
        title,
        source,
        file_url: urlData.publicUrl,
        file_type: this.getFileType(file.type),
        description,
        year,
        tags: tags || [],
        is_public: isPublic || false,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating guide record:', error);
      throw error;
    }

    return this.mapGuide(data);
  }

  /**
   * Auto-scrape tuning guides for a class
   * Note: This is a client-side trigger - actual scraping should be done server-side
   */
  async triggerAutoScrape(classId: string): Promise<void> {
    // Get class info with scraping sources
    const { data: classData, error: classError } = await supabase
      .from('boat_classes')
      .select('name, default_tuning_guide_sources')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      logger.error('Error fetching class data:', classError);
      return;
    }

    const sources: TuningGuideSource[] = classData.default_tuning_guide_sources || [];
    const className = classData.name;

    // Create placeholder records for scraping
    // In production, this would trigger a server-side scraping job
    const scrapePromises = sources.map(async (source) => {
      const url = source.urlPattern.replace('{class}', className.toLowerCase().replace(/\s/g, '-'));
      
      return supabase
        .from('tuning_guides')
        .insert({
          class_id: classId,
          title: `${className} - ${source.name} Tuning Guide`,
          source: source.name,
          source_url: url,
          file_type: 'link',
          auto_scraped: true,
          scrape_successful: false,
          is_public: true,
        });
    });

    await Promise.all(scrapePromises);
    
    logger.debug(`Triggered auto-scrape for ${sources.length} sources for class: ${className}`);
  }

  /**
   * Record guide download/view
   */
  async recordView(guideId: string, sailorId: string): Promise<void> {
    // Increment download counter
    await supabase.rpc('increment_guide_downloads', { guide_id: guideId });

    // Update last viewed
    const { error } = await supabase
      .from('sailor_tuning_guides')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('guide_id', guideId)
      .eq('sailor_id', sailorId);

    if (error) {
      logger.error('Error recording view:', error);
    }
  }

  /**
   * Search tuning guides
   */
  async searchGuides(params: {
    query?: string;
    classId?: string;
    tags?: string[];
    source?: string;
  }): Promise<TuningGuide[]> {
    let query = supabase
      .from('tuning_guides')
      .select('*')
      .eq('is_public', true);

    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }

    if (params.source) {
      query = query.eq('source', params.source);
    }

    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.contains('tags', params.tags);
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) {
      logger.error('Error searching guides:', error);
      throw error;
    }

    return this.mapGuides(data || []);
  }

  /**
   * Get fleet tuning guides
   */
  async getFleetGuides(fleetId: string): Promise<FleetTuningGuide[]> {
    const { data, error } = await supabase.rpc('get_fleet_tuning_guides', {
      p_fleet_id: fleetId,
    });

    if (error) {
      logger.error('Error fetching fleet guides:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...this.mapGuide({
        id: item.guide_id,
        title: item.guide_title,
        source: item.guide_source,
        file_url: item.guide_file_url,
        description: item.guide_description,
        tags: item.guide_tags,
        year: item.guide_year,
        extracted_content: item.guide_extracted_content,
      }),
      sharedBy: item.shared_by_id,
      sharedByName: item.shared_by_name,
      shareNotes: item.share_notes,
      isRecommended: item.is_recommended,
      sharedAt: item.shared_at,
    }));
  }

  /**
   * Share guide with fleet
   */
  async shareWithFleet(params: {
    fleetId: string;
    guideId: string;
    notes?: string;
    isRecommended?: boolean;
  }): Promise<void> {
    const { error } = await supabase.from('fleet_tuning_guides').insert({
      fleet_id: params.fleetId,
      guide_id: params.guideId,
      shared_by: (await supabase.auth.getUser()).data.user?.id,
      share_notes: params.notes,
      is_recommended: params.isRecommended || false,
    });

    if (error) {
      logger.error('Error sharing guide with fleet:', error);
      throw error;
    }
  }

  /**
   * Get all guides for sailor (personal + fleet guides)
   */
  async getAllSailorGuides(sailorId: string, classId?: string): Promise<{
    personal: TuningGuide[];
    fleet: FleetTuningGuide[];
  }> {
    // Get personal library
    const personalGuides = await this.getSailorLibrary(sailorId);

    // Get sailor's fleets
    const { data: fleetData } = await supabase
      .from('fleet_members')
      .select('fleet_id')
      .eq('user_id', sailorId)
      .eq('status', 'active');

    const fleetIds = fleetData?.map(f => f.fleet_id) || [];

    // Get all fleet guides
    const fleetGuidesPromises = fleetIds.map(fleetId => this.getFleetGuides(fleetId));
    const fleetGuidesArrays = await Promise.all(fleetGuidesPromises);
    const allFleetGuides = fleetGuidesArrays.flat();

    // Filter by class if specified
    const filteredPersonal = classId
      ? personalGuides.filter(g => g.classId === classId)
      : personalGuides;

    const filteredFleet = classId
      ? allFleetGuides.filter(g => g.classId === classId)
      : allFleetGuides;

    return {
      personal: filteredPersonal,
      fleet: filteredFleet,
    };
  }

  // Helper methods
  async getGuidesByReference(params: { classId?: string | null; className?: string | null }): Promise<TuningGuide[]> {
    const { classId, className } = params;
    logger.debug('[tuningGuideService] getGuidesByReference called', { classId, className });

    let resolvedClassName = className ?? null;
    let databaseGuides: TuningGuide[] = [];

    if (classId) {
      logger.debug('[tuningGuideService] Querying database for class reference', { classId });
      const { data, error } = await supabase
        .from('tuning_guides')
        .select('*')
        .eq('class_id', classId)
        .order('year', { ascending: false });

      if (error) {
        logger.error('[tuningGuideService] Error fetching tuning guides', error);
        throw error;
      }

      databaseGuides = this.mapGuides(data || []);
      logger.debug('[tuningGuideService] Database guides found', {
        count: databaseGuides.length,
        guides: databaseGuides.map(g => ({ id: g.id, title: g.title }))
      });

      if (!resolvedClassName) {
        const { data: classData } = await supabase
          .from('boat_classes')
          .select('name')
          .eq('id', classId)
          .maybeSingle();

        resolvedClassName = classData?.name ?? null;
        logger.debug('[tuningGuideService] Resolved class name for lookup', { resolvedClassName });
      }
    }

    if (databaseGuides.length > 0) {
      logger.debug('[tuningGuideService] Returning database guides');
      return databaseGuides;
    }

    logger.info('[tuningGuideService] No database guides found, trying fallback', {
      classId,
      className: resolvedClassName,
    });
    const fallbackGuides = await this.buildFallbackGuides({
      classId,
      className: resolvedClassName,
    });

    if (fallbackGuides.length > 0) {
      logger.info('[tuningGuideService] Using built-in tuning guides', {
        count: fallbackGuides.length,
        classRef: classId || resolvedClassName || 'unknown',
      });
      logger.debug(
        `Using built-in tuning guides for class reference ${classId || resolvedClassName || 'unknown'}`
      );
      return fallbackGuides;
    }

    logger.warn('[tuningGuideService] No guides found for provided class reference');
    return [];
  }

  private async buildFallbackGuides(params: {
    classId?: string | null;
    className?: string | null;
  }): Promise<TuningGuide[]> {
    const { classId, className } = params;
    let resolvedClassName = className ?? null;

    if (!resolvedClassName && classId) {
      try {
        const { data: classData } = await supabase
          .from('boat_classes')
          .select('name')
          .eq('id', classId)
          .maybeSingle();

        resolvedClassName = classData?.name ?? null;
      } catch (error) {
        logger.warn('Failed to resolve class name for fallback guides', error);
      }
    }

    const defaults = getDefaultGuidesForClass(resolvedClassName ?? classId ?? undefined);

    if (defaults.length === 0) {
      return [];
    }

    const fallbackClassId =
      classId ?? `fallback-${normalizeClassKey(resolvedClassName ?? 'unknown')}`;
    const timestamp = '2024-01-01T00:00:00.000Z';

    return defaults.map((guide, index) => ({
      id: `default-${fallbackClassId}-${index}`,
      classId: fallbackClassId,
      hull: guide.hull || null,
      mast: guide.mast || null,
      sailmaker: guide.sailmaker || null,
      rig: guide.rig || null,
      title: guide.title,
      source: guide.source,
      sourceUrl: guide.sourceUrl,
      fileUrl: guide.sourceUrl,
      fileType: guide.fileType || 'link',
      description: guide.description,
      year: guide.year,
      tags: guide.tags || [],
      autoScraped: false,
      scrapeSuccessful: true,
      lastScrapedAt: timestamp,
      scrapeError: undefined,
      uploadedBy: 'system-default',
      isPublic: true,
      downloads: 0,
      rating: 5,
      extractedContent: guide.sections
        .map(section => `${section.title}\n${section.content}`)
        .join('\n\n'),
      extractedSections: guide.sections,
      extractionStatus: 'completed',
      extractionError: undefined,
      extractedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
  }

  private mapGuide(data: any): TuningGuide {
    return {
      id: data.id,
      classId: data.class_id,
      hull: data.hull,
      mast: data.mast,
      sailmaker: data.sailmaker,
      rig: data.rig,
      title: data.title,
      source: data.source,
      sourceUrl: data.source_url,
      fileUrl: data.file_url,
      fileType: data.file_type,
      description: data.description,
      year: data.year,
      tags: data.tags || [],
      autoScraped: data.auto_scraped,
      scrapeSuccessful: data.scrape_successful,
      lastScrapedAt: data.last_scraped_at,
      scrapeError: data.scrape_error,
      uploadedBy: data.uploaded_by,
      isPublic: data.is_public,
      downloads: data.downloads || 0,
      rating: data.rating || 0,
      extractedContent: data.extracted_content,
      extractedSections: data.extracted_sections,
      extractionStatus: data.extraction_status,
      extractionError: data.extraction_error,
      extractedAt: data.extracted_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapGuides(data: any[]): TuningGuide[] {
    return data.map(item => this.mapGuide(item));
  }

  private getFileType(mimeType: string): 'pdf' | 'doc' | 'image' | 'link' {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
    if (mimeType.includes('image')) return 'image';
    return 'link';
  }
}

export const tuningGuideService = new TuningGuideService();
