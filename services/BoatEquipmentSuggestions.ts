/**
 * Boat Equipment Suggestions Service
 * Provides autocomplete suggestions for boat classes and their common equipment
 * Based on real-world data for Hong Kong and international fleets
 */

export interface BoatClassSuggestion {
  name: string;
  aliases?: string[]; // Alternative names/variations
  category: 'keelboat' | 'dinghy' | 'youth' | 'grand_prix';
  region?: 'hong_kong' | 'international' | 'both';
}

export interface EquipmentSuggestion {
  hullMakers: string[];
  rigMakers: string[];
  sailMakers: string[];
}

export interface BoatClassEquipmentMap {
  [className: string]: EquipmentSuggestion;
}

// Common boat classes with their equipment suggestions
export const BOAT_CLASS_SUGGESTIONS: BoatClassSuggestion[] = [
  // Hong Kong Popular Classes
  { name: 'Dragon', aliases: ['Dragon Class'], category: 'keelboat', region: 'both' },
  { name: 'Etchells', aliases: ['Etchells 22'], category: 'keelboat', region: 'both' },
  { name: 'J/70', aliases: ['J70', 'J 70'], category: 'keelboat', region: 'both' },
  { name: 'J/80', aliases: ['J80', 'J 80'], category: 'keelboat', region: 'both' },
  { name: 'Pandora', aliases: ['Pandora 26'], category: 'keelboat', region: 'hong_kong' },
  { name: 'Flying Fifteen', aliases: ['Flying 15', 'Flying Fifteen', 'FF15'], category: 'keelboat', region: 'both' },
  { name: 'TP52', aliases: ['TP 52'], category: 'grand_prix', region: 'both' },
  
  // Youth/Junior Classes (Hong Kong)
  { name: 'Optimist', aliases: ['Opti', 'Optimist Dinghy'], category: 'youth', region: 'both' },
  { name: 'Laser', aliases: ['ILCA', 'ILCA 7', 'ILCA 6', 'ILCA 4'], category: 'dinghy', region: 'both' },
  { name: '420', aliases: ['420 Dinghy'], category: 'youth', region: 'both' },
  { name: '29er', aliases: ['29er Skiff'], category: 'youth', region: 'both' },
  { name: 'RS Feva', aliases: ['Feva', 'RS Feva XL'], category: 'youth', region: 'both' },
  { name: 'Topper', aliases: ['Topper Dinghy'], category: 'youth', region: 'both' },
  
  // Other Popular Classes
  { name: 'Melges 24', aliases: ['M24'], category: 'keelboat', region: 'both' },
  { name: 'Melges 32', aliases: ['M32'], category: 'keelboat', region: 'both' },
  { name: 'Beneteau First', aliases: ['First 40.7', 'First 36.7'], category: 'keelboat', region: 'both' },
  { name: 'IRC', aliases: ['IRC Racing'], category: 'grand_prix', region: 'both' },
  { name: 'ORC', aliases: ['ORC Racing'], category: 'grand_prix', region: 'both' },
];

