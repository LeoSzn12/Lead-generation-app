/**
 * Advanced deduplication utilities for lead generation
 * Uses fuzzy matching and normalization to detect duplicates
 */

export interface BusinessData {
  name?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  website?: string;
}

/**
 * Normalize business name by removing common suffixes and special characters
 */
export function normalizeBusinessName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Remove common business suffixes
    .replace(/\b(llc|inc|corp|ltd|co|company|incorporated|limited|corporation)\b\.?/g, '')
    // Remove special characters except spaces
    .replace(/[^\w\s]/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize phone number to digits only
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Check if two businesses are duplicates
 */
export function isDuplicate(
  business1: BusinessData,
  business2: BusinessData,
  threshold: number = 0.85
): boolean {
  const name1 = normalizeBusinessName(business1.name || business1.businessName || '');
  const name2 = normalizeBusinessName(business2.name || business2.businessName || '');

  // If names are empty, can't determine
  if (!name1 || !name2) return false;

  // Check phone number first (most reliable)
  const phone1 = normalizePhone(business1.phone || '');
  const phone2 = normalizePhone(business2.phone || '');
  
  if (phone1 && phone2 && phone1 === phone2) {
    return true; // Same phone = definitely duplicate
  }

  // Check exact name match after normalization
  if (name1 === name2) {
    // If same name, check address similarity
    const addr1 = (business1.address || '').toLowerCase().trim();
    const addr2 = (business2.address || '').toLowerCase().trim();
    
    if (addr1 && addr2) {
      const addrSimilarity = calculateSimilarity(addr1, addr2);
      return addrSimilarity > 0.7; // Same name + similar address = duplicate
    }
    
    return true; // Same name, no address to compare = likely duplicate
  }

  // Check fuzzy name match
  const nameSimilarity = calculateSimilarity(name1, name2);
  
  if (nameSimilarity >= threshold) {
    // High name similarity - check address if available
    const addr1 = (business1.address || '').toLowerCase().trim();
    const addr2 = (business2.address || '').toLowerCase().trim();
    
    if (addr1 && addr2) {
      const addrSimilarity = calculateSimilarity(addr1, addr2);
      return addrSimilarity > 0.6; // Similar name + similar address = duplicate
    }
    
    return true; // Very similar name, no address = likely duplicate
  }

  return false;
}

/**
 * Remove duplicates from an array of businesses
 */
export function removeDuplicates<T extends BusinessData>(
  businesses: T[],
  threshold: number = 0.85
): T[] {
  const unique: T[] = [];
  const seen = new Set<string>();

  for (const business of businesses) {
    // Quick check using normalized name + phone
    const name = normalizeBusinessName(business.name || business.businessName || '');
    const phone = normalizePhone(business.phone || '');
    const quickKey = `${name}|${phone}`;
    
    if (seen.has(quickKey)) {
      continue; // Exact duplicate
    }

    // Check against all unique businesses
    let isDupe = false;
    for (const uniqueBusiness of unique) {
      if (isDuplicate(business, uniqueBusiness, threshold)) {
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      unique.push(business);
      seen.add(quickKey);
    }
  }

  return unique;
}

/**
 * Find potential duplicates for a single business in a list
 */
export function findDuplicates<T extends BusinessData>(
  business: BusinessData,
  businesses: T[],
  threshold: number = 0.85
): T[] {
  return businesses.filter(b => isDuplicate(business, b, threshold));
}

/**
 * Merge two business records, preferring non-null values
 */
export function mergeBusinessData<T extends BusinessData>(
  primary: T,
  secondary: T
): T {
  return {
    ...primary,
    // Prefer non-empty values from either record
    name: primary.name || primary.businessName || secondary.name || secondary.businessName,
    address: primary.address || secondary.address,
    phone: primary.phone || secondary.phone,
    website: primary.website || secondary.website,
    // Merge other fields as needed
    ...secondary,
    ...primary,
  } as T;
}
