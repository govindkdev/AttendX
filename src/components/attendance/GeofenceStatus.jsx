/*
=========================================================
ATTENDX - CAMPUS GEOFENCE RADAR & STATUS
=========================================================
Provides real-time location verification, perimeter radius
distance calculations, and a demo toggle to test both
within-boundary and out-of-boundary scenarios.
=========================================================
*/

import React, { useState, useEffect } from "react";
import { userService } from "../../services/userService";
import { attendanceService } from "../../services/attendanceService";

export default function GeofenceStatus({ onGeofenceChange }) {
  const [geofence, setGeofence] = useState(userService.getCampusGeofence());
  const [userLocation, setUserLocation] = useState({
    lat: 28.5358,
    lng: 77.3913,
    distance: 42,
    isInside: true,
    gpsLoading: false,
    gpsError: ""
  });

  const fetchRealGPS = () => {
    setUserLocation((prev) => ({ ...prev, gpsLoading: true, gpsError: "" }));
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const dist = attendanceService.calculateDistanceMeters(lat, lng, geofence.latitude, geofence.longitude);
          setUserLocation({
            lat,
            lng,
            distance: dist,
            isInside: dist <= geofence.radiusMeters,
            gpsLoading: false,
            gpsError: ""
          });
        },
        (err) => {
          setUserLocation((prev) => ({
            ...prev,
            gpsLoading: false,
            gpsError: `Location access denied (${err.message}). Defaulting to simulated coordinates.`
          }));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLocation((prev) => ({
        ...prev,
        gpsLoading: false,
        gpsError: "Geolocation API not supported by browser."
      }));
    }
  };

  const updateCoordinatesForMode = (mode) => {
    if (mode === "inside") {
      // 42 meters from center
      const lat = geofence.latitude + 0.0003;
      const lng = geofence.longitude + 0.0002;
      const dist = attendanceService.calculateDistanceMeters(lat, lng, geofence.latitude, geofence.longitude);
      setUserLocation({
        lat,
        lng,
        distance: dist,
        isInside: dist <= geofence.radiusMeters,
        gpsLoading: false,
        gpsError: ""
      });
    } else if (mode === "outside") {
      // 2,350 meters from center
      const lat = geofence.latitude + 0.021;
      const lng = geofence.longitude + 0.018;
      const dist = attendanceService.calculateDistanceMeters(lat, lng, geofence.latitude, geofence.longitude);
      setUserLocation({
        lat,
        lng,
        distance: dist,
        isInside: false,
        gpsLoading: false,
        gpsError: ""
      });
    } else if (mode === "gps") {
      fetchRealGPS();
    }
  };

  useEffect(() => {
    updateCoordinatesForMode(geofence.simulationMode);
  }, [geofence.simulationMode]);

  const handleModeChange = (mode) => {
    const updated = userService.updateCampusGeofence({ simulationMode: mode });
    setGeofence(updated.campusGeofence);
    if (onGeofenceChange) onGeofenceChange(mode !== "outside");
  };

  return (
    <div className="dashboard-card" style={{ padding: 20 }}>
      <div className="card-header-flex">
        <div>
          <h3 style={{ fontSize: 16 }}>Campus Geo-Fencing Radar</h3>
          <p>{geofence.campusName} (Radius: {geofence.radiusMeters}m)</p>
        </div>
        <span className={`status-pill ${userLocation.isInside ? "present" : "absent"}`}>
          <span className="status-dot" />
          {userLocation.isInside ? "Inside Permitted Perimeter" : "Outside Authorized Area"}
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
        marginBottom: 16,
        background: "var(--attendx-surface-subtle)",
        padding: 14,
        borderRadius: "var(--radius-md)"
      }}>
        <div>
          <small style={{ color: "var(--attendx-text-muted)", display: "block" }}>Campus Center</small>
          <strong style={{ fontSize: 13 }}>{geofence.latitude.toFixed(4)}° N, {geofence.longitude.toFixed(4)}° E</strong>
        </div>
        <div>
          <small style={{ color: "var(--attendx-text-muted)", display: "block" }}>Current Distance</small>
          <strong style={{ fontSize: 13, color: userLocation.isInside ? "var(--attendx-success)" : "var(--attendx-error)" }}>
            {userLocation.distance} meters {userLocation.isInside ? "(Within limits)" : "(Boundary exceeded)"}
          </strong>
        </div>
        <div>
          <small style={{ color: "var(--attendx-text-muted)", display: "block" }}>Security Policy</small>
          <strong style={{ fontSize: 13 }}>{geofence.strictMode ? "Strict Campus Lock (Active)" : "Advisory"}</strong>
        </div>
      </div>

      {userLocation.gpsError && (
        <div style={{
          background: "var(--attendx-warning-bg)",
          color: "var(--attendx-warning)",
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          fontSize: 12,
          marginBottom: 12
        }}>
          ⚠️ {userLocation.gpsError}
        </div>
      )}

      {/* Interactive Mode Selector for Demo Evaluators */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--attendx-text-muted)", display: "block", marginBottom: 8 }}>
          Evaluation Mode (Test geofence enforcement):
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={geofence.simulationMode === "inside" ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: 12, padding: "6px 12px", color: geofence.simulationMode === "inside" ? "#fff" : "var(--attendx-text-primary)" }}
            onClick={() => handleModeChange("inside")}
          >
            ✓ Simulate Inside Campus (42m)
          </button>
          <button
            type="button"
            className={geofence.simulationMode === "outside" ? "btn-primary" : "btn-secondary"}
            style={{
              fontSize: 12,
              padding: "6px 12px",
              background: geofence.simulationMode === "outside" ? "var(--attendx-error)" : undefined,
              color: geofence.simulationMode === "outside" ? "#fff" : "var(--attendx-text-primary)"
            }}
            onClick={() => handleModeChange("outside")}
          >
            ✗ Simulate Outside Campus (2.4 km)
          </button>
          <button
            type="button"
            className={geofence.simulationMode === "gps" ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: 12, padding: "6px 12px", color: geofence.simulationMode === "gps" ? "#fff" : "var(--attendx-text-primary)" }}
            onClick={() => handleModeChange("gps")}
          >
            🛰️ Query Real Device GPS
          </button>
        </div>
      </div>
    </div>
  );
}
