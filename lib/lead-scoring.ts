/**
 * Lead quality scoring system
 * Calculates a score from 0-105 based on data completeness and quality
 */

export interface LeadData {
  emails?: string[];
  phone?: string;
  website?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  rating?: number;
  reviewCount?: number;
  emailValidationStatus?: string;
}

export interface LeadScore {
  score: number;
  tier: 'gold' | 'silver' | 'bronze';
  breakdown: {
    email: number;
    phone: number;
    website: number;
    socialMedia: number;
    rating: number;
    reviews: number;
  };
}

/**
 * Calculate lead quality score
 */
export function calculateLeadScore(lead: LeadData): LeadScore {
  const breakdown = {
    email: 0,
    phone: 0,
    website: 0,
    socialMedia: 0,
    rating: 0,
    reviews: 0,
  };

  // Email score (50 points max)
  if (lead.emails && lead.emails.length > 0) {
    if (lead.emailValidationStatus === 'valid') {
      breakdown.email = 50; // Verified email
    } else if (lead.emailValidationStatus === 'risky') {
      breakdown.email = 30; // Risky email
    } else if (lead.emailValidationStatus === 'unknown' || !lead.emailValidationStatus) {
      breakdown.email = 20; // Unverified email
    }
    // Invalid emails get 0 points
  }

  // Phone score (20 points)
  if (lead.phone) {
    breakdown.phone = 20;
  }

  // Website score (15 points)
  if (lead.website) {
    breakdown.website = 15;
  }

  // Social media score (10 points max)
  let socialCount = 0;
  if (lead.facebookUrl) socialCount++;
  if (lead.linkedinUrl) socialCount++;
  if (lead.instagramUrl) socialCount++;
  if (lead.twitterUrl) socialCount++;
  
  breakdown.socialMedia = Math.min(socialCount * 3, 10); // 3 points per platform, max 10

  // Rating score (5 points)
  if (lead.rating && lead.rating >= 4.0) {
    breakdown.rating = 5;
  } else if (lead.rating && lead.rating >= 3.0) {
    breakdown.rating = 3;
  }

  // Review count score (5 points)
  if (lead.reviewCount && lead.reviewCount >= 50) {
    breakdown.reviews = 5;
  } else if (lead.reviewCount && lead.reviewCount >= 10) {
    breakdown.reviews = 3;
  } else if (lead.reviewCount && lead.reviewCount >= 1) {
    breakdown.reviews = 1;
  }

  // Calculate total score
  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  // Determine tier
  let tier: 'gold' | 'silver' | 'bronze';
  if (score >= 80) {
    tier = 'gold';
  } else if (score >= 50) {
    tier = 'silver';
  } else {
    tier = 'bronze';
  }

  return {
    score,
    tier,
    breakdown,
  };
}

/**
 * Get tier color for UI display
 */
export function getTierColor(tier: 'gold' | 'silver' | 'bronze'): string {
  switch (tier) {
    case 'gold':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'silver':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'bronze':
      return 'text-orange-600 bg-orange-50 border-orange-200';
  }
}

/**
 * Get tier icon/emoji
 */
export function getTierIcon(tier: 'gold' | 'silver' | 'bronze'): string {
  switch (tier) {
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'bronze':
      return '🥉';
  }
}

/**
 * Get score description
 */
export function getScoreDescription(score: number): string {
  if (score >= 90) return 'Excellent - High quality lead with verified contact info';
  if (score >= 80) return 'Very Good - Complete contact information';
  if (score >= 70) return 'Good - Most contact information available';
  if (score >= 50) return 'Fair - Basic contact information';
  if (score >= 30) return 'Limited - Incomplete contact information';
  return 'Poor - Very limited contact information';
}
