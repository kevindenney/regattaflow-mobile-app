/**
 * Circuit Planning Service
 * Handles logistics optimization for multi-venue racing campaigns
 */

import { supabase } from './supabase';

export interface CircuitEvent {
  id: string;
  venueId: string;
  venueName: string;
  country: string;
  startDate: string;
  endDate: string;
  eventName: string;
  entryFee: number;
  currency: string;
  isQualifier: boolean;
  qualificationPoints?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface TravelLeg {
  fromVenue: string;
  toVenue: string;
  distance: number; // km
  travelDays: number;
  estimatedCost: number;
  method: 'flight' | 'ferry' | 'drive' | 'train';
  carbonFootprint: number; // kg CO2
}

export interface EquipmentOption {
  type: 'ship' | 'charter' | 'buy-sell' | 'trailer';
  description: string;
  cost: number;
  prepDays: number;
  pros: string[];
  cons: string[];
}

export interface VisaRequirement {
  country: string;
  required: boolean;
  processingDays: number;
  cost: number;
  notes: string;
}

export interface AccommodationEstimate {
  venue: string;
  nights: number;
  avgCostPerNight: number;
  totalCost: number;
  recommendations: string[];
}

export interface CircuitBudget {
  entryFees: number;
  travel: number;
  accommodation: number;
  equipment: number;
  meals: number;
  visa: number;
  contingency: number;
  total: number;
}

export interface Circuit {
  id: string;
  userId: string;
  name: string;
  description: string;
  events: CircuitEvent[];
  budget: CircuitBudget;
  totalDays: number;
  totalDistance: number;
  qualificationImpact: number;
  carbonFootprint: number;
  createdAt: string;
  updatedAt: string;
}

export class CircuitPlanningService {
  /**
   * Calculate great-circle distance between two points (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate optimal travel method and cost
   */
  static calculateTravelLeg(from: CircuitEvent, to: CircuitEvent): TravelLeg {
    const distance = this.calculateDistance(
      from.coordinates.lat,
      from.coordinates.lng,
      to.coordinates.lat,
      to.coordinates.lng
    );

    let method: 'flight' | 'ferry' | 'drive' | 'train' = 'flight';
    let travelDays = 1;
    let estimatedCost = 0;
    let carbonFootprint = 0;

    // Determine optimal travel method based on distance and geography
    if (distance < 200) {
      // Short distance - drive
      method = 'drive';
      travelDays = 1;
      estimatedCost = distance * 0.5; // $0.50/km for car
      carbonFootprint = distance * 0.12; // 120g CO2/km
    } else if (distance < 500) {
      // Medium distance - train or drive
      method = 'train';
      travelDays = 1;
      estimatedCost = distance * 0.3; // $0.30/km for train
      carbonFootprint = distance * 0.041; // 41g CO2/km
    } else if (distance < 1000 && this.isCoastal(from, to)) {
      // Coastal medium distance - ferry option
      method = 'ferry';
      travelDays = 2;
      estimatedCost = 200 + distance * 0.2; // Base + per km
      carbonFootprint = distance * 0.019; // 19g CO2/km
    } else {
      // Long distance - flight
      method = 'flight';
      travelDays = 1;
      estimatedCost = 300 + distance * 0.15; // Base + per km
      carbonFootprint = distance * 0.255; // 255g CO2/km
    }

    return {
      fromVenue: from.venueName,
      toVenue: to.venueName,
      distance: Math.round(distance),
      travelDays,
      estimatedCost: Math.round(estimatedCost),
      method,
      carbonFootprint: Math.round(carbonFootprint),
    };
  }

  /**
   * Check if venues are coastal (simplified - would use real coastal data)
   */
  private static isCoastal(from: CircuitEvent, to: CircuitEvent): boolean {
    // Simplified: Asia-Pacific region check
    const asiaCoastal =
      (from.country === 'Hong Kong' || from.country === 'Japan') &&
      (to.country === 'Hong Kong' || to.country === 'Japan');

    return asiaCoastal;
  }

