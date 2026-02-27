// Normalization constants — shared between API and CLI scripts

export const TARGET_AVG = 5.4; // Target average rating to normalize towards
export const MIN_REVIEWS_THRESHOLD = 3; // Minimum reviews needed for reviewer stats
export const MIN_REVIEW_VALUE_THRESHOLD = 4.0; // Minimum average review value to be considered for acceptance
export const ZSCORE_THRESHOLD = 2.0; // Z-score threshold for detecting outliers

// Confidence score weights
export const CONFIDENCE_WEIGHTS = {
  reviewCount: 0.4, // 40% weight for review count factor
  agreement: 0.4, // 40% weight for reviewer agreement factor
  reliability: 0.2, // 20% weight for reviewer reliability factor
} as const;

export const MAX_REVIEWS_FOR_CONFIDENCE = 5; // Cap for review count weight calculation
