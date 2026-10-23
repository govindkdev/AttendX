/*
=========================================================
ATTENDX - CAMPUS GEOFENCE CALCULATOR (HAVERSINE ALGORITHM)
=========================================================
Calculates precise great-circle distance between student's GPS
coordinates and the campus geofence perimeter boundary.
=========================================================
*/

/**
 * Calculate distance in meters between two lat/lng points using Haversine formula
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's mean radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * Verify if coordinates are within campus geofence
 * @param {number} userLat
 * @param {number} userLon
 * @param {object} campusConfig { latitude, longitude, radius_meters, campus_name }
 */
function verifyGeofence(userLat, userLon, campusConfig) {
  // If coordinates are missing (e.g. user denied or browser simulated fallback), return gracefully
  if (userLat === undefined || userLon === undefined || userLat === null || userLon === null) {
    return {
      withinGeofence: true, // Graceful demo mode fallback
      distanceMeters: 0,
      allowedRadius: campusConfig ? campusConfig.radius_meters : 600,
      campusName: campusConfig ? campusConfig.campus_name : "AttendX Campus",
      isSimulated: true,
      message: "GPS permissions not provided; system permitted in development demo mode."
    };
  }

  const campusLat = campusConfig.latitude || 28.5355;
  const campusLon = campusConfig.longitude || 77.3910;
  const radius = campusConfig.radius_meters || 600;

  const distance = calculateDistanceMeters(Number(userLat), Number(userLon), campusLat, campusLon);
  const distanceFormatted = Math.round(distance);

  const within = distance <= radius;

  return {
    withinGeofence: within,
    distanceMeters: distanceFormatted,
    allowedRadius: radius,
    campusName: campusConfig.campus_name || "AttendX Main Institute of Technology",
    isSimulated: false,
    message: within
      ? `Within permitted campus boundary (${distanceFormatted}m from center, max ${radius}m allowed)`
      : `Outside campus boundary (${distanceFormatted}m from center; maximum allowed is ${radius}m)`
  };
}

module.exports = {
  calculateDistanceMeters,
  verifyGeofence
};