  /**
   * Calculate equipment transport options
   */
  static calculateEquipmentOptions(events: CircuitEvent[]): EquipmentOption[] {
    if (events.length === 0) return [];

    const totalDistance = events.reduce((acc, event, i) => {
      if (i === 0) return 0;
      const leg = this.calculateTravelLeg(events[i - 1], event);
      return acc + leg.distance;
    }, 0);

    const options: EquipmentOption[] = [
      {
        type: 'ship',
        description: 'Container shipping to each venue',
        cost: Math.round(3000 + totalDistance * 0.8), // Base + per km
        prepDays: 21,
        pros: [
          'Use your own boat',
          'Familiar equipment',
          'Can ship spares/gear',
        ],
        cons: [
          'Long lead time',
          'Risk of damage/delay',
          'Customs hassles',
        ],
      },
      {
        type: 'charter',
        description: 'Charter boats at each venue',
        cost: Math.round(events.length * 2500), // Per event
        prepDays: 3,
        pros: [
          'No shipping logistics',
          'Quick setup',
          'Local boats optimized for conditions',
        ],
        cons: [
          'Unfamiliar boats',
          'Limited practice time',
          'May not be available',
        ],
      },
      {
        type: 'buy-sell',
        description: 'Buy boat at first venue, sell at last',
        cost: Math.round(8000), // Depreciation + transaction costs
        prepDays: 7,
        pros: [
          'Own boat for entire circuit',
          'No repeated shipping',
          'Potential to break even',
        ],
        cons: [
          'Market risk',
          'Finding buyers',
          'Boat may need work',
        ],
      },
    ];

    // Add trailer option for circuits within driveable distance
    if (totalDistance < 2000) {
      options.push({
        type: 'trailer',
        description: 'Trailer boat between venues',
        cost: Math.round(totalDistance * 0.4), // Per km towing
        prepDays: 2,
        pros: [
          'Full control',
          'Flexible timing',
          'Can bring all gear',
        ],
        cons: [
          'Driving time',
          'Fatigue',
          'Vehicle/trailer rental needed',
        ],
      });
    }

    return options.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Calculate visa requirements
   */
  static async calculateVisaRequirements(
    events: CircuitEvent[],
    sailorNationality: string
  ): Promise<VisaRequirement[]> {
    const uniqueCountries = [...new Set(events.map((e) => e.country))];

    // Simplified visa logic - would integrate with visa API
    const visaData: Record<string, { processingDays: number; cost: number; notes: string }> = {
      'Hong Kong': { processingDays: 0, cost: 0, notes: 'Visa-free for most nationalities (90 days)' },
      'Japan': { processingDays: 7, cost: 30, notes: 'Tourist visa required, single entry' },
      'Australia': { processingDays: 14, cost: 145, notes: 'eVisitor or ETA required' },
      'Thailand': { processingDays: 0, cost: 0, notes: 'Visa on arrival (30 days)' },
      'Singapore': { processingDays: 0, cost: 0, notes: 'Visa-free for most nationalities' },
    };

    return uniqueCountries.map((country) => {
      const data = visaData[country] || {
        processingDays: 14,
        cost: 100,
        notes: 'Visa requirements vary by nationality',
      };

      return {
        country,
        required: data.cost > 0,
        processingDays: data.processingDays,
        cost: data.cost,
        notes: data.notes,
      };
    });
  }

  /**
   * Calculate accommodation estimates
   */
  static calculateAccommodation(events: CircuitEvent[]): AccommodationEstimate[] {
    return events.map((event) => {
      const eventDays = Math.ceil(
        (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Add prep days before and travel day after
      const nights = eventDays + 3;

      // Regional pricing (simplified)
      const avgCostPerNight = event.country === 'Hong Kong' ? 120 :
                               event.country === 'Japan' ? 100 :
                               event.country === 'Australia' ? 110 :
                               event.country === 'Singapore' ? 130 :
                               80;

      return {
        venue: event.venueName,
        nights,
        avgCostPerNight,
        totalCost: Math.round(nights * avgCostPerNight),
        recommendations: [
          'Book yacht club accommodation if available',
          'Consider Airbnb for longer stays',
          'Team house for 4+ sailors',
        ],
      };
    });
  }

  /**
   * Optimize circuit order to minimize travel
   */
  static optimizeCircuitOrder(events: CircuitEvent[]): CircuitEvent[] {
    if (events.length <= 2) return events;

    // Simple nearest-neighbor optimization
    const optimized: CircuitEvent[] = [events[0]];
    const remaining = events.slice(1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      remaining.forEach((event, index) => {
        const distance = this.calculateDistance(
          current.coordinates.lat,
          current.coordinates.lng,
          event.coordinates.lat,
          event.coordinates.lng
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  /**
   * Calculate complete circuit budget
   */
  static calculateBudget(events: CircuitEvent[]): CircuitBudget {
    // Entry fees
    const entryFees = events.reduce((sum, event) => {
      // Convert to USD (simplified)
      const usdAmount =
        event.currency === 'HKD' ? event.entryFee * 0.13 :
        event.currency === 'JPY' ? event.entryFee * 0.0067 :
        event.currency === 'AUD' ? event.entryFee * 0.65 :
        event.entryFee;

      return sum + usdAmount;
    }, 0);

    // Travel
    const travel = events.reduce((sum, event, i) => {
      if (i === 0) return sum;
      const leg = this.calculateTravelLeg(events[i - 1], event);
      return sum + leg.estimatedCost;
    }, 0);

    // Accommodation
    const accommodation = this.calculateAccommodation(events).reduce(
      (sum, acc) => sum + acc.totalCost,
      0
    );

    // Equipment (average shipping cost)
    const equipment = events.length > 0 ?
      this.calculateEquipmentOptions(events)[0]?.cost || 0 : 0;

    // Meals ($50/day)
    const totalDays = this.calculateTotalDays(events);
    const meals = totalDays * 50;

    // Visa (estimated)
    const visa = events.length * 50; // Average across destinations

    // Contingency (10%)
    const subtotal = entryFees + travel + accommodation + equipment + meals + visa;
    const contingency = Math.round(subtotal * 0.1);

    return {
      entryFees: Math.round(entryFees),
      travel: Math.round(travel),
      accommodation: Math.round(accommodation),
      equipment: Math.round(equipment),
      meals: Math.round(meals),
      visa: Math.round(visa),
      contingency,
      total: Math.round(subtotal + contingency),
    };
  }

  /**
   * Calculate total days for circuit
   */
  static calculateTotalDays(events: CircuitEvent[]): number {
    if (events.length === 0) return 0;

    const firstStart = new Date(events[0].startDate);
    const lastEnd = new Date(events[events.length - 1].endDate);

    return Math.ceil((lastEnd.getTime() - firstStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate qualification impact
   */
  static calculateQualificationImpact(events: CircuitEvent[]): number {
    // Sum qualification points
    const totalPoints = events.reduce(
      (sum, event) => sum + (event.qualificationPoints || 0),
      0
    );

    // Bonus for completing full circuit
    const circuitBonus = events.length >= 3 ? 10 : 0;

    return totalPoints + circuitBonus;
  }

  /**
   * Save circuit to database
   */
  static async saveCircuit(circuit: Omit<Circuit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Circuit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('racing_circuits')
      .insert({
        user_id: user.id,
        name: circuit.name,
        description: circuit.description,
        events: circuit.events,
        budget: circuit.budget,
        total_days: circuit.totalDays,
        total_distance: circuit.totalDistance,
        qualification_impact: circuit.qualificationImpact,
        carbon_footprint: circuit.carbonFootprint,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's saved circuits
   */
  static async getCircuits(): Promise<Circuit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('racing_circuits')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete circuit
   */
  static async deleteCircuit(circuitId: string): Promise<void> {
    const { error } = await supabase
      .from('racing_circuits')
      .delete()
      .eq('id', circuitId);

    if (error) throw error;
  }
}
