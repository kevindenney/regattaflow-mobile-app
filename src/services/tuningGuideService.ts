/**
 * Tuning Guide Service
 * Manages tuning guides for boat classes including auto-scraping, uploads, and library management
 */

import { supabase } from './supabase';

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
  createdAt: string;
  updatedAt: string;
}

export interface TuningGuideSource {
  name: string;
  urlPattern: string;
}

class TuningGuideService {
  /**
   * Get tuning guides for a specific boat class
   */
  async getGuidesForClass(classId: string): Promise<TuningGuide[]> {
    const { data, error } = await supabase
      .from('tuning_guides')
      .select('*')
      .eq('class_id', classId)
      .order('year', { ascending: false });

    if (error) {
      console.error('Error fetching tuning guides:', error);
      throw error;
    }

    return this.mapGuides(data || []);
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
      console.error('Error fetching sailor library:', error);
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
      console.error('Error fetching favorite guides:', error);
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
      console.error('Error adding guide to library:', error);
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
      console.error('Error toggling favorite:', error);
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
      console.error('Error uploading file:', uploadError);
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
      console.error('Error creating guide record:', error);
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
      console.error('Error fetching class data:', classError);
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
    
    console.log(`Triggered auto-scrape for ${sources.length} sources for class: ${className}`);
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
      console.error('Error recording view:', error);
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
      console.error('Error searching guides:', error);
      throw error;
    }

    return this.mapGuides(data || []);
  }

  // Helper methods
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
