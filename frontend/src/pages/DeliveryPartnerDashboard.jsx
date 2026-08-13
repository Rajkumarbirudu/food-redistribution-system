import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Navigation,
  RefreshCw,
  Clock,
  ClipboardList,
  LogOut,
  ShieldAlert,
  Wallet,
  AlertTriangle,
  Octagon
} from "lucide-react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";

export default function DeliveryPartnerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  
  // States
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [useRealLocation, setUseRealLocation] = useState(false);
  const [realWatchId, setRealWatchId] = useState(null);

  // Self-Assign Modal State
  const [claimingDonation, setClaimingDonation] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Simulated GPS state
  const [simulatingId, setSimulatingId] = useState(null);
  const [simStep, setSimStep] = useState(0);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch unassigned claimed donations
      const pendingRes = await api.get("/donations/pending-delivery");
      setPendingDeliveries(pendingRes.data || []);

      // 2. Fetch all donations and filter tasks assigned to this courier user
      const allRes = await api.get("/donations");
      const list = allRes.data || [];
      
      const active = list.filter(
        d => String(d.delivery_boy_id) === String(user?.id) && 
        ["ASSIGNED", "IN_TRANSIT"].includes(d.status)
      );
      const completed = list.filter(
        d => String(d.delivery_boy_id) === String(user?.id) && 
        d.status === "COMPLETED"
      );

      setActiveTasks(active);
      setCompletedTasks(completed);

      // Auto-resume GPS simulation if any task is already IN_TRANSIT
      const transitTask = active.find(t => t.status === "IN_TRANSIT");
      if (transitTask) {
        startGpsSimulation(transitTask.id, active);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load delivery operations data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (realWatchId) navigator.geolocation.clearWatch(realWatchId);
    };
  }, [fetchData, realWatchId]);

  // Helper: MD5-based coordinate hash (must match backend get_mock_coordinates)
  const getMockCoords = (address) => {
    let hash = 0;
    const str = address || "";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = 40.7128 + ((Math.abs(hash) % 1000) - 500) * 0.00008;
    const lng = -74.0060 + ((Math.floor(Math.abs(hash) / 1000) % 1000) - 500) * 0.00008;
    return { lat, lng };
  };

  const startGpsSimulation = (donationId, tasksList = activeTasks) => {
    if (simulatingId === donationId) return;
    setSimulatingId(donationId);
    setSimStep(0);

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (realWatchId) {
      navigator.geolocation.clearWatch(realWatchId);
      setRealWatchId(null);
    }

    const task = tasksList.find(t => t.id === donationId);
    if (!task) return;

    if (useRealLocation && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            await api.post(`/donations/${donationId}/location`, {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setSuccess(`Device Geolocation updated: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
          } catch (err) {
            console.error("Failed to post real GPS coordinate:", err);
          }
        },
        (err) => {
          console.error("GPS Watch error:", err);
          setError("Failed to fetch device GPS location. Falling back to mock GPS.");
          setUseRealLocation(false);
          runMockSimulation(donationId, task);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
      setRealWatchId(watchId);
    } else {
      runMockSimulation(donationId, task);
    }
  };

  const runMockSimulation = (donationId, task) => {
    const donorCoords = getMockCoords(task.pickup_address);
    const ngoCoords = getMockCoords("NGO Destination");

    let step = 0;
    const totalSteps = 10;

    intervalRef.current = setInterval(async () => {
      step += 1;
      setSimStep(step);

      const ratio = step / totalSteps;
      const currentLat = donorCoords.lat + (ngoCoords.lat - donorCoords.lat) * ratio;
      const currentLng = donorCoords.lng + (ngoCoords.lng - donorCoords.lng) * ratio;

      try {
        await api.post(`/donations/${donationId}/location`, {
          lat: currentLat,
          lng: currentLng
        });
      } catch (err) {
        console.error("Failed to post simulated GPS coordinate:", err);
      }

      if (step >= totalSteps) {
        clearInterval(intervalRef.current);
        setSuccess("You have arrived at the destination! Mark the item as delivered.");
      }
    }, 3000);
  };

  const handleClaimClick = (donation) => {
    setClaimingDonation(donation);
    // Auto-prefill with the vehicle plate number they registered with (if any)
    setVehicleNumber(user?.vehicle_number || "");
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      setError("Please verify/provide your vehicle plate number.");
      return;
    }

    setSubmittingClaim(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/donations/${claimingDonation.id}/assign-delivery`, {
        delivery_boy_id: user?.id,
        vehicle_number: vehicleNumber.trim()
      });
      setSuccess("Shipment claimed successfully! It is now on your Run Sheet.");
      setClaimingDonation(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to claim shipment.");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleStartPickup = async (donationId) => {
    setError("");
    setSuccess("");
    try {
      await api.post(`/donations/${donationId}/pickup`);
      setSuccess("Pickup started! Simulated GPS tracking has engaged.");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start pickup.");
    }
  };

  const handleMarkDelivered = async (donationId) => {
    setError("");
    setSuccess("");
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (realWatchId) {
      navigator.geolocation.clearWatch(realWatchId);
      setRealWatchId(null);
    }
    setSimulatingId(null);
    try {
      await api.post(`/donations/${donationId}/deliver`);
      setSuccess("Shipment marked as DELIVERED successfully! Good job!");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to finalize delivery.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6 max-w-7xl mx-auto bg-transparent min-h-screen transition-colors duration-300">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Truck className="text-sky-600 dark:text-sky-400" size={32} /> {t("Delivery Operations Desk")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t("Welcome back,")} <span className="font-bold text-slate-700 dark:text-slate-200">{user?.full_name}</span>. {t("Claim food shipments, execute runs, and track transit logs.")}
            </p>
            {user?.license_number && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bold">
                {t("Driver License:")} <span className="text-slate-600 dark:text-slate-300">{user.license_number}</span> • {t("Registered Vehicle:")} <span className="text-slate-600 dark:text-slate-300">{user.vehicle_number || t("None")}</span>
              </p>
            )}
          </div>
          <button
            onClick={fetchData}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw size={18} /> {t("Refresh Desk")}
          </button>
        </header>

        {/* Feedback Alerts */}
        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/50 p-4 text-sm font-semibold text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-green-200 dark:border-emerald-900/60 bg-green-50 dark:bg-emerald-950/50 p-4 text-sm font-semibold text-green-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle size={20} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* GPS Tracking active banner */}
        {simulatingId && (
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/60 p-4 text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Navigation className="animate-spin" size={18} />
              <span>{t("Simulated GPS Live Transit Tracking Active (Posting Telemetry)")}</span>
            </div>
            <span>{simStep * 10}% {t("Progress")}</span>
          </div>
        )}

        {/* 1-Month Suspension Warning Banner */}
        {(user?.is_suspended || (user?.warnings_count || 0) >= 3) && (
          <div className="rounded-2xl border-2 border-red-500 bg-red-50 dark:bg-red-950/80 p-5 text-red-900 dark:text-red-200 shadow-md flex items-start gap-3">
            <ShieldAlert size={26} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-base text-red-900 dark:text-red-100">{t("ACCOUNT SUSPENDED FOR 1 MONTH")}</h3>
              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mt-1">
                You have received {user?.warnings_count || 3} warnings. In accordance with platform policy, receiving 3 warnings triggers an automatic 1-month account suspension and a ₹100 penalty fine per warning.
              </p>
              {user?.suspended_until && (
                <p className="text-xs font-bold text-red-800 dark:text-red-200 mt-2 bg-red-100/80 dark:bg-red-900/60 px-3 py-1.5 rounded-xl inline-block">
                  Suspension active until: {new Date(user.suspended_until).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Wallet & Compliance Row */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-sky-500 to-sky-700 p-6 text-white shadow-lg shadow-sky-600/20">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-sky-100">Transporter Wallet Balance</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs text-white">
                <Wallet size={20} />
              </div>
            </div>
            <h2 className="text-3xl font-black mt-2">
              ₹{(user?.wallet_balance ?? 1000.0).toFixed(2)}
            </h2>
            <p className="text-[11px] font-semibold text-sky-100/90 mt-2">
              ₹100.00 penalty fine is automatically deducted from your wallet for every warning issued.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">Warnings & Compliance</p>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                (user?.warnings_count || 0) >= 3 
                  ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300" 
                  : (user?.warnings_count || 0) > 0 
                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300" 
                  : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
              }`}>
                {user?.warnings_count || 0} / 3 Warnings
              </span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (user?.warnings_count || 0) >= 3 ? "bg-red-600" : (user?.warnings_count || 0) > 0 ? "bg-amber-500" : "bg-emerald-500"
                  }`} 
                  style={{ width: `${Math.min(100, ((user?.warnings_count || 0) / 3) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
                {(user?.warnings_count || 0) >= 3 
                  ? "Maximum warning threshold reached. 1-month suspension active." 
                  : `${3 - (user?.warnings_count || 0)} warning(s) remaining before automatic 1-month suspension.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Available Requests</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingDeliveries.length}</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">My Active Runs</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeTasks.length}</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Completed Deliveries</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{completedTasks.length}</h3>
            </div>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Section 1: Open Requests */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Claim Shipment to Deliver</h2>
            
            {loading ? (
              <p className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 font-semibold">Loading shipping requests...</p>
            ) : pendingDeliveries.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/90 dark:bg-slate-900/90 p-6">
                <CheckCircle className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-3">No pending transport requests</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">All claimed donations are currently assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-black text-slate-700 dark:text-slate-300">
                          {delivery.category_name}
                        </span>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mt-2">{delivery.food_name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
                          Qty: {delivery.quantity} {delivery.unit}
                        </p>
                      </div>
                      <button
                        onClick={() => handleClaimClick(delivery)}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Claim Delivery
                      </button>
                    </div>

                    <hr className="my-4 border-slate-100 dark:border-slate-800" />

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <MapPin className="text-green-600 dark:text-emerald-400 shrink-0 mt-0.5" size={15} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{delivery.pickup_address}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{delivery.contact_person} • {delivery.phone_number}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <MapPin className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={15} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">NGO Destination</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">NGO Redistribution Facility</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Scheduled pickup time: {delivery.pickup_time || "12:00"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Active Run Sheet & Completed Tasks */}
          <div className="space-y-8">
            
            {/* Active Run Sheet */}
            <section className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">My Active Run Sheet</h2>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useRealLocation}
                    onChange={(e) => {
                      setUseRealLocation(e.target.checked);
                      if (simulatingId) {
                        const currentSimId = simulatingId;
                        setSimulatingId(null);
                        setTimeout(() => startGpsSimulation(currentSimId), 100);
                      }
                    }}
                    className="rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer h-4 w-4"
                  />
                  <span>Use Device Geolocation (Real GPS)</span>
                </label>
              </div>
              
              {loading ? (
                <p className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 font-semibold">Loading assignments...</p>
              ) : activeTasks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/90 dark:bg-slate-900/90 p-6">
                  <Truck className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-3">No active deliveries</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Claim a transport request to start delivering.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{task.food_name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
                            Qty: {task.quantity} {task.unit} • Vehicle: <span className="text-slate-800 dark:text-slate-200 font-black">{task.vehicle_number}</span>
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          task.status === "IN_TRANSIT" 
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300" 
                            : "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300"
                        }`}>
                          {task.status}
                        </span>
                      </div>

                      <hr className="my-4 border-slate-100 dark:border-slate-800" />

                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <MapPin className="text-green-600 dark:text-emerald-400 shrink-0 mt-0.5" size={15} />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{task.pickup_address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2">
                        {task.status === "ASSIGNED" ? (
                          <button
                            onClick={() => handleStartPickup(task.id)}
                            className="w-full rounded-2xl bg-green-600 py-3 text-xs font-bold text-white shadow-lg shadow-green-600/25 hover:bg-green-700 transition cursor-pointer"
                          >
                            Start Pickup & GPS Telemetry
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkDelivered(task.id)}
                            className="w-full rounded-2xl bg-amber-500 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/25 hover:bg-amber-600 transition cursor-pointer"
                          >
                            Mark as Delivered
                          </button>
                        )}
                        
                        <a
                          href={`/donations/${task.id}/track`}
                          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shrink-0 flex items-center justify-center"
                        >
                          <Navigation size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Completed Deliveries */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Shipments ({completedTasks.length})</h2>
              <div className="space-y-3">
                {completedTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-xs"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-xs">{task.food_name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Qty: {task.quantity} {task.unit}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-emerald-400">
                      <CheckCircle size={14} /> Delivered
                    </div>
                  </div>
                ))}
                {!loading && completedTasks.length === 0 && (
                  <p className="text-center text-[10px] text-slate-400 py-2">No completed shipments yet.</p>
                )}
              </div>
            </section>

          </div>

        </div>

        {/* Claim Cargo Modal */}
        {claimingDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Claim Surplus Shipment</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Verify or provide your transport vehicle plate number to accept this delivery.
              </p>

              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Vehicle / Bike Plate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. NY-99-TR-7777"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setClaimingDonation(null)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition"
                  >
                    {submittingClaim ? "Claiming..." : "Confirm Claim"}
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
