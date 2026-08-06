/**
 * Utility for fetching real-time ambient temperature
 * and dynamically adjusting food expiry dates based on ambient heat.
 */

// Baseline reference temperature: 25°C
export const BASE_ROOM_TEMP = 25;

/**
 * Calculates a dynamic hours multiplier based on ambient temperature (Celsius).
 * High ambient heat speeds up bacterial spoilage in room-temp food.
 */
export function getTemperatureMultiplier(tempCelsius, storageRequirement = "ROOM_TEMPERATURE") {
  if (storageRequirement === "REFRIGERATED" || storageRequirement === "FROZEN") {
    return 1.0; // Refrigerated food is climate-controlled
  }

  const temp = Number(tempCelsius);
  if (isNaN(temp)) return 1.0;

  if (temp >= 40) return 0.60; // Severe heat (>40°C): 40% reduction (4h -> 2.4h)
  if (temp >= 35) return 0.70; // High heat (35°C-40°C): 30% reduction (4h -> 2.8h)
  if (temp >= 30) return 0.82; // Warm day (30°C-35°C): 18% reduction (4h -> 3.3h)
  if (temp >= 24) return 1.00; // Standard room temp (24°C-29°C): Baseline 100%
  if (temp >= 18) return 1.20; // Cool day (18°C-23°C): 20% extension (4h -> 4.8h)
  return 1.40; // Cold day (<18°C): 40% extension (4h -> 5.6h)
}

/**
 * Computes adjusted shelf-life hours after applying ambient temperature factor.
 */
export function calculateAdjustedHours(baseHours, tempCelsius, storageRequirement = "ROOM_TEMPERATURE") {
  const mult = getTemperatureMultiplier(tempCelsius, storageRequirement);
  const adjusted = baseHours * mult;
  return Math.round(adjusted * 10) / 10; // Round to 1 decimal place
}

/**
 * Format datetime-local string YYYY-MM-DDTHH:mm
 */
export function formatDateTimeLocal(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Calculates new expiry datetime local string given prep time, base hours, and temperature.
 */
export function calculateTempAdjustedExpiry(prepDateStr, baseHours, tempCelsius, storageRequirement = "ROOM_TEMPERATURE") {
  const prepDate = prepDateStr ? new Date(prepDateStr) : new Date();
  if (isNaN(prepDate.getTime())) return "";

  const finalHours = calculateAdjustedHours(baseHours, tempCelsius, storageRequirement);
  const expObj = new Date(prepDate.getTime() + finalHours * 60 * 60 * 1000);
  return formatDateTimeLocal(expObj);
}

/**
 * Fetches real-time ambient temperature using Geolocation + Open-Meteo free API.
 * Falls back to 28°C if unavailable.
 */
export async function fetchCurrentTemperature() {
  return new Promise((resolve) => {
    const fallbackTemp = 28; // Default warm room temp

    if (!navigator.geolocation) {
      resolve({ temp: fallbackTemp, locationName: "Estimated Ambient", source: "default" });
      return;
    }

    const timeoutId = setTimeout(() => {
      resolve({ temp: fallbackTemp, locationName: "Estimated Ambient", source: "timeout" });
    }, 4000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timeoutId);
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current_weather=true`
          );
          if (res.ok) {
            const data = await res.json();
            const currentTemp = data.current_weather?.temperature;
            if (typeof currentTemp === "number") {
              resolve({
                temp: Math.round(currentTemp),
                locationName: `GPS Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
                source: "live_api"
              });
              return;
            }
          }
          resolve({ temp: fallbackTemp, locationName: "Local Ambient", source: "api_fallback" });
        } catch (err) {
          console.warn("Weather API fetch error:", err);
          resolve({ temp: fallbackTemp, locationName: "Local Ambient", source: "error_fallback" });
        }
      },
      (geoErr) => {
        clearTimeout(timeoutId);
        console.warn("Geolocation warning:", geoErr);
        resolve({ temp: fallbackTemp, locationName: "Estimated Ambient", source: "geo_denied" });
      },
      { timeout: 3500 }
    );
  });
}
