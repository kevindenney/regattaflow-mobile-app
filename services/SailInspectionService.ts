/**
 * SailInspectionService
 *
 * Manages sail inspections - CRUD operations, workflow orchestration,
 * photo uploads, and AI analysis coordination.
 */

import { supabase } from '@/services/supabase';
import { SailAnalysisAIService, SailZone, SailType, ZoneAnalysisResult, OverallSailAssessment, QuickInspectionResult, SailContext, DetectedIssue } from './ai/SailAnalysisAIService';

// =============================================================================
// Types
// =============================================================================

export type InspectionType = 'quick' | 'full' | 'pre_race' | 'post_race';
export type InspectionMode = 'guided' | 'quick';

export interface SailInspection {
  id: string;
  equipmentId: string;
  sailorId: string;
  boatId: string;
  inspectionDate: Date;
  inspectionType: InspectionType;
  inspectionMode: InspectionMode;
  overallConditionScore: number | null;
  raceReady: boolean;
  aiSummary: string | null;
  aiRecommendations: any[];
  zoneScores: Record<string, any>;
  issuesDetected: DetectedIssue[];
  photos: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SailInspectionPhoto {
  id: string;
  inspectionId: string;
  photoUrl: string;
  photoStoragePath: string | null;
  zone: SailZone;
  captureTimestamp: Date;
  aiAnalysis: ZoneAnalysisResult | null;
  aiModelUsed: string | null;
  analysisTimestamp: Date | null;
  userNotes: string | null;
  userMarkedIssues: any[];
}

export interface InspectionSession {
  inspection: SailInspection;
  completedZones: SailZone[];
  pendingZones: SailZone[];
  zoneResults: Map<SailZone, ZoneAnalysisResult>;
}

export interface SailAlert {
  equipmentId: string;
  sailName: string;
  sailType: string;
  alertLevel: 'critical' | 'warning' | 'info' | 'ok';
  message: string;
  lastInspectionDate: Date | null;
  lastInspectionScore: number | null;
  daysSinceInspection: number | null;
}

export interface SailWithHealth {
  equipment_id: string;
  boat_id: string;
  name: string | null;
  sail_number: string | null;
  sailmaker: string | null;
  sail_type: string | null;
  material: string | null;
  design_name: string | null;
  purchase_date: string | null;
  condition_score: number | null;
  last_inspection_date: string | null;
  total_usage_hours: number | null;
  needs_inspection: boolean;
}

export interface SailEquipmentDetails {
  equipmentId: string;
  sailNumber?: string;
  sailmaker?: string;
  loftLocation?: string;
  designName?: string;
  material?: string;
  constructionType?: string;
  weightGramsPerSqm?: number;
  areaSqm?: number;
  battenCount?: number;
  battenType?: string;
  optimalWindRangeMin?: number;
  optimalWindRangeMax?: number;
  primaryUse?: string;
  estimatedRaceHours?: number;
  estimatedRaceHoursRemaining?: number;
  sailmakerServiceDue?: boolean;
  lastProfessionalInspection?: Date;
  classMeasurementCert?: string;
  measurementDate?: Date;
}

// Default zones for a full inspection
const FULL_INSPECTION_ZONES: SailZone[] = ['head', 'leech', 'foot', 'luff', 'battens', 'cloth'];

// =============================================================================
// Service Class
// =============================================================================

export class SailInspectionService {
  // ===========================================================================
  // Inspection Lifecycle
  // ===========================================================================

  /**
   * Start a new inspection session
   */
  static async startInspection(
    sailId: string,
    type: InspectionType,
    mode: InspectionMode
  ): Promise<InspectionSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get sail equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('boat_equipment')
      .select('id, boat_id, custom_name, category')
      .eq('id', sailId)
      .single();

    if (equipmentError || !equipment) {
      throw new Error('Sail equipment not found');
    }

    // Create inspection record
    const { data: inspection, error } = await supabase
      .from('sail_inspections')
      .insert({
        equipment_id: sailId,
        sailor_id: user.id,
        boat_id: equipment.boat_id,
        inspection_type: type,
        inspection_mode: mode,
        zone_scores: {},
        issues_detected: [],
        photos: [],
      })
      .select()
      .single();

    if (error || !inspection) {
      throw new Error(`Failed to create inspection: ${error?.message}`);
    }

    return {
      inspection: this.mapInspection(inspection),
      completedZones: [],
      pendingZones: mode === 'guided' ? [...FULL_INSPECTION_ZONES] : [],
      zoneResults: new Map(),
    };
  }

