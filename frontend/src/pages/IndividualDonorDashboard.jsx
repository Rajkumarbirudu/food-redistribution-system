import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Home, 
  PlusCircle, 
  PackageOpen, 
  Clock3, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  HeartHandshake, 
  ArrowRight, 
  Utensils, 
  AlertCircle,
  FileCheck,
  Edit2,
  Trash2,
  Search,
  Filter,
  Plus,
  Camera,
  Download,
  Image as ImageIcon,
  X,
  Maximize2,
  RotateCcw,
  Leaf,
  Navigation,
  UploadCloud
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import {
  fetchCurrentTemperature,
  calculateTempAdjustedExpiry,
  calculateAdjustedHours,
  getTemperatureMultiplier
} from "../utils/temperatureExpiry";

function StatCard({ icon: Icon, title, value, description, onClick, active, colorClass }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[28px] border p-6 text-left shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none cursor-pointer ${
        active
          ? "border-sky-500 bg-sky-50/90 dark:bg-sky-950/60 dark:border-sky-600 ring-2 ring-sky-200 dark:ring-sky-800"
          : "border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-sky-300 dark:hover:border-sky-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass || "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400"} group-hover:scale-105 transition`}>
          <Icon size={23} />
        </div>
        <ArrowRight
          size={18}
          className="text-slate-300 dark:text-slate-600 transition group-hover:translate-x-1 group-hover:text-sky-600 dark:group-hover:text-sky-400"
        />
      </div>

      <p className="mt-6 text-sm font-bold text-slate-500 dark:text-slate-400">{t(title)}</p>

      <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
        {typeof value === "number" ? value : 0}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{t(description)}</p>
    </button>
  );
}