// Equipment suggestions by boat class
export const EQUIPMENT_SUGGESTIONS: BoatClassEquipmentMap = {
  // Dragon Class
  'Dragon': {
    hullMakers: ['Petticrows', 'Chang hulls', 'Borresen', 'Børresen', 'Petticrows Yachts'],
    rigMakers: ['Seldén', 'Z-Spars', 'Hall Spars'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails', 'UK Sailmakers', 'Elvstrøm Sails'],
  },
  
  // Etchells
  'Etchells': {
    hullMakers: ['Etchells Yachts', 'David Heritage Yachts'],
    rigMakers: ['Seldén', 'Hall Spars', 'Southern Spars'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails', 'UK Sailmakers'],
  },
  
  // J/70
  'J/70': {
    hullMakers: ['J Boats', 'J/Boats'],
    rigMakers: ['Seldén', 'Hall Spars', 'Z-Spars'],
    sailMakers: ['North Sails', 'Quantum Sails', 'UK Sailmakers', 'Doyle Sails', 'J/World Sails'],
  },
  
  // J/80
  'J/80': {
    hullMakers: ['J Boats', 'J/Boats'],
    rigMakers: ['Seldén', 'Hall Spars'],
    sailMakers: ['North Sails', 'Quantum Sails', 'UK Sailmakers', 'Doyle Sails'],
  },
  
  // Pandora
  'Pandora': {
    hullMakers: ['Pandora Yachts', 'Pandora International'],
    rigMakers: ['Seldén', 'Z-Spars'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails', 'UK Sailmakers'],
  },
  
  // Flying Fifteen
  'Flying Fifteen': {
    hullMakers: ['Ovington Boats', 'Ovington', 'Flying Fifteen International'],
    rigMakers: ['Seldén', 'Z-Spars'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails', 'UK Sailmakers'],
  },
  
  // TP52
  'TP52': {
    hullMakers: ['Botin Partners', 'Farr Yacht Design', 'Reichel/Pugh'],
    rigMakers: ['Southern Spars', 'Hall Spars', 'Seldén'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails', 'UK Sailmakers'],
  },
  
  // Optimist
  'Optimist': {
    hullMakers: ['Ovington', 'LaserPerformance', 'PSP', 'PSP Sailboats'],
    rigMakers: ['LaserPerformance', 'PSP'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails', 'UK Sailmakers', 'LaserPerformance'],
  },
  
  // Laser/ILCA
  'Laser': {
    hullMakers: ['LaserPerformance', 'PSP Sailboats', 'PSP'],
    rigMakers: ['LaserPerformance', 'PSP'],
    sailMakers: ['LaserPerformance', 'North Sails', 'Quantum Sails', 'Doyle Sails'],
  },
  
  // 420
  '420': {
    hullMakers: ['LaserPerformance', 'PSP Sailboats', 'Ovington'],
    rigMakers: ['LaserPerformance', 'PSP'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails', 'UK Sailmakers'],
  },
  
  // 29er
  '29er': {
    hullMakers: ['Ovington', 'PSP Sailboats', 'LaserPerformance'],
    rigMakers: ['LaserPerformance', 'PSP'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails'],
  },
  
  // RS Feva
  'RS Feva': {
    hullMakers: ['RS Sailing', 'RS'],
    rigMakers: ['RS Sailing', 'RS'],
    sailMakers: ['RS Sailing', 'North Sails', 'Quantum Sails'],
  },
  
  // Topper
  'Topper': {
    hullMakers: ['Topper International', 'Topper'],
    rigMakers: ['Topper International'],
    sailMakers: ['Topper International', 'North Sails', 'Quantum Sails'],
  },
  
  // Melges 24
  'Melges 24': {
    hullMakers: ['Melges Boat Works', 'Melges'],
    rigMakers: ['Hall Spars', 'Seldén', 'Southern Spars'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails'],
  },
  
  // Melges 32
  'Melges 32': {
    hullMakers: ['Melges Boat Works', 'Melges'],
    rigMakers: ['Hall Spars', 'Seldén', 'Southern Spars'],
    sailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails'],
  },
};

/**
 * Get equipment suggestions for a boat class
 */
export function getEquipmentSuggestions(className: string): EquipmentSuggestion | null {
  // Normalize class name for lookup
  const normalized = normalizeClassName(className);
  
  // Direct match
  if (EQUIPMENT_SUGGESTIONS[normalized]) {
    return EQUIPMENT_SUGGESTIONS[normalized];
  }
  
  // Check aliases
  for (const [key, equipment] of Object.entries(EQUIPMENT_SUGGESTIONS)) {
    const classInfo = BOAT_CLASS_SUGGESTIONS.find(c => c.name === key);
    if (classInfo?.aliases?.some(alias => normalizeClassName(alias) === normalized)) {
      return equipment;
    }
  }
  
  return null;
}

/**
 * Search boat class suggestions
 */
export function searchBoatClasses(query: string, region?: 'hong_kong' | 'international' | 'both'): BoatClassSuggestion[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return BOAT_CLASS_SUGGESTIONS.filter(c => !region || c.region === region || c.region === 'both');
  }
  
  return BOAT_CLASS_SUGGESTIONS.filter(classInfo => {
    // Filter by region if specified
    if (region && classInfo.region !== region && classInfo.region !== 'both') {
      return false;
    }
    
    // Check name match
    if (classInfo.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Check alias match
    if (classInfo.aliases?.some(alias => alias.toLowerCase().includes(normalizedQuery))) {
      return true;
    }
    
    return false;
  });
}

/**
 * Search equipment makers
 */
export function searchEquipmentMakers(
  type: 'hull' | 'rig' | 'sail',
  className: string,
  query: string
): string[] {
  const equipment = getEquipmentSuggestions(className);
  if (!equipment) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    switch (type) {
      case 'hull':
        return equipment.hullMakers;
      case 'rig':
        return equipment.rigMakers;
      case 'sail':
        return equipment.sailMakers;
    }
  }
  
  let makers: string[] = [];
  switch (type) {
    case 'hull':
      makers = equipment.hullMakers;
      break;
    case 'rig':
      makers = equipment.rigMakers;
      break;
    case 'sail':
      makers = equipment.sailMakers;
      break;
  }
  
  return makers.filter(maker => 
    maker.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Normalize boat class name for matching
 */
function normalizeClassName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\/\s-]/g, '') // Remove slashes, spaces, hyphens
    .replace(/j(\d+)/, 'j/$1') // Normalize J70 -> J/70
    .trim();
}

/**
 * Get all unique equipment makers across all classes
 */
export function getAllEquipmentMakers(type: 'hull' | 'rig' | 'sail'): string[] {
  const makers = new Set<string>();
  
  Object.values(EQUIPMENT_SUGGESTIONS).forEach(equipment => {
    switch (type) {
      case 'hull':
        equipment.hullMakers.forEach(m => makers.add(m));
        break;
      case 'rig':
        equipment.rigMakers.forEach(m => makers.add(m));
        break;
      case 'sail':
        equipment.sailMakers.forEach(m => makers.add(m));
        break;
    }
  });
  
  return Array.from(makers).sort();
}

/**
 * Search boat names from database
 * Returns suggestions based on existing boat names in the system
 */
export async function searchBoatNames(
  query: string,
  className?: string
): Promise<string[]> {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const { supabase } = await import('./supabase');
    
    let dbQuery = supabase
      .from('sailor_boats')
      .select('name')
      .not('name', 'is', null)
      .neq('name', '')
      .ilike('name', `%${query.trim()}%`)
      .limit(10);
    
    // If class name is provided, filter by class
    if (className && className.trim()) {
      // First, find the class ID
      const normalizedClassName = normalizeClassName(className.trim());
      const classInfo = BOAT_CLASS_SUGGESTIONS.find(c => 
        normalizeClassName(c.name) === normalizedClassName ||
        c.aliases?.some(alias => normalizeClassName(alias) === normalizedClassName)
      );
      
      if (classInfo) {
        // Get class ID from database
        const { data: boatClass, error: classError } = await supabase
          .from('boat_classes')
          .select('id')
          .ilike('name', `%${classInfo.name}%`)
          .maybeSingle();
        
        if (!classError && boatClass?.id) {
          dbQuery = dbQuery.eq('class_id', boatClass.id);
        }
      }
    }
    
    const { data, error } = await dbQuery;
    
    if (error) {
      console.warn('[BoatEquipmentSuggestions] Error searching boat names:', error);
      return [];
    }
    
    // Extract unique boat names
    const uniqueNames = new Set<string>();
    data?.forEach(boat => {
      if (boat.name && boat.name.trim()) {
        uniqueNames.add(boat.name.trim());
      }
    });
    
    return Array.from(uniqueNames).slice(0, 10);
  } catch (error) {
    console.warn('[BoatEquipmentSuggestions] Error in searchBoatNames:', error);
    return [];
  }
}

/**
 * Search sail numbers from database
 * Returns suggestions based on existing sail numbers in the system
 */
export async function searchSailNumbers(
  query: string,
  className?: string
): Promise<string[]> {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const { supabase } = await import('./supabase');
    
    let dbQuery = supabase
      .from('sailor_boats')
      .select('sail_number')
      .not('sail_number', 'is', null)
      .neq('sail_number', '')
      .ilike('sail_number', `%${query.trim()}%`)
      .limit(10);
    
    // If class name is provided, filter by class
    if (className && className.trim()) {
      const normalizedClassName = normalizeClassName(className.trim());
      const classInfo = BOAT_CLASS_SUGGESTIONS.find(c => 
        normalizeClassName(c.name) === normalizedClassName ||
        c.aliases?.some(alias => normalizeClassName(alias) === normalizedClassName)
      );
      
      if (classInfo) {
        const { data: boatClass, error: classError } = await supabase
          .from('boat_classes')
          .select('id')
          .ilike('name', `%${classInfo.name}%`)
          .maybeSingle();
        
        if (!classError && boatClass?.id) {
          dbQuery = dbQuery.eq('class_id', boatClass.id);
        }
      }
    }
    
    const { data, error } = await dbQuery;
    
    if (error) {
      console.warn('[BoatEquipmentSuggestions] Error searching sail numbers:', error);
      return [];
    }
    
    // Extract unique sail numbers
    const uniqueNumbers = new Set<string>();
    data?.forEach(boat => {
      if (boat.sail_number && boat.sail_number.trim()) {
        uniqueNumbers.add(boat.sail_number.trim());
      }
    });
    
    return Array.from(uniqueNumbers).slice(0, 10);
  } catch (error) {
    console.warn('[BoatEquipmentSuggestions] Error in searchSailNumbers:', error);
    return [];
  }
}