  /**
   * Submit a zone photo for analysis
   */
  static async submitZonePhoto(
    inspectionId: string,
    zone: SailZone,
    photoUri: string,
    context?: SailContext
  ): Promise<ZoneAnalysisResult> {
    // Upload photo to storage
    const photoUrl = await this.uploadPhoto(inspectionId, zone, photoUri);

    // Convert to base64 for AI analysis
    const photoBase64 = await SailAnalysisAIService.convertImageToBase64(photoUri);

    // Analyze with AI
    const result = await SailAnalysisAIService.analyzeZonePhoto(photoBase64, zone, context);

    // Save photo record with analysis
    const { error: photoError } = await supabase
      .from('sail_inspection_photos')
      .insert({
        inspection_id: inspectionId,
        photo_url: photoUrl,
        zone,
        ai_analysis: result,
        ai_model_used: 'claude-3-haiku-20240307',
        analysis_timestamp: new Date().toISOString(),
      });

    if (photoError) {
      console.error('Failed to save photo record:', photoError);
    }

    // Update inspection with zone result
    const { data: inspection } = await supabase
      .from('sail_inspections')
      .select('zone_scores, issues_detected, photos')
      .eq('id', inspectionId)
      .single();

    if (inspection) {
      const zoneScores = inspection.zone_scores || {};
      zoneScores[zone] = {
        score: result.conditionScore,
        issues: result.issues,
        photos: [photoUrl],
        notes: result.aiNotes,
      };

      const allIssues = [...(inspection.issues_detected || []), ...result.issues];
      const allPhotos = [...(inspection.photos || []), photoUrl];

      await supabase
        .from('sail_inspections')
        .update({
          zone_scores: zoneScores,
          issues_detected: allIssues,
          photos: allPhotos,
        })
        .eq('id', inspectionId);
    }

    return result;
  }