export default function IndividualDonorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const videoRef = useRef(null);


  const [inventory, setInventory] = useState([]);
  const [donations, setDonations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [ambientTemp, setAmbientTemp] = useState(28);
  const [locationName, setLocationName] = useState("Detecting location...");

  useEffect(() => {
    async function loadTemp() {
      const res = await fetchCurrentTemperature();
      setAmbientTemp(res.temp);
      setLocationName(res.locationName);
    }
    loadTemp();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [photoLightbox, setPhotoLightbox] = useState(null);

  // Photo Capture States
  const [cameraActive, setCameraActive] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState(null);
  const [inventoryPhoto, setInventoryPhoto] = useState(null);
  const [editPhoto, setEditPhoto] = useState(null);
  const [donationPhoto, setDonationPhoto] = useState(null);

  // Submitting States
  const [submittingInventory, setSubmittingInventory] = useState(false);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  // Manual Add Inventory Form
  const [inventoryForm, setInventoryForm] = useState({
    name: "",
    category_id: "",
    quantity: 1,
    unit: "KG",
    expiry_date: "",
    storage_requirement: "ROOM_TEMPERATURE",
    perishability_risk: "MEDIUM",
    notes: "",
  });

  // Edit Inventory Form
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    category_id: "",
    quantity: 1,
    unit: "KG",
    expiry_date: "",
    storage_requirement: "ROOM_TEMPERATURE",
    notes: "",
  });

  // Post Home Donation Form
  const [donationForm, setDonationForm] = useState({
    name: "",
    category_id: "",
    quantity: 5,
    unit: "SERVING",
    expiry_date: "",
    pickup_address: user?.address || "Home Address",
    notes: "Fresh food from Individual Home. Handle with care.",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let catData = [];
      try {
        const catRes = await api.get("/categories");
        const rawCats = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data?.items || catRes.data?.categories || [];

        catData = rawCats
          .map((c) => ({
            id: String(c.id || c._id || c.name || ""),
            name: c.name || "General Food",
          }))
          .filter((c) => Boolean(c.id));
      } catch (catErr) {
        console.warn("Categories fetch warning:", catErr);
      }

      if (!catData || catData.length === 0) {
        catData = [
          { id: "cooked_meals", name: "Cooked Meals & Dishes" },
          { id: "groceries_grains", name: "Groceries & Grains" },
          { id: "fruits_vegetables", name: "Fruits & Vegetables" },
          { id: "dairy_bakery", name: "Dairy & Bakery" },
          { id: "packaged_food", name: "Packaged & Canned Food" },
        ];
      }

      setCategories(catData);

      const defaultCatId = catData[0]?.id || "";
      setDonationForm((prev) => ({
        ...prev,
        category_id: prev.category_id || defaultCatId,
      }));
      setInventoryForm((prev) => ({
        ...prev,
        category_id: prev.category_id || defaultCatId,
      }));

      try {
        const invRes = await api.get("/inventory");
        const rawItems = Array.isArray(invRes.data) ? invRes.data : invRes.data?.items || [];
        
        // Deduplicate inventory by unique ID or food signature
        const uniqueItems = [];
        const seenKeys = new Set();
        for (const item of rawItems) {
          const idKey = item.id || item._id;
          const contentKey = `${(item.name || item.food_name || "").toLowerCase().trim()}_${item.quantity}_${item.unit}_${item.expiry_date || ""}`;
          
          if (idKey && !seenKeys.has(String(idKey))) {
            seenKeys.add(String(idKey));
            uniqueItems.push(item);
          } else if (!idKey && !seenKeys.has(contentKey)) {
            seenKeys.add(contentKey);
            uniqueItems.push(item);
          }
        }
        setInventory(uniqueItems);
      } catch (invErr) {
        console.warn("Inventory fetch warning:", invErr);
        setInventory([]);
      }

      try {
        const donRes = await api.get("/donations");
        const rawDonations = Array.isArray(donRes.data) ? donRes.data : [];
        
        // Deduplicate donations by unique donation ID
        const uniqueDonations = [];
        const seenDonationKeys = new Set();
        for (const don of rawDonations) {
          const donKey = don.id || don._id;
          if (donKey && !seenDonationKeys.has(String(donKey))) {
            seenDonationKeys.add(String(donKey));
            uniqueDonations.push(don);
          }
        }
        setDonations(uniqueDonations);
      } catch (donErr) {
        console.warn("Donations fetch warning:", donErr);
        setDonations([]);
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      setError("Unable to sync Individual Home data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClearAllData = async () => {
    if (!window.confirm("Are you sure you want to clear all your pantry inventory and donation data? This will set all metric counts to 0.")) {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      try {
        await api.delete("/inventory/clear/all-items");
      } catch (bulkErr) {
        console.warn("Bulk clear endpoint attempt:", bulkErr);
      }

      for (const item of inventory) {
        try {
          if (item?.id) await api.delete(`/inventory/${item.id}`);
        } catch (e) {
          console.warn("Item delete error:", e);
        }
      }
      setInventory([]);
      setDonations([]);
      setSuccess("All inventory items and donation records cleared! All metrics set to 0.");
      fetchData();
    } catch (err) {
      console.error(err);
      setError("Failed to clear data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleOnlineSync = () => {
      console.log("Network online sync event received in IndividualDonorDashboard. Refreshing dashboard...");
      fetchData();
    };

    window.addEventListener("app:online-sync", handleOnlineSync);
    return () => window.removeEventListener("app:online-sync", handleOnlineSync);
  }, [fetchData]);

  // Mutually exclusive mathematical calculations for cards
  const totalInventoryCount = inventory.length;

  const expiredCount = (inventory || []).filter(i => {
    const status = (i?.expiry_status || "").toUpperCase();
    const days = Number(i?.days_until_expiry);
    return status === "EXPIRED" || (!isNaN(days) && days < 0);
  }).length;

  const expiringSoonCount = (inventory || []).filter(i => {
    const status = (i?.expiry_status || "").toUpperCase();
    const days = Number(i?.days_until_expiry);
    const isExpired = status === "EXPIRED" || (!isNaN(days) && days < 0);
    return !isExpired && (status === "EXPIRING_SOON" || (!isNaN(days) && days >= 0 && days <= 2));
  }).length;

  const freshCount = Math.max(0, totalInventoryCount - (expiredCount + expiringSoonCount));

  const activeDonations = (donations || []).filter(d => 
    ["AVAILABLE", "CLAIMED", "ASSIGNED", "IN_TRANSIT"].includes((d?.status || "").toUpperCase())
  );

  const donationByInvId = (donations || []).reduce((acc, don) => {
    const invId = String(don.inventory_id || "");
    if (invId) {
      acc[invId] = don;
    }
    return acc;
  }, {});

  // Filtered inventory list
  const filteredInventory = (inventory || []).filter(item => {
    const itemName = (item?.name || item?.food_name || "").toLowerCase();
    const categoryName = (item?.category_name || "").toLowerCase();
    const search = (searchTerm || "").toLowerCase();
    const matchesSearch = itemName.includes(search) || categoryName.includes(search);

    const status = (item?.expiry_status || "").toUpperCase();
    const days = Number(item?.days_until_expiry);

    let itemStatus = "FRESH";
    if (status === "EXPIRED" || (!isNaN(days) && days < 0)) {
      itemStatus = "EXPIRED";
    } else if (status === "EXPIRING_SOON" || (!isNaN(days) && days >= 0 && days <= 2)) {
      itemStatus = "EXPIRING_SOON";
    }

    const matchesStatus = statusFilter === "ALL" || statusFilter === "DONATED" || itemStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Product Photo Handlers
  const handlePhotoSelect = (e, modalType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      if (modalType === "ADD_INV") setInventoryPhoto(dataUrl);
      if (modalType === "EDIT_INV") setEditPhoto(dataUrl);
      if (modalType === "DONATE") setDonationPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async (modalType) => {
    setActivePhotoModal(modalType);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please select a photo file from your device.");
      setCameraActive(false);
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    if (activePhotoModal === "ADD_INV") setInventoryPhoto(dataUrl);
    if (activePhotoModal === "EDIT_INV") setEditPhoto(dataUrl);
    if (activePhotoModal === "DONATE") setDonationPhoto(dataUrl);

    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const handleAddInventorySubmit = async (e) => {
    e.preventDefault();
    const targetCategoryId = inventoryForm.category_id || categories[0]?.id || "cooked_meals";

    if (!inventoryForm.name || !inventoryForm.expiry_date) {
      setError("Please fill in item name and expiry date.");
      return;
    }

    setSubmittingInventory(true);
    setError("");
    setSuccess("");

    try {
      const formattedExpiry = inventoryForm.expiry_date
        ? inventoryForm.expiry_date.split("T")[0]
        : new Date().toISOString().split("T")[0];

      const payload = {
        name: inventoryForm.name,
        food_name: inventoryForm.name,
        category_id: targetCategoryId,
        quantity: Number(inventoryForm.quantity),
        unit: inventoryForm.unit || "KG",
        expiry_date: formattedExpiry,
        pickup_address: user?.address || "Home Address",
        pickup_time: "09:00 AM - 08:00 PM",
        contact_person: user?.full_name || "Home Donor",
        phone_number: user?.phone_number || "9876543210",
        storage_requirement: inventoryForm.storage_requirement || "ROOM_TEMPERATURE",
        perishability_risk: inventoryForm.perishability_risk || "MEDIUM",
        notes: inventoryForm.notes || "Added manually",
        image_url: inventoryPhoto || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
      };

      await api.post("/inventory", payload);
      setSuccess(`Successfully added '${inventoryForm.name}' to home pantry!`);
      setShowAddInventoryModal(false);
      setInventoryPhoto(null);
      setInventoryForm({
        name: "",
        category_id: categories[0]?.id || "",
        quantity: 1,
        unit: "KG",
        expiry_date: "",
        storage_requirement: "ROOM_TEMPERATURE",
        perishability_risk: "MEDIUM",
        notes: "",
      });
      fetchData();
    } catch (err) {
      console.error("ADD INVENTORY ERROR:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail.map(i => i.msg).join(", ") : err.message);
      setError(msg || "Failed to add inventory item.");
    } finally {
      setSubmittingInventory(false);
    }
  };

  const handleEditOpen = (item) => {
    setSelectedInventoryItem(item);
    setEditPhoto(item.image_url || null);
    setEditForm({
      id: item.id,
      name: item.name || item.food_name || "",
      category_id: item.category_id || (categories[0]?.id || ""),
      quantity: item.quantity,
      unit: item.unit || "KG",
      expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString().slice(0, 16) : "",
      storage_requirement: item.storage_requirement || "ROOM_TEMPERATURE",
      notes: item.notes || "",
    });
    setShowEditInventoryModal(true);
  };

  const handleEditInventorySubmit = async (e) => {
    e.preventDefault();
    setSubmittingInventory(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: editForm.name,
        food_name: editForm.name,
        category_id: editForm.category_id,
        quantity: Number(editForm.quantity),
        unit: editForm.unit,
        expiry_date: new Date(editForm.expiry_date).toISOString(),
        storage_requirement: editForm.storage_requirement,
        notes: editForm.notes,
        image_url: editPhoto || selectedInventoryItem?.image_url,
      };

      await api.put(`/inventory/${editForm.id}`, payload);
      setSuccess(`Updated '${editForm.name}' in home pantry!`);
      setShowEditInventoryModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to update item.");
    } finally {
      setSubmittingInventory(false);
    }
  };

  const handleDeleteInventory = async (item) => {
    const itemName = item.name || item.food_name || "Food Item";
    if (!window.confirm(`Are you sure you want to remove '${itemName}' from your inventory?`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.delete(`/inventory/${item.id}`);
      setSuccess(`Removed '${itemName}' from inventory.`);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to delete item.");
    }
  };

  const handlePostDonationSubmit = async (e) => {
    e.preventDefault();
    if (!donationForm.name || !donationForm.expiry_date) {
      setError("Please fill out all required food details.");
      return;
    }

    setSubmittingDonation(true);
    setError("");
    setSuccess("");

    try {
      const targetCatId = donationForm.category_id || categories[0]?.id || "cooked_meals";
      const formattedExpiry = donationForm.expiry_date
        ? donationForm.expiry_date.split("T")[0]
        : new Date().toISOString().split("T")[0];

      const invPayload = {
        name: donationForm.name,
        food_name: donationForm.name,
        category_id: targetCatId,
        quantity: Number(donationForm.quantity),
        unit: donationForm.unit || "SERVING",
        expiry_date: formattedExpiry,
        pickup_address: donationForm.pickup_address || user?.address || "Home Address",
        pickup_time: "09:00 AM - 08:00 PM",
        contact_person: user?.full_name || "Home Donor",
        phone_number: user?.phone_number || "9876543210",
        notes: donationForm.notes || "Home cooked food donation",
        image_url: donationPhoto || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
      };

      const itemRes = await api.post("/inventory", invPayload);
      const inventoryId = itemRes.data.id;

      const donPayload = {
        inventory_id: inventoryId,
        quantity: Number(donationForm.quantity),
        pickup_deadline: new Date(donationForm.expiry_date).toISOString(),
        notes: donationForm.notes || "Home cooked food donation",
      };

      await api.post("/donations", donPayload);

      setSuccess("Your home food donation with product photo has been published! Nearby NGOs have been notified.");
      setShowDonateModal(false);
      setDonationPhoto(null);
      fetchData();
    } catch (err) {
      console.error("POST DONATION ERROR:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail.map(i => i.msg).join(", ") : err.message);
      setError(msg || "Failed to publish donation.");
    } finally {
      setSubmittingDonation(false);
    }
  };

  const handleDirectDonate = async (item) => {
    const itemName = item.name || item.food_name || "Food Item";
    setError("");
    setSuccess("");
    try {
      const pickupDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      await api.post("/donations", {
        inventory_id: item.id,
        quantity: Number(item.quantity || 1),
        pickup_deadline: pickupDeadline,
        notes: "Donated from Individual Home Food Reserve",
      });
      setSuccess(`Successfully published '${itemName}' as available surplus food for NGOs!`);
      fetchData();
    } catch (err) {
      console.error("DIRECT DONATE ERROR:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail.map(i => i.msg).join(", ") : err.message);
      setError(msg || "Failed to publish donation for NGO pickup.");
    }
  };

  const handleExportCSV = () => {
    const listToExport = filteredInventory.length > 0 ? filteredInventory : inventory;
    if (!listToExport || listToExport.length === 0) {
      setError("No pantry items available to export.");
      return;
    }

    const headers = [
      "ID",
      "Food Item Name",
      "Category",
      "Quantity",
      "Unit",
      "Expiry Date",
      "Storage Requirement",
      "Perishability Risk",
      "Pickup Address",
      "Notes"
    ];

    const rows = listToExport.map((item) => [
      `"${String(item.id || item._id || "").replace(/"/g, '""')}"`,
      `"${String(item.name || item.food_name || "").replace(/"/g, '""')}"`,
      `"${String(item.category_name || "").replace(/"/g, '""')}"`,
      item.quantity ?? "",
      `"${String(item.unit || "").replace(/"/g, '""')}"`,
      `"${String(item.expiry_date || "").replace(/"/g, '""')}"`,
      `"${String(item.storage_requirement || "").replace(/"/g, '""')}"`,
      `"${String(item.perishability_risk || "").replace(/"/g, '""')}"`,
      `"${String(item.pickup_address || user?.address || "").replace(/"/g, '""')}"`,
      `"${String(item.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aura_home_pantry_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(`Successfully exported ${listToExport.length} pantry items to CSV!`);
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "inventory") {
      const el = document.getElementById("pantry-table-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "donations") {
      const el = document.getElementById("active-donations-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.search]);

  const navigationItems = [
    { label: "Individual Home", path: "/individual", icon: Home },
    { label: "Food Inventory", path: "/individual?tab=inventory", icon: PackageOpen },
    { label: "Surplus Donations", path: "/individual?tab=donations", icon: HeartHandshake },
  ];

  const currentPath = location.pathname + (location.search || "");

  return (
    <DashboardLayout
      title={`${t("Welcome to Individual Home")}, ${user?.full_name || "Neighbor"}! 🏠`}
      subtitle={t("Your account is verified via Aadhar Card, PAN Card, and Mobile Security OTP.")}
      badge={t("VERIFIED INDIVIDUAL HOME DONOR ✓")}
      quote={t("Every meal saved is a chance to nourish a life and protect our planet.")}
      navigation={navigationItems}
      activePath={currentPath}
      onRefresh={fetchData}
      refreshing={loading}
    >

      <div className="space-y-8 font-sans">

        {/* FEEDBACK ALERTS */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700">✕</button>
          </div>
        )}

        {/* STAT METRICS CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          
          <StatCard
            icon={PackageOpen}
            title="Inventory Items"
            value={totalInventoryCount}
            description="Total items in home pantry"
            active={statusFilter === "ALL"}
            colorClass="bg-blue-50 text-blue-700"
            onClick={() => setStatusFilter("ALL")}
          />

          <StatCard
            icon={Leaf}
            title="Fresh"
            value={freshCount}
            description="Safe & fresh food items"
            active={statusFilter === "FRESH"}
            colorClass="bg-emerald-50 text-emerald-700"
            onClick={() => setStatusFilter("FRESH")}
          />

          <StatCard
            icon={Clock3}
            title="Expiring Soon"
            value={expiringSoonCount}
            description="Items expiring within 2 days"
            active={statusFilter === "EXPIRING_SOON"}
            colorClass="bg-amber-50 text-amber-700"
            onClick={() => setStatusFilter("EXPIRING_SOON")}
          />

          <StatCard
            icon={AlertCircle}
            title="Expired"
            value={expiredCount}
            description="Items past expiration date"
            active={statusFilter === "EXPIRED"}
            colorClass="bg-red-50 text-red-700"
            onClick={() => setStatusFilter("EXPIRED")}
          />

          <StatCard
            icon={HeartHandshake}
            title="Total Donated"
            value={donations.length}
            description="Total food items donated"
            active={statusFilter === "DONATED"}
            colorClass="bg-purple-50 text-purple-700"
            onClick={() => {
              setStatusFilter("DONATED");
              const el = document.getElementById("active-donations-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />

        </div>

        {/* ACTIVE DONATIONS & TRANSPORTER RADAR SECTION */}
        <div id="active-donations-section" className="rounded-[32px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 md:p-8 shadow-sm backdrop-blur-xl space-y-5 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="text-sky-600 dark:text-sky-400" size={20} /> {t("Ongoing Dispatches in Transit")} ({activeDonations.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {t("Track delivery partners currently on the way with your food items in real time.")}
              </p>
            </div>
            <button
              onClick={() => navigate("/donations")}
              className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-1"
            >
              {t("View All Dispatches")} <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {activeDonations.map((don) => (
              <div
                key={don.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 gap-4"
              >
                <div className="flex items-center gap-3">
                  {don.image_url ? (
                    <button
                      type="button"
                      onClick={() => setPhotoLightbox(don.image_url)}
                      className="relative group h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs"
                    >
                      <img
                        src={don.image_url}
                        alt={don.food_name}
                        className="h-full w-full object-cover transition group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Maximize2 size={12} />
                      </div>
                    </button>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-black text-lg">
                      🍲
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{t(don.food_name)}</h4>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {t("Quantity:")} <span className="font-bold text-slate-700 dark:text-slate-200">{don.quantity} {t(don.unit)}</span> • {t("Address:")} {don.pickup_address || "Home Address"}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      don.status === "CLAIMED"
                        ? "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 animate-pulse border border-purple-200 dark:border-purple-800"
                        : don.status === "IN_TRANSIT"
                        ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 animate-pulse border border-amber-200 dark:border-amber-800"
                        : don.status === "ASSIGNED"
                        ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                    }`}>
                      {don.status === "CLAIMED"
                        ? t("Claimed by NGO — Scheduled for Pickup")
                        : don.status === "IN_TRANSIT" 
                        ? `🚚 ${t("Delivery Partner is on the way with")} ${don.food_name || "Food"}`
                        : don.status === "ASSIGNED"
                        ? `🚚 ${t("Transporter Assigned")}`
                        : `✨ ${t("Available Surplus Food — Waiting for NGO Claim")}`
                      }
                    </span>
                  </div>

                  <a
                    href={`/donations/${don.id}/track`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
                  >
                    <Navigation size={14} className="text-blue-600 dark:text-blue-400" /> {t("Live Fleet Radar")}
                  </a>
                </div>
              </div>
            ))}

            {!loading && activeDonations.length === 0 && (
              <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Utensils size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{t("No active home donations in transit currently.")}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t("Click 'Post Home Meal / Food' below to donate surplus meals to local NGOs!")}</p>
              </div>
            )}
          </div>
        </div>

        {/* FOOD INVENTORY TABLE & MANAGEMENT DESK (ONLY MANUAL ENTRY & PHOTO) */}
        <div id="pantry-table-section" className="rounded-[32px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 md:p-8 shadow-sm backdrop-blur-xl space-y-5 transition-colors duration-300">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PackageOpen className="text-sky-600 dark:text-sky-400" size={20} /> {t("Individual Home Pantry Inventory")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {t("Manually enter home food stock items with real product photos and snapshots.")}
              </p>
            </div>

            {/* ACTION TOOLBAR: ONLY MANUAL ENTRY & PHOTO (NO BULK CSV / TEMPLATES) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/80 px-4 py-2.5 text-xs font-black text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition flex items-center gap-2 cursor-pointer"
              >
                <Download size={16} /> {t("Export CSV")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowAddInventoryModal(true);
                }}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-sky-700 transition shadow-xs flex items-center gap-2"
              >
                <Plus size={16} /> {t("Add Inventory + Photo")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowDonateModal(true);
                }}
                className="rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition shadow-xs flex items-center gap-2"
              >
                <PlusCircle size={16} /> {t("Post Home Meal / Food")}
              </button>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t("Search food item by name or category...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Filter size={16} className="text-slate-400 dark:text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">{t("All Expiry Statuses")}</option>
                <option value="FRESH">{t("Fresh Items Only")}</option>
                <option value="EXPIRING_SOON">{t("Expiring Soon Only")}</option>
                <option value="EXPIRED">{t("Expired Items Only")}</option>
              </select>

              {statusFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1"
                >
                  <RotateCcw size={13} /> {t("Reset Filter")}
                </button>
              )}
            </div>
          </div>

          {/* INVENTORY TABLE WITH PRODUCT PHOTOS */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">{t("Product Photo")}</th>
                  <th className="p-4">{t("Food Item Name")}</th>
                  <th className="p-4">{t("Category")}</th>
                  <th className="p-4">{t("Quantity")}</th>
                  <th className="p-4">{t("Expiry Date")}</th>
                  <th className="p-4">{t("Expiry Status")}</th>
                  <th className="p-4 text-right">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">

                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4">
                      {item.image_url ? (
                        <button
                          type="button"
                          onClick={() => setPhotoLightbox(item.image_url)}
                          className="relative group h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                          <img
                            src={item.image_url}
                            alt={item.name || item.food_name}
                            className="h-full w-full object-cover transition group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Maximize2 size={12} />
                          </div>
                        </button>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white">{t(item.name || item.food_name || "Food Item")}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{t(item.category_name || "General Food")}</td>
                    <td className="p-4 text-slate-800 dark:text-slate-200">{item.quantity} {t(item.unit)}</td>

                    <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleString() : "N/A"}
                    </td>
                    <td className="p-4">
                      {donationByInvId[item.id] ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          donationByInvId[item.id].status === "CLAIMED"
                            ? "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 animate-pulse border border-purple-200 dark:border-purple-800"
                            : donationByInvId[item.id].status === "IN_TRANSIT" || donationByInvId[item.id].status === "ASSIGNED"
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        }`}>
                          {donationByInvId[item.id].status === "CLAIMED"
                            ? `📦 ${t("Claimed by NGO")}`
                            : donationByInvId[item.id].status === "IN_TRANSIT" || donationByInvId[item.id].status === "ASSIGNED"
                            ? `🚚 ${t("In Transit")}`
                            : `✨ ${t("Listed for NGO")}`}
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          item.expiry_status === "EXPIRED"
                            ? "bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                            : item.expiry_status === "EXPIRING_SOON"
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}>
                          {t(item.expiry_status || "FRESH")}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5 shrink-0">
                      {donationByInvId[item.id] ? (
                        <span className={`px-3 py-1.5 text-xs font-extrabold rounded-xl ${
                          donationByInvId[item.id].status === "CLAIMED"
                            ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : donationByInvId[item.id].status === "IN_TRANSIT"
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        }`}>
                          {donationByInvId[item.id].status === "CLAIMED" ? t("Claimed") : donationByInvId[item.id].status === "IN_TRANSIT" ? t("In Transit") : t("Listed")}
                        </span>
                      ) : item.expiry_status !== "EXPIRED" && (
                        <button
                          type="button"
                          onClick={() => handleDirectDonate(item)}
                          className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition shadow-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <HeartHandshake size={13} /> {t("Donate")}
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleEditOpen(item)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition inline-flex items-center cursor-pointer"
                        title={t("Edit")}
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteInventory(item)}
                        className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition inline-flex items-center cursor-pointer"
                        title={t("Delete")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold text-xs">
                      {t("No inventory items found. Click 'Add Inventory + Photo' above to manually add food items!")}
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: MANUAL ADD INVENTORY ITEM WITH PHOTO */}
        {showAddInventoryModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Manual Inventory Entry</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Upload product photo & details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddInventoryModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddInventorySubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Food Product Photo (Camera or Upload)
                  </label>
                  <div className="flex items-center gap-3">
                    {inventoryPhoto ? (
                      <div className="relative h-16 w-16 shrink-0 rounded-2xl border border-sky-300 overflow-hidden shadow-xs">
                        <img src={inventoryPhoto} alt="Product" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setInventoryPhoto(null)}
                          className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white hover:bg-slate-900"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                        <ImageIcon size={24} />
                      </div>
                    )}

                    <div className="flex gap-2 flex-1">
                      <label className="cursor-pointer rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-xs">
                        <UploadCloud size={15} className="text-sky-600" />
                        <span>Upload Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e, "ADD_INV")} />
                      </label>

                      <button
                        type="button"
                        onClick={() => startCamera("ADD_INV")}
                        className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Camera size={15} />
                        <span>Take Snapshot</span>
                      </button>
                    </div>
                  </div>
                </div>



                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Food / Meal Item Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Fresh Cooked Rice & Dal / Biryani / Chapatis"
                    value={inventoryForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInventoryForm(p => {
                        const next = { ...p, name: val };
                        const catObj = categories.find(c => String(c.id || c.name) === String(p.category_id));
                        const catName = (catObj?.name || "").toLowerCase();
                        const isCooked = p.category_id && (catName.includes("cooked") || catName.includes("prepared") || catName.includes("meal") || String(p.category_id) === "cat_cooked_food");

                        if (isCooked && val.length >= 1) {
                          const lower = val.toLowerCase().trim();
                          let hours = 4;
                          if (lower.includes("salad") || lower.includes("fruit bowl") || lower.includes("cut fruit")) hours = 2.5;
                          else if (lower.includes("biryani") || lower.includes("pulao") || lower.includes("chicken") || lower.includes("mutton") || lower.includes("fish") || lower.includes("meat") || lower.includes("non-veg") || lower.includes("non veg")) hours = 3;
                          else if (lower.includes("rice") || lower.includes("thali") || lower.includes("meal") || lower.includes("dosa") || lower.includes("idli")) hours = 4;
                          else if (lower.includes("curry") || lower.includes("dal") || lower.includes("gravy") || lower.includes("paneer")) hours = 5;
                          else if (lower.includes("samosa") || lower.includes("pakora") || lower.includes("snack") || lower.includes("puff")) hours = 5.5;
                          else if (lower.includes("roti") || lower.includes("chapati") || lower.includes("naan") || lower.includes("paratha") || lower.includes("bread")) hours = 8;
                          else if (lower.includes("sweet") || lower.includes("kheer") || lower.includes("mithai") || lower.includes("halwa") || lower.includes("dessert")) hours = 12;

                          next.preset_hours = hours;
                          next.expiry_date = calculateTempAdjustedExpiry(
                            new Date().toISOString(),
                            hours,
                            ambientTemp,
                            p.storage_requirement || "ROOM_TEMPERATURE"
                          );
                        }
                        return next;
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={inventoryForm.category_id || (categories[0]?.id || "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInventoryForm(p => {
                          const next = { ...p, category_id: val };
                          const catObj = categories.find(c => String(c.id || c.name) === String(val));
                          const catName = (catObj?.name || "").toLowerCase();
                          const isCooked = val && (catName.includes("cooked") || catName.includes("prepared") || catName.includes("meal") || String(val) === "cat_cooked_food");

                          if (isCooked) {
                            const hours = p.preset_hours || 4;
                            next.expiry_date = calculateTempAdjustedExpiry(
                              new Date().toISOString(),
                              hours,
                              ambientTemp,
                              p.storage_requirement || "ROOM_TEMPERATURE"
                            );
                          }
                          return next;
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.id || c.name} value={c.id || c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                      Quantity & Unit *
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        type="number"
                        min="0.1"
                        step="any"
                        value={inventoryForm.quantity}
                        onChange={(e) => setInventoryForm(p => ({ ...p, quantity: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                      />
                      <select
                        value={inventoryForm.unit}
                        onChange={(e) => setInventoryForm(p => ({ ...p, unit: e.target.value }))}
                        className="rounded-xl border border-slate-200 px-2 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                      >
                        <option value="KG">KG</option>
                        <option value="GRAM">GRAM</option>
                        <option value="LITER">LITER</option>
                        <option value="SERVING">Servings</option>
                        <option value="PACKET">Packets</option>
                        <option value="BOX">Boxes</option>
                        <option value="PIECE">Pieces</option>
                      </select>
                    </div>
                  </div>
                </div>

                {(() => {
                  const catObj = categories.find(c => String(c.id || c.name) === String(inventoryForm.category_id));
                  const catName = (catObj?.name || "").toLowerCase();
                  const isCooked = catName.includes("cooked") || catName.includes("prepared") || catName.includes("meal") || String(inventoryForm.category_id) === "cat_cooked_food";
                  if (!isCooked) return null;
                  return (
                    <div>
                      <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                        Temperature
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`Temperature: ${ambientTemp}°C`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  );
                })()}

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Expiry Date & Time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={inventoryForm.expiry_date}
                    onChange={(e) => setInventoryForm(p => ({ ...p, expiry_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                      Storage Requirement
                    </label>
                    <select
                      value={inventoryForm.storage_requirement}
                      onChange={(e) => setInventoryForm(p => ({ ...p, storage_requirement: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                    >
                      <option value="ROOM_TEMPERATURE">Room Temperature</option>
                      <option value="REFRIGERATED">Refrigerated</option>
                      <option value="FROZEN">Frozen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                      Perishability Risk
                    </label>
                    <select
                      value={inventoryForm.perishability_risk}
                      onChange={(e) => setInventoryForm(p => ({ ...p, perishability_risk: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Notes / Storage Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Keep sealed in airtight container"
                    value={inventoryForm.notes}
                    onChange={(e) => setInventoryForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddInventoryModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInventory}
                    className="rounded-xl bg-sky-600 px-6 py-3 font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition"
                  >
                    {submittingInventory ? "Saving..." : "Add to Pantry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT INVENTORY ITEM WITH PHOTO */}
        {showEditInventoryModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Edit Pantry Item</h2>
                    <p className="text-xs text-slate-500 font-semibold">Update product photo & details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditInventoryModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditInventorySubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Food Product Photo
                  </label>
                  <div className="flex items-center gap-3">
                    {editPhoto ? (
                      <div className="relative h-16 w-16 shrink-0 rounded-2xl border border-blue-300 overflow-hidden shadow-xs">
                        <img src={editPhoto} alt="Product" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditPhoto(null)}
                          className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white hover:bg-slate-900"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                        <ImageIcon size={24} />
                      </div>
                    )}

                    <div className="flex gap-2 flex-1">
                      <label className="cursor-pointer rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-xs">
                        <UploadCloud size={15} className="text-blue-600" />
                        <span>Change Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e, "EDIT_INV")} />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Item Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                      Quantity *
                    </label>
                    <input
                      required
                      type="number"
                      min="0.1"
                      step="any"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm(p => ({ ...p, quantity: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                      Unit
                    </label>
                    <select
                      value={editForm.unit}
                      onChange={(e) => setEditForm(p => ({ ...p, unit: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 font-semibold focus:border-blue-500 focus:outline-none"
                    >
                      <option value="KG">KG</option>
                      <option value="GRAM">GRAM</option>
                      <option value="LITER">LITER</option>
                      <option value="SERVING">Servings</option>
                      <option value="PACKET">Packets</option>
                      <option value="BOX">Boxes</option>
                      <option value="PIECE">Pieces</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Expiry Date & Time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={editForm.expiry_date}
                    onChange={(e) => setEditForm(p => ({ ...p, expiry_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditInventoryModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInventory}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition"
                  >
                    {submittingInventory ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: POST HOME DONATION MODAL WITH PRODUCT PHOTO */}
        {showDonateModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Post Home Meal / Surplus Food</h2>
                    <p className="text-xs text-slate-500 font-semibold">Upload food product photo for NGO verification</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePostDonationSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Food Product / Dish Photo
                  </label>
                  <div className="flex items-center gap-3">
                    {donationPhoto ? (
                      <div className="relative h-16 w-16 shrink-0 rounded-2xl border border-sky-300 overflow-hidden shadow-xs">
                        <img src={donationPhoto} alt="Product" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setDonationPhoto(null)}
                          className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white hover:bg-slate-900"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                        <ImageIcon size={24} />
                      </div>
                    )}

                    <div className="flex gap-2 flex-1">
                      <label className="cursor-pointer rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-xs">
                        <UploadCloud size={15} className="text-sky-600" />
                        <span>Upload Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e, "DONATE")} />
                      </label>

                      <button
                        type="button"
                        onClick={() => startCamera("DONATE")}
                        className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Camera size={15} />
                        <span>Take Snapshot</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Food Package / Meal Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Home-Cooked Veg Meal (8 Portions) / Fresh Bread & Milk"
                    value={donationForm.name}
                    onChange={(e) => setDonationForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                      Food Category *
                    </label>
                    <select
                      required
                      value={donationForm.category_id}
                      onChange={(e) => setDonationForm(p => ({ ...p, category_id: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                      Quantity *
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        type="number"
                        min="1"
                        value={donationForm.quantity}
                        onChange={(e) => setDonationForm(p => ({ ...p, quantity: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                      />
                      <select
                        value={donationForm.unit}
                        onChange={(e) => setDonationForm(p => ({ ...p, unit: e.target.value }))}
                        className="rounded-xl border border-slate-200 px-2 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                      >
                        <option value="SERVING">Servings</option>
                        <option value="PACKET">Packets</option>
                        <option value="KG">KG</option>
                        <option value="BOX">Boxes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Consume / Pickup Expiry Deadline *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={donationForm.expiry_date}
                    onChange={(e) => setDonationForm(p => ({ ...p, expiry_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Home Pickup Address
                  </label>
                  <textarea
                    rows="2"
                    value={donationForm.pickup_address}
                    onChange={(e) => setDonationForm(p => ({ ...p, pickup_address: e.target.value }))}
                    placeholder="Enter home pickup address..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                    Storage & Special Handling Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Keep refrigerated, freshly prepared 2 hours ago"
                    value={donationForm.notes}
                    onChange={(e) => setDonationForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDonateModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDonation}
                    className="rounded-xl bg-sky-600 px-6 py-3 font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition"
                  >
                    {submittingDonation ? "Publishing..." : "Publish Home Food Donation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: PHOTO LIGHTBOX PREVIEW */}
        {photoLightbox && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative max-w-xl max-h-[85vh] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-2">
              <img src={photoLightbox} alt="Enlarged Food Product" className="max-h-[75vh] w-full object-contain rounded-2xl" />
              <button
                onClick={() => setPhotoLightbox(null)}
                className="absolute top-4 right-4 rounded-full bg-slate-950/80 p-2 text-white hover:bg-slate-950 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* LIVE CAMERA CAPTURE OVERLAY */}
        {cameraActive && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-slate-900 p-6 text-white space-y-4 text-center">
              <h3 className="text-base font-bold flex items-center justify-center gap-2">
                <Camera size={20} className="text-sky-400 animate-pulse" /> Take Food Product Snapshot
              </h3>
              
              <div className="relative overflow-hidden rounded-2xl bg-black border border-slate-800 aspect-video">
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="rounded-xl bg-sky-500 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-sky-400"
                >
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
