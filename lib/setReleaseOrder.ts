/**
 * Set release order for One Piece Card Game sets.
 * Sets are ordered chronologically by their actual release dates.
 * This ensures proper sorting when filtering by set, rather than alphabetical sorting
 * which would incorrectly order EB/PRB sets.
 */

export const SET_RELEASE_ORDER: Record<string, number> = {
  // Initial launch - July 2022
  ST01: 1,
  ST02: 2,
  ST03: 3,
  ST04: 4,
  ST05: 5,
  OP01: 6,
  
  // September 2022
  ST06: 7,
  OP02: 8,
  
  // November 2022
  EB01: 9,
  
  // December 2022
  ST07: 10,
  ST08: 11,
  OP03: 12,
  
  // February 2023
  ST09: 13,
  OP04: 14,
  
  // May 2023
  ST10: 15,
  OP05: 16,
  
  // August 2023
  ST11: 17,
  OP06: 18,
  PRB01: 19,
  
  // September 2023
  ST12: 20,
  
  // October 2023
  OP07: 21,
  
  // November 2023
  ST13: 22,
  
  // December 2023
  OP08: 23,
  
  // February 2024
  ST14: 24,
  OP09: 25,
  EB02: 26,
  
  // March 2024
  ST15: 27,
  ST16: 28,
  ST17: 29,
  ST18: 30,
  ST19: 31,
  ST20: 32,
  
  // May 2024
  OP10: 33,
  
  // June 2024
  ST21: 34,
  
  // August 2024
  OP11: 35,
  ST22: 36,
  
  // September 2024
  PRB02: 37,
  
  // October 2024
  OP12: 38,
  
  // November 2024
  ST23: 39,
  ST24: 40,
  ST25: 41,
  ST26: 42,
  ST27: 43,
  ST28: 44,
  EB03: 45,
  
  // January 2025
  OP13: 46,
  
  // February 2025
  ST29: 47,
  
  // March 2025
  "OP14EB04": 48,
  OP14: 48, // Alias for compatibility
  
  // April 2025
  ST30: 49,
  
  // May 2025
  "OP15EB04": 50,
  OP15: 50, // Alias for compatibility
  
  // June 2025
  ST31: 51,
  ST32: 52,
  ST33: 53,
  ST34: 54,
  ST35: 55,
  ST36: 56,
  
  // August 2025
  OP16: 57,
  
  // November 2025
  OP17: 58,
  
  // Promotional cards - sorted last
  P: 999,
};

/**
 * Compare two set codes by their release order.
 * Falls back to alphabetical comparison for unknown sets.
 */
export function compareSetsByReleaseOrder(a: string, b: string): number {
  const orderA = SET_RELEASE_ORDER[a];
  const orderB = SET_RELEASE_ORDER[b];
  
  // Both sets have known release orders
  if (orderA !== undefined && orderB !== undefined) {
    return orderA - orderB;
  }
  
  // One or both sets are unknown - fall back to alphabetical
  if (orderA === undefined && orderB === undefined) {
    return a.localeCompare(b);
  }
  
  // Known sets come before unknown sets
  if (orderA !== undefined) return -1;
  return 1;
}