  /**
   * Complete an inspection and generate final assessment
   */
  static async completeInspection(
    inspectionId: string,
    zoneResults: ZoneAnalysisResult[],
    context?: SailContext
  ): Promise<SailInspection> {
    // Generate overall assessment
    const assessment = await SailAnalysisAIService.generateOverallAssessment(zoneResults, context);

    // Update inspection with final results
    const { data, error } = await supabase
      .from('sail_inspections')
      .update({
        overall_condition_score: assessment.overallScore,
        race_ready: assessment.raceReady,
        ai_summary: assessment.summary,
        ai_recommendations: assessment.prioritizedRecommendations,
        zone_scores: assessment.zoneScores,
        issues_detected: assessment.allIssues,
      })
      .eq('id', inspectionId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to complete inspection: ${error?.message}`);
    }

    return this.mapInspection(data);
  }

  /**
   * Perform a quick inspection with a single photo
   */
  static async performQuickInspection(
    sailId: string,
    photoUri: string,
    context?: SailContext
  ): Promise<SailInspection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get sail equipment
    const { data: equipment } = await supabase
      .from('boat_equipment')
      .select('id, boat_id')
      .eq('id', sailId)
      .single();

    if (!equipment) throw new Error('Sail not found');

    // Upload photo
    const photoUrl = await this.uploadPhoto('quick', 'overview', photoUri);

    // Analyze with AI
    const photoBase64 = await SailAnalysisAIService.convertImageToBase64(photoUri);
    const result = await SailAnalysisAIService.performQuickInspection(photoBase64, context);

    // Create inspection record with results
    const { data: inspection, error } = await supabase
      .from('sail_inspections')
      .insert({
        equipment_id: sailId,
        sailor_id: user.id,
        boat_id: equipment.boat_id,
        inspection_type: 'quick',
        inspection_mode: 'quick',
        overall_condition_score: result.overallScore,
        race_ready: result.raceReady,
        ai_summary: result.confidenceNote,
        ai_recommendations: result.recommendations.map(r => ({ action: r, priority: 'medium' })),
        zone_scores: result.estimatedZoneScores,
        issues_detected: result.visibleIssues,
        photos: [photoUrl],
      })
      .select()
      .single();

    if (error || !inspection) {
      throw new Error(`Failed to create quick inspection: ${error?.message}`);
    }

    // Save photo record
    await supabase
      .from('sail_inspection_photos')
      .insert({
        inspection_id: inspection.id,
        photo_url: photoUrl,
        zone: 'overview',
        ai_analysis: result,
        ai_model_used: 'claude-3-haiku-20240307',
        analysis_timestamp: new Date().toISOString(),
      });

    return this.mapInspection(inspection);
  }

  // ===========================================================================
  // History & Retrieval
  // ===========================================================================

  /**
   * Get inspection history for a sail
   */
  static async getInspectionHistory(
    sailId: string,
    limit: number = 10
  ): Promise<SailInspection[]> {
    const { data, error } = await supabase
      .from('sail_inspections')
      .select('*')
      .eq('equipment_id', sailId)
      .order('inspection_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get inspection history:', error);
      return [];
    }

    return (data || []).map(this.mapInspection);
  }

  /**
   * Get the latest inspection for a sail
   */
  static async getLatestInspection(sailId: string): Promise<SailInspection | null> {
    const { data, error } = await supabase
      .from('sail_inspections')
      .select('*')
      .eq('equipment_id', sailId)
      .order('inspection_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapInspection(data);
  }

  /**
   * Get inspection by ID with photos
   */
  static async getInspectionWithPhotos(inspectionId: string): Promise<{
    inspection: SailInspection;
    photos: SailInspectionPhoto[];
  } | null> {
    const { data: inspection, error: inspError } = await supabase
      .from('sail_inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (inspError || !inspection) return null;

    const { data: photos } = await supabase
      .from('sail_inspection_photos')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('capture_timestamp', { ascending: true });

    return {
      inspection: this.mapInspection(inspection),
      photos: (photos || []).map(this.mapPhoto),
    };
  }

  // ===========================================================================
  // Alerts
  // ===========================================================================

  /**
   * Get sails needing inspection for a boat
   */
  static async getSailsNeedingInspection(
    boatId: string,
    daysThreshold: number = 30
  ): Promise<SailAlert[]> {
    const { data, error } = await supabase
      .rpc('get_sails_needing_inspection', {
        p_boat_id: boatId,
        p_days_threshold: daysThreshold,
      });

    if (error) {
      console.error('Failed to get sails needing inspection:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      equipmentId: row.equipment_id,
      sailName: row.sail_name,
      sailType: row.sail_type,
      alertLevel: row.alert_level as SailAlert['alertLevel'],
      message: this.generateAlertMessage(row),
      lastInspectionDate: row.last_inspection_date ? new Date(row.last_inspection_date) : null,
      lastInspectionScore: row.last_inspection_score,
      daysSinceInspection: row.days_since_inspection,
    }));
  }

  /**
   * Get pre-race inspection alerts for upcoming race
   */
  static async getPreRaceInspectionAlerts(
    boatId: string,
    raceId?: string
  ): Promise<SailAlert[]> {
    // Get sails that need attention within 7 days
    return this.getSailsNeedingInspection(boatId, 7);
  }

  // ===========================================================================
  // Sail Equipment Details
  // ===========================================================================

  /**
   * Get sail-specific details
   */
  static async getSailDetails(equipmentId: string): Promise<SailEquipmentDetails | null> {
    const { data, error } = await supabase
      .from('sail_equipment_details')
      .select('*')
      .eq('equipment_id', equipmentId)
      .single();

    if (error || !data) return null;
    return this.mapSailDetails(data);
  }

  /**
   * Update or create sail-specific details
   */
  static async upsertSailDetails(details: SailEquipmentDetails): Promise<SailEquipmentDetails> {
    const { data, error } = await supabase
      .from('sail_equipment_details')
      .upsert({
        equipment_id: details.equipmentId,
        sail_number: details.sailNumber,
        sailmaker: details.sailmaker,
        loft_location: details.loftLocation,
        design_name: details.designName,
        material: details.material,
        construction_type: details.constructionType,
        weight_grams_per_sqm: details.weightGramsPerSqm,
        area_sqm: details.areaSqm,
        batten_count: details.battenCount,
        batten_type: details.battenType,
        optimal_wind_range_min: details.optimalWindRangeMin,
        optimal_wind_range_max: details.optimalWindRangeMax,
        primary_use: details.primaryUse,
        estimated_race_hours: details.estimatedRaceHours,
        estimated_race_hours_remaining: details.estimatedRaceHoursRemaining,
        sailmaker_service_due: details.sailmakerServiceDue,
        last_professional_inspection: details.lastProfessionalInspection?.toISOString(),
        class_measurement_cert: details.classMeasurementCert,
        measurement_date: details.measurementDate?.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to save sail details: ${error?.message}`);
    }

