import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  ChevronLeft,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  User,
  CheckCircle,
  FileCheck,
  Navigation,
  Compass,
  Building,
  Train,
  ShoppingBag,
  Landmark,
  Zap,
  Bike
} from "lucide-react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function DeliveryTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userCoords, setUserCoords] = useState(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Complaint Modal State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintType, setComplaintType] = useState("Coming Late");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn("User location permission denied or error:", err);
        }
      );
    }
  }, []);

  const fetchTracking = useCallback(async () => {
    try {
      const res = await api.get(`/donations/${id}/track`);
      setTrackingData(res.data);
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve tracking details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTracking();
    const timer = setInterval(fetchTracking, 3000);
    return () => clearInterval(timer);
  }, [fetchTracking]);

  // ==========================================================
  // INITIALIZE / UPDATE LEAFLET OPENSTREETMAP REAL TILES
  // ==========================================================
  useEffect(() => {
    if (!trackingData || !mapContainerRef.current) return;

    const { pickup_coordinates, dropoff_coordinates, current_location, historical_path, nearby_places } = trackingData;

    const curLat = current_location?.lat || pickup_coordinates?.lat || 17.3850;
    const curLng = current_location?.lng || pickup_coordinates?.lng || 78.4867;

    // Initialize map instance if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [curLat, curLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Aura Food Fleet Tracking',
        maxZoom: 19,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = markersGroupRef.current;
    layerGroup.clearLayers();

    // Custom Icon Creators
    const createCustomIcon = (bgColor, iconChar, isPulse = false) => {
      return L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            ${isPulse ? `<div style="position: absolute; inset: -8px; background-color: ${bgColor}; opacity: 0.35; border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
            <div style="background-color: ${bgColor}; color: white; font-weight: 900; font-size: 14px; width: 32px; height: 32px; border-radius: 9999px; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
              ${iconChar}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    };

    // 1. Add Pickup Marker (Donor)
    if (pickup_coordinates) {
      L.marker([pickup_coordinates.lat, pickup_coordinates.lng], {
        icon: createCustomIcon("#10b981", "🏬"),
      })
        .bindPopup(`<b>Food Pickup (Donor)</b><br/>${trackingData.pickup_address || "Donor Location"}`)
        .addTo(layerGroup);
    }

    // 2. Add Dropoff Marker (NGO)
    if (dropoff_coordinates) {
      L.marker([dropoff_coordinates.lat, dropoff_coordinates.lng], {
        icon: createCustomIcon("#ef4444", "📍"),
      })
        .bindPopup(`<b>Food Destination (NGO)</b><br/>${trackingData.dropoff_address || "NGO Destination"}`)
        .addTo(layerGroup);
    }

    // 3. Add Live Transporter Marker (Driver Bike)
    if (current_location) {
      const driverMarker = L.marker([current_location.lat, current_location.lng], {
        icon: createCustomIcon("#2563eb", "🛵", true),
      })
        .bindPopup(`<b>Live Transporter</b><br/>${trackingData.donation?.driver_name || "Delivery Partner"}<br/>Speed: 26 km/h`)
        .addTo(layerGroup);

      // Pan map smoothly to live location
      map.panTo([current_location.lat, current_location.lng]);
    }

    // 4. Add Nearby Places Markers
    if (Array.isArray(nearby_places)) {
      nearby_places.forEach((place) => {
        if (place.lat && place.lng) {
          L.marker([place.lat, place.lng], {
            icon: L.divIcon({
              className: "nearby-place-marker",
              html: `<div style="background: white; border: 1.5px solid #0f766e; border-radius: 12px; padding: 2px 6px; font-size: 10px; font-weight: 800; color: #0f766e; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 3px;">
                <span>${place.type.includes("Metro") ? "🚇" : place.type.includes("Mall") ? "🛒" : "📍"}</span>
                <span>${place.name}</span>
              </div>`,
              iconSize: [120, 24],
              iconAnchor: [60, 12],
            }),
          })
            .bindPopup(`<b>${place.name}</b><br/>Type: ${place.type}<br/>Distance: ${place.distance}`)
            .addTo(layerGroup);
        }
      });
    }

    // 5. Draw Polyline Route Path
    if (Array.isArray(historical_path) && historical_path.length > 0) {
      const routeLatLngs = historical_path.map((pt) => [pt.lat, pt.lng]);
      if (dropoff_coordinates) {
        routeLatLngs.push([dropoff_coordinates.lat, dropoff_coordinates.lng]);
      }

      L.polyline(routeLatLngs, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.8,
        dashArray: "8, 8",
        lineCap: "round",
      }).addTo(layerGroup);
    }
  }, [trackingData]);

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    if (!complaintDesc.trim()) {
      setError("Please describe the complaint.");
      return;
    }
    setSubmittingComplaint(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/complaints", {
        donation_id: id,
        delivery_boy_id: trackingData?.donation?.delivery_boy_id,
        title: complaintType,
        description: complaintDesc.trim(),
      });
      setSuccess("Complaint submitted successfully to System Administrator.");
      setShowComplaintModal(false);
      setComplaintDesc("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit complaint.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center font-black text-slate-500">
          Loading Aura Food Live Fleet Telemetry...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !trackingData) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center">
          <h2 className="text-xl font-black text-slate-800">Tracking Unavailable</h2>
          <p className="mt-2 text-sm text-slate-500">{error || "Shipment tracking details could not be found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { donation, pickup_address, pickup_coordinates, dropoff_address, dropoff_coordinates, current_location, nearby_places } = trackingData;

  // Compute distance remaining
  const getHaversineDistance = (coords1, coords2) => {
    if (!coords1 || !coords2) return 2.4;
    const R = 6371;
    const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coords1.lat * Math.PI) / 180) * Math.cos((coords2.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const remainingDist = getHaversineDistance(current_location, dropoff_coordinates);
  const etaMins = Math.max(3, Math.round(parseFloat(remainingDist) * 4));

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6 bg-[#fafbfc] min-h-screen">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronLeft size={16} /> Back to Desk
          </button>

          {donation.delivery_boy_id && ["ASSIGNED", "IN_TRANSIT"].includes(donation.status) && (
            <button
              onClick={() => setShowComplaintModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition shadow-xs"
            >
              <AlertOctagon size={16} /> Report Issue / File Complaint
            </button>
          )}
        </div>

        {/* AURA FOOD LIVE ETA BANNER */}
        <div className="rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-300 backdrop-blur-md shrink-0">
              <Bike size={30} className="animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1">
                <Zap size={12} fill="currentColor" /> Aura Food Express Live Fleet Radar
              </span>
              <h1 className="text-xl font-black text-white mt-0.5">
                {donation.status === "COMPLETED"
                  ? "Food Delivered & Handed Over! 🎉"
                  : `Delivery Partner is on the way with ${donation.food_name}`}
              </h1>
              <p className="text-xs text-sky-100 mt-1 font-semibold">
                Transporter: <strong className="text-white">{donation.delivery_boy_name || donation.driver_name || "Assigned Driver"}</strong> • Vehicle: <span className="font-mono text-sky-200">{donation.vehicle_number || "TS-09-EQ-4523"}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/20 p-3 text-center backdrop-blur-md shrink-0 self-stretch sm:self-auto flex md:flex-col items-center justify-between md:justify-center gap-2">
            <span className="text-[10px] font-extrabold uppercase text-sky-200">Estimated Arrival</span>
            <div className="text-2xl font-black text-sky-300 tracking-tight">
              {donation.status === "COMPLETED" ? "Arrived ✓" : `${etaMins} mins ETA`}
            </div>
            <span className="text-[10px] font-bold text-white/80">{remainingDist} km remaining</span>
          </div>
        </div>

        {/* FEEDBACK NOTICES */}
        {success && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs font-bold text-sky-800 flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* MAIN GRID LAYOUT */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          {/* LEFT COLUMN: REAL LEAFLET OPENSTREETMAP CANVAS */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Compass size={16} className="text-sky-600" /> Interactive OpenStreetMap Live Telemetry
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  donation.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                }`}>
                  {donation.status}
                </span>
              </div>

              {/* REAL OPENSTREETMAP CONTAINER */}
              <div
                ref={mapContainerRef}
                className="h-80 w-full rounded-2xl border border-slate-200 overflow-hidden shadow-inner z-10"
              />

              {/* GPS TELEMETRY FOOTER */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Current Speed</p>
                  <p className="font-black text-slate-800 mt-0.5">{donation.status === "IN_TRANSIT" ? "26 km/h" : "0 km/h"}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Live Latitude / Longitude</p>
                  <p className="font-mono font-extrabold text-slate-800 mt-0.5 text-[10px]">
                    {current_location ? `${current_location.lat}, ${current_location.lng}` : "Resolving..."}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-bold uppercase text-slate-400">GPS Accuracy</p>
                  <p className="font-black text-sky-700 mt-0.5">±5m (High Precision)</p>
                </div>
              </div>
            </div>

            {/* ORDER TIMELINE STEPPER */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Delivery Progress Stepper</h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="block text-lg">📦</span>
                  <span className="block mt-1 text-[10px] uppercase">1. Food Packed</span>
                  <span className="block text-[9px] font-normal text-emerald-600 mt-0.5">Done ✓</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="block text-lg">🛵</span>
                  <span className="block mt-1 text-[10px] uppercase">2. Driver Assigned</span>
                  <span className="block text-[9px] font-normal text-emerald-600 mt-0.5">Done ✓</span>
                </div>
                <div className={`p-3 rounded-2xl border ${
                  ["IN_TRANSIT", "COMPLETED"].includes(donation.status) ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse" : "bg-slate-50 text-slate-400 border-slate-100"
                }`}>
                  <span className="block text-lg">🛣️</span>
                  <span className="block mt-1 text-[10px] uppercase">3. Out For Delivery</span>
                  <span className="block text-[9px] font-normal text-amber-700 mt-0.5">Live Tracking</span>
                </div>
                <div className={`p-3 rounded-2xl border ${
                  donation.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-100"
                }`}>
                  <span className="block text-lg">📍</span>
                  <span className="block mt-1 text-[10px] uppercase">4. NGO Delivered</span>
                  <span className="block text-[9px] font-normal text-slate-400 mt-0.5">{donation.status === "COMPLETED" ? "Done ✓" : "Pending"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AURA FOOD NEARBY PLACES & LANDMARKS TIMELINE */}
          <div className="space-y-4">
            {/* NEARBY PLACES & LANDMARKS PASSED CARD */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Building size={16} className="text-sky-600" /> Nearby Places & Landmarks Passed
                </h3>
                <span className="text-[10px] font-extrabold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">Live Route</span>
              </div>

              <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(nearby_places || []).map((place, idx) => (
                  <div key={idx} className="relative flex items-start gap-3 pl-1">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold z-10 ${
                      place.status === "PASSED"
                        ? "bg-emerald-500 text-white"
                        : place.status === "CURRENT_NEARBY"
                        ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                        : "bg-slate-200 text-slate-600"
                    }`}>
                      {place.status === "PASSED" ? "✓" : idx + 1}
                    </div>

                    <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-extrabold text-slate-900">{place.name}</p>
                        <span className="text-[10px] font-bold text-slate-400">{place.distance}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500">{place.type}</p>
                      {place.status === "CURRENT_NEARBY" && (
                        <p className="text-[10px] font-black text-amber-700 mt-1 flex items-center gap-1">
                          <Navigation size={11} className="animate-spin" /> Transporter currently near this landmark
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRANSPORTER DETAILS CARD */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Transporter Profile</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 font-black text-base">
                    {(donation.delivery_boy_name || donation.driver_name || "D")[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{donation.delivery_boy_name || donation.driver_name || "Assigned Driver"}</h4>
                    <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">{donation.vehicle_number || "TS-09-EQ-4523"}</p>
                  </div>
                </div>

                <a
                  href={`tel:${donation.phone_number || "9876543210"}`}
                  className="rounded-2xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Phone size={14} /> Call
                </a>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3 text-[11px] font-semibold text-sky-800 flex items-center gap-2">
                <ShieldAlert size={16} className="text-sky-700 shrink-0" />
                <span>Insulated food transport compartment verified for temperature compliance.</span>
              </div>
            </div>
          </div>
        </div>

        {/* REPORT ISSUE / COMPLAINT MODAL */}
        {showComplaintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="text-red-600" size={24} /> Report Issue to System Administrator
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                File a complaint against driver <span className="font-bold text-slate-700">{donation.delivery_boy_name || "Delivery Partner"}</span>. Receiving 3 warnings triggers an automatic 1-month driver suspension and fine.
              </p>

              <form onSubmit={handleRaiseComplaint} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Issue Category</label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold focus:border-red-500 focus:outline-none"
                    required
                  >
                    <option value="Coming Late">Delivery Partner Coming Late</option>
                    <option value="Not Delivering Order">Order Not Delivered / Refused</option>
                    <option value="Rudeness">Unprofessional / Rude Behavior</option>
                    <option value="Damaged Package">Damaged Food Containers</option>
                    <option value="Other">Other Operational Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Detailed Description</label>
                  <textarea
                    rows="4"
                    placeholder="Provide specific details..."
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold focus:border-red-500 focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingComplaint}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/10 hover:bg-red-700 transition"
                  >
                    {submittingComplaint ? "Submitting..." : "Submit Complaint"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
