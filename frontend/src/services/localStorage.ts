/**
 * Local Storage Service
 * Manages favorites and recent searches
 */

import { availableCarparkResponse } from "@/types/types";

const FAVORITES_KEY = 'carpark_favorites';
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

export interface FavoriteCarpark {
  carpark_num: string;
  development: string;
  area: string;
  latitude: number;
  longitude: number;
  addedAt: number;
}

export interface RecentSearch {
  term: string;
  timestamp: number;
}

// Favorites Management
export const getFavorites = (): FavoriteCarpark[] => {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

export const addFavorite = (carpark: availableCarparkResponse): void => {
  try {
    const favorites = getFavorites();
    
    // Check if already exists
    if (favorites.some(f => f.carpark_num === carpark.carpark_num)) {
      return;
    }
    
    const favorite: FavoriteCarpark = {
      carpark_num: carpark.carpark_num,
      development: carpark.development,
      area: carpark.area,
      latitude: carpark.latitude,
      longitude: carpark.longitude,
      addedAt: Date.now()
    };
    
    favorites.unshift(favorite); // Add to beginning
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
};

export const removeFavorite = (carpark_num: string): void => {
  try {
    const favorites = getFavorites();
    const updated = favorites.filter(f => f.carpark_num !== carpark_num);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

export const isFavorite = (carpark_num: string): boolean => {
  const favorites = getFavorites();
  return favorites.some(f => f.carpark_num === carpark_num);
};

// Recent Searches Management
export const getRecentSearches = (): RecentSearch[] => {
  try {
    const data = localStorage.getItem(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
};

export const addRecentSearch = (term: string): void => {
  try {
    if (!term || term.trim() === '' || term.toLowerCase() === 'near me') {
      return; // Don't save empty or "near me"
    }
    
    let recent = getRecentSearches();
    
    // Remove if already exists
    recent = recent.filter(r => r.term.toLowerCase() !== term.toLowerCase());
    
    // Add to beginning
    recent.unshift({
      term: term.trim(),
      timestamp: Date.now()
    });
    
    // Keep only last N searches
    recent = recent.slice(0, MAX_RECENT_SEARCHES);
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error('Error adding recent search:', error);
  }
};

export const clearRecentSearches = (): void => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
};