    return this.mapSailDetails(data);
  }

  // ===========================================================================
  // Sail Inventory
  // ===========================================================================

  /**
   * Get sail inventory for a boat with health status
   */
  static async getSailInventory(boatId: string): Promise<SailWithHealth[]> {
    const { data, error } = await supabase
      .from('sail_inventory_with_health')
      .select('*')
      .eq('boat_id', boatId);

    if (error) {
      console.error('Failed to get sail inventory:', error);
      return [];
    }

    // Map view columns to SailWithHealth interface
    return (data || []).map((row: Record<string, unknown>) => ({
      equipment_id: row.id as string,
      boat_id: row.boat_id as string,
      name: row.custom_name as string | null,
      sail_number: row.sail_number as string | null,
      sailmaker: row.sailmaker as string | null,
      sail_type: row.sail_type as string | null,
      material: row.material as string | null,
      design_name: row.design_name as string | null,
      purchase_date: row.purchase_date as string | null,
      condition_score: row.last_inspection_score as number | null,
      last_inspection_date: row.last_inspection_date as string | null,
      total_usage_hours: row.total_usage_hours as number | null,
      needs_inspection: (row.inspection_overdue as boolean) ?? true,
    }));
  }

  // ===========================================================================
  // Photo Management
  // ===========================================================================

  private static async uploadPhoto(
    inspectionId: string,
    zone: string,
    photoUri: string
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const timestamp = Date.now();
      const filename = `${user.id}/${inspectionId}/${zone}_${timestamp}.jpg`;

      // Read file as blob
      const response = await fetch(photoUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('sail-inspections')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        // Return local URI as fallback
        return photoUri;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sail-inspections')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Photo upload failed:', error);
      return photoUri; // Return local URI as fallback
    }
  }

  // ===========================================================================
  // Mapping Helpers
  // ===========================================================================

  private static mapInspection(row: any): SailInspection {
    return {
      id: row.id,
      equipmentId: row.equipment_id,
      sailorId: row.sailor_id,
      boatId: row.boat_id,
      inspectionDate: new Date(row.inspection_date),
      inspectionType: row.inspection_type,
      inspectionMode: row.inspection_mode,
      overallConditionScore: row.overall_condition_score,
      raceReady: row.race_ready,
      aiSummary: row.ai_summary,
      aiRecommendations: row.ai_recommendations || [],
      zoneScores: row.zone_scores || {},
      issuesDetected: row.issues_detected || [],
      photos: row.photos || [],
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private static mapPhoto(row: any): SailInspectionPhoto {
    return {
      id: row.id,
      inspectionId: row.inspection_id,
      photoUrl: row.photo_url,
      photoStoragePath: row.photo_storage_path,
      zone: row.zone,
      captureTimestamp: new Date(row.capture_timestamp),
      aiAnalysis: row.ai_analysis,
      aiModelUsed: row.ai_model_used,
      analysisTimestamp: row.analysis_timestamp ? new Date(row.analysis_timestamp) : null,
      userNotes: row.user_notes,
      userMarkedIssues: row.user_marked_issues || [],
    };
  }

  private static mapSailDetails(row: any): SailEquipmentDetails {
    return {
      equipmentId: row.equipment_id,
      sailNumber: row.sail_number,
      sailmaker: row.sailmaker,
      loftLocation: row.loft_location,
      designName: row.design_name,
      material: row.material,
      constructionType: row.construction_type,
      weightGramsPerSqm: row.weight_grams_per_sqm,
      areaSqm: row.area_sqm,
      battenCount: row.batten_count,
      battenType: row.batten_type,
      optimalWindRangeMin: row.optimal_wind_range_min,
      optimalWindRangeMax: row.optimal_wind_range_max,
      primaryUse: row.primary_use,
      estimatedRaceHours: row.estimated_race_hours,
      estimatedRaceHoursRemaining: row.estimated_race_hours_remaining,
      sailmakerServiceDue: row.sailmaker_service_due,
      lastProfessionalInspection: row.last_professional_inspection
        ? new Date(row.last_professional_inspection)
        : undefined,
      classMeasurementCert: row.class_measurement_cert,
      measurementDate: row.measurement_date ? new Date(row.measurement_date) : undefined,
    };
  }

  private static generateAlertMessage(row: any): string {
    switch (row.alert_level) {
      case 'critical':
        if (!row.last_inspection_date) {
          return `${row.sail_name} has never been inspected`;
        }
        return `${row.sail_name} scored ${row.last_inspection_score}/100 - inspection required`;
      case 'warning':
        return `${row.sail_name} was last inspected ${row.days_since_inspection} days ago`;
      case 'info':
        return `${row.sail_name} scored ${row.last_inspection_score}/100 - consider re-inspection`;
      default:
        return `${row.sail_name} is in good condition`;
    }
  }
}

export default SailInspectionService;
