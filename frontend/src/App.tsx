import { DurationSelector } from "@/components/DurationSelector";
import SearchBar from "@/components/SearchBar";
import { availableCarparkResponse } from "@/types/types";
import { logger } from "@/utils/logger";
import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from 'virtual:pwa-register/react';
import CarparkMap, { CarparkMapRef } from "./components/CarparkMap";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { FavoriteCarpark } from "./services/localStorage";


function App() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // PWA update prompt
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    availableCarparkResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(true);
  const [duration, setDuration] = useState<number>(2); // Default 2 hours
  const [dayType, setDayType] = useState<"weekday" | "saturday" | "sunday">(
    "weekday",
  );
  const [radius, setRadius] = useState<number>(2000); // metres
  const [searchCentre, setSearchCentre] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null); // Location to use for current search
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shouldSearchAfterLocation, setShouldSearchAfterLocation] =
    useState(false);
  const [useGPSLocation, setUseGPSLocation] = useState(true); // Toggle to disable GPS
  const mapRef = useRef<CarparkMapRef>(null);
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false);
  const [selectedCarpark, setSelectedCarpark] = useState<availableCarparkResponse | null>(null);
  const [pendingSelectCarpark, setPendingSelectCarpark] = useState<string | null>(null);
  // Reusable function to request user location
  const requestUserLocation = (autoSearch = false) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    if (autoSearch) {
      setShouldSearchAfterLocation(true);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setIsGettingLocation(false);
        setLocationError(null);
        logger.debug("📍 Location acquired:", location);
        logger.debug("📍 Full position object:", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toLocaleString(),
        });
        logger.debug("📍 Accuracy:", position.coords.accuracy, "meters");

        // Pan map to user location immediately
        setTimeout(() => {
          mapRef.current?.panToCarpark(location.lat, location.lng);
          logger.debug("📍 Map panned to user location");
        }, 500); // Small delay to ensure map is ready
      },
      (error) => {
        console.warn("Location access error:", error);
        setIsGettingLocation(false);

        // Provide user-friendly error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location access denied. Please enable location permissions.",
            );
            setUseGPSLocation(false);
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("Unable to get your location.");
        }
      },
    );
  };

  // Get user's location on mount and auto-search nearby carparks
  useEffect(() => {
    requestUserLocation(true);
  }, []);

  // Auto-trigger "near me" search after location is obtained (if requested)
  useEffect(() => {
    if (userLocation && shouldSearchAfterLocation) {
      setSearchLocation(userLocation); // Freeze location for this search
      setSearchTerm("near me");
      setIsDropdownVisible(true);
      setShouldSearchAfterLocation(false);
    }
  }, [userLocation, shouldSearchAfterLocation]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setSearchCentre(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Create AbortController to cancel previous requests
    const abortController = new AbortController();

    const timeoutId = setTimeout(async () => {
      // Try geocoding if search looks like address/postal code and returns no results
      let geocodedLocation: { lat: number; lng: number } | null = null;

      // Determine location to use for distance calculation
      const locationToUse =
        searchLocation ||
        (useGPSLocation ? userLocation : null);

      const url = new URL(`${API_URL}/carparks`);
      url.searchParams.append("search", searchTerm);
      url.searchParams.append("duration", duration.toString());
      url.searchParams.append("day_type", dayType);
      url.searchParams.append("radius", radius.toString());

      // Send user location to backend for server-side sorting
      if (locationToUse) {
        url.searchParams.append("lat", locationToUse.lat.toString());
        url.searchParams.append("lng", locationToUse.lng.toString());
      }

      try {
        const response = await fetch(url, { signal: abortController.signal });
        const json = await response.json();
        let data: availableCarparkResponse[] = json.carparks || [];
        const respSearchCentre: { lat: number; lng: number } | null =
          json.search_centre || null;

        const isNearMeSearch = searchTerm.toLowerCase().trim() === "near me";
        setSearchCentre(respSearchCentre);

        if (locationToUse) {
          logger.debug(
            "✅ Backend sorted results by distance from:",
            locationToUse,
          );
        } else {
          logger.debug("No location available - distances not calculated");
        }

        setSearchResults(data);
        setIsLoading(false);
        logger.debug(
          `✅ Found ${data.length} carparks (${duration}hrs, ${dayType})`,
          locationToUse
            ? `| Nearest: ${data[0]?.distance?.toFixed(2)}km (${data[0]?.development})`
            : "| No GPS",
        );

        // For "near me" or address searches, pan to the location
        const panTarget =
          respSearchCentre ||
          (isNearMeSearch ? locationToUse : null) ||
          (geocodedLocation ? geocodedLocation : null);
        if (panTarget && data.length > 0) {
          setTimeout(() => {
            mapRef.current?.panToCarpark(panTarget.lat, panTarget.lng);
          }, 200);
        }
      } catch (error) {
        // Ignore abort errors (they're expected when cancelling requests)
        if (error instanceof Error && error.name === "AbortError") {
          logger.debug("⏹️ Request cancelled");
          return;
        }
        console.error("Error fetching carparks:", error);
        setSearchResults([]);
        setSearchCentre(null);
        setIsLoading(false);
      }
    }, 100); // Reduced from 150ms to 100ms for faster response

    return () => {
      clearTimeout(timeoutId);
      abortController.abort(); // Cancel ongoing request when effect re-runs
    };
  }, [searchTerm, duration, dayType, radius, searchLocation, useGPSLocation]);

  const handleCarparkSelect = (carpark: availableCarparkResponse) => {
    mapRef.current?.panToAndSelectCarpark(carpark);
    setShowFavoritesPanel(false);
  };
  const toggleFavorites = () => {
    const opening = !showFavoritesPanel;
    setShowFavoritesPanel(opening);
    if (opening && selectedCarpark) setSelectedCarpark(null);                                                                                           
  };  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownVisible(true); // Show dropdown when typing

    // Close any open InfoWindow when user starts typing
    // This prevents focus issues where InfoWindow steals focus from input
    mapRef.current?.closeInfoWindow();
  };
  const handleFavoriteClick = (fav: FavoriteCarpark) => {
    setShowFavoritesPanel(false);
    setSearchResults([]);
    setIsDropdownVisible(false); // Don't show dropdown — go straight to carpark
    setPendingSelectCarpark(fav.carpark_num);
    setSearchTerm(fav.development);
  }

  const handleDismissDropdown = () => {
    setIsDropdownVisible(false);
    setShowFavoritesPanel(false);
  };

  const handleNearMeClick = () => {
    if (!useGPSLocation) {
      alert(
        'GPS is disabled. Please enable GPS in the top-left corner, or search by area name instead (e.g., "punggol", "tampines")',
      );
      return;
    }

    if (userLocation) {
      // Already have location - capture it and trigger search
      setSearchLocation(userLocation); // Freeze location for this search
      setSearchTerm("near me");
      setIsDropdownVisible(true);
    } else if (isGettingLocation) {
      // Already getting location - just wait
      setShouldSearchAfterLocation(true);
    } else {
      // Don't have location - try to get it again and auto-search after
      requestUserLocation(true);
    }
  };

  return (
    <>
      <div className="relative h-screen w-full">
        {/* Favourite loading indicator */}
        {pendingSelectCarpark && isLoading && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-pulse">
            Loading carpark...
          </div>
        )}

        {/* Location loading indicator */}
        {isGettingLocation && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-pulse">
            📍 Getting your location...
          </div>
        )}

        {/* User location status indicator - always show when no search active */}
        {!isGettingLocation && !locationError && searchTerm === "" && (
          <div
            className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm ${
              userLocation
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-white"
            }`}
          >
            {userLocation
              ? "✓ Location ready! Click 📍 to search nearby"
              : "⚠️ Location not available - Click 📍 to retry"}
          </div>
        )}

        {/* Location error message */}
        {locationError && !isGettingLocation && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-md">
            <div className="flex items-center justify-between gap-3">
              <span>⚠️ {locationError}</span>
              <button
                onClick={() => setLocationError(null)}
                className="text-white hover:text-gray-200 font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <CarparkMap
          ref={mapRef}
          carparks={searchResults || []}
          selectedCarpark={selectedCarpark}
          setSelectedCarpark={setSelectedCarpark}
          onMapClick={handleDismissDropdown}
          userLocation={userLocation}
          duration={duration}
          dayType={dayType}
        />
        <SearchBar
          value={searchTerm}
          searchResults={searchResults}
          isLoading={isLoading}
          searchCentre={searchCentre}
          searchTerm={searchTerm}
          radius={radius}
          setRadius={setRadius}
          onChange={handleSearchChange}
          onFocus={() => setIsDropdownVisible(true)}
          onCarparkSelect={handleCarparkSelect}
          onFavoritesClick={toggleFavorites}
          pendingSelectCarpark={pendingSelectCarpark}
          onPendingSelectHandled={() => setPendingSelectCarpark(null)}
          isDropdownVisible={isDropdownVisible}
          onDismissDropdown={handleDismissDropdown}
          onNearMeClick={handleNearMeClick}
          hasUserLocation={!!userLocation && useGPSLocation}
          userLocation={useGPSLocation ? userLocation : null}
          duration={duration}
          dayType={dayType}
        />
        { showFavoritesPanel && (
          <FavoritesPanel
            onFavoriteClick={handleFavoriteClick}
            show={showFavoritesPanel}
            onClose={() => setShowFavoritesPanel(false)}
          />
        )

        }
        { !showFavoritesPanel &&
          (<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-20">
            <DurationSelector
              duration={duration}
              onChange={setDuration}
              dayType={dayType}
              onDayTypeChange={setDayType}
            />
          </div>)
        }

        {/* PWA update toast */}
        {needRefresh && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl text-sm">
            <span>New version available</span>
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold transition-colors"
            >
              Update
            </button>
          </div>
        )}
        
      </div>
    </>
  );
}

export default App;
