/**
 * Utility functions for seasonal drinks
 * Maps seasonal drinks to their appropriate seasons based on temperature
 */

export type Season = 'summer' | 'fall/spring' | 'winter';

export interface SeasonalDrink {
  name: string;
  season: Season | Season[];
}

// Mapping of seasonal drink names to their seasons
export const SEASONAL_DRINKS: Record<string, Season | Season[]> = {
  'Iced Watermelon Refresher': 'summer',
  'Pumpkin Spice Latte': 'fall/spring',
  'Hot Chocolate Boba': 'winter',
  'Peach Iced Tea': 'fall/spring',
};

/**
 * Determines if a drink should be shown based on the current season
 */
export function shouldShowSeasonalDrink(drinkName: string, currentSeason: Season): boolean {
  const drinkSeason = SEASONAL_DRINKS[drinkName];
  if (!drinkSeason) {
    // Not a seasonal drink, always show
    return true;
  }
  
  if (Array.isArray(drinkSeason)) {
    return drinkSeason.includes(currentSeason);
  }
  
  return drinkSeason === currentSeason;
}

/**
 * Filters an array of menu items to only include seasonal drinks that match the current season
 */
export function filterSeasonalDrinks<T extends { item?: string; name?: string }>(
  items: T[],
  currentSeason: Season
): T[] {
  return items.filter(item => {
    // Try both 'item' and 'name' fields to find the drink name
    const itemName = (item.item || item.name || '').trim();
    // If it's not a seasonal drink, always include it
    if (!itemName || !SEASONAL_DRINKS[itemName]) {
      return true;
    }
    // If it's a seasonal drink, check if it matches the current season
    return shouldShowSeasonalDrink(itemName, currentSeason);
  });
}

