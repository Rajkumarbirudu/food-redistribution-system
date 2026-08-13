import { useEffect, useState } from "react";
import { Truck, ShieldAlert, Navigation, CheckCircle, Clock, AlertOctagon, User, Phone, MapPin } from "lucide-react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useTranslation } from "../context/LanguageContext";

export default function NgoClaimsPage() {
  const { t } = useTranslation();
  const [claims, setClaims] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Complaint modal state
  const [activeComplaintDonation, setActiveComplaintDonation] = useState(null);
  const [complaintType, setComplaintType] = useState("Coming Late");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    loadClaims();
  }, []);

  async function loadClaims() {
    try {
      const response = await api.get("/donations");
      const items = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];
      const claimed = items.filter(
        (d) => ["CLAIMED", "ASSIGNED", "IN_TRANSIT"].includes(String(d.status).toUpperCase())
      );
      setClaims(claimed);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to load claimed donations."
      );
    }
  }

  async function completeDonation(id) {
    try {
      await api.post(`/donations/${id}/complete`);
      setSuccess("Donation marked as completed!");
      await loadClaims();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to complete donation."
      );
    }
  }

  async function handleFileComplaint(e) {
    e.preventDefault();
    if (!complaintDesc.trim()) {
      setError("Please enter complaint details.");
      return;
    }

    setSubmittingComplaint(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/complaints", {
        donation_id: activeComplaintDonation.id || activeComplaintDonation._id,
        delivery_boy_id: activeComplaintDonation.delivery_boy_id || activeComplaintDonation.delivery_partner_id,
        title: complaintType,
        description: complaintDesc.trim()
      });
      setSuccess("Complaint submitted successfully to System Administrator.");
      setActiveComplaintDonation(null);
      setComplaintDesc("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit complaint.");
    } finally {
      setSubmittingComplaint(false);
    }
  }

  return (
    <DashboardLayout
      title={t("My Claims & Delivery Operations")}
      subtitle={t("Manage claimed surplus food shipments, view delivery partner details, track runs, and report issues.")}
      badge={t("Claim Management")}
      navigation={[
        { label: t("Dashboard"), path: "/ngo" },
        { label: t("Available Donations"), path: "/ngo/available" },
        { label: t("My Claims"), path: "/ngo/claims" },
      ]}
      activePath="/ngo/claims"
    >

      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700 flex items-center gap-2">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {claims.map((donation) => (
          <article
            key={donation.id || donation._id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black text-indigo-700 uppercase">
                    {donation.category_name || "Food Item"}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    {donation.food_name}
                  </h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  donation.status === "IN_TRANSIT"
                    ? "bg-amber-100 text-amber-800"
                    : donation.status === "ASSIGNED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}>
                  {donation.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600 font-semibold border-b border-slate-100 pb-4">
                <p><span className="text-slate-400 font-bold uppercase text-[10px]">Quantity:</span> {donation.quantity} {donation.unit}</p>
                <p className="flex items-start gap-1"><MapPin size={14} className="text-green-600 shrink-0 mt-0.5" /> <span>Pickup: {donation.pickup_address}</span></p>
                <p><span className="text-slate-400 font-bold uppercase text-[10px]">Donor Contact:</span> {donation.contact_person}</p>
              </div>

              {/* Delivery Partner Pickup Details Box */}
              <div className="mt-4 rounded-2xl border border-slate-100 bg-[#f8fafc] p-4 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Truck size={16} className="text-sky-600" /> Delivery Partner Pickup Details
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Driver / Transporter</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">
                      {donation.delivery_boy_name || donation.driver_name || "Pending Driver"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Vehicle Plate Number</p>
                    <p className="font-mono font-extrabold text-slate-900 mt-0.5">
                      {donation.vehicle_number || "Not assigned"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Scheduled Pickup</p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {donation.scheduled_pickup_time || donation.pickup_time || "12:00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Driver Contact</p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {donation.phone_number || "Available in Transit"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {["CLAIMED", "ASSIGNED", "IN_TRANSIT"].includes(donation.status) && (
              <div className="mt-6 space-y-2.5">
                <div className="flex gap-2">
                  <a
                    href={`/donations/${donation.id || donation._id}/track`}
                    className="flex-1 text-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1"
                  >
                    <Navigation size={14} /> Track Shipment
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveComplaintDonation(donation)}
                    className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition flex items-center justify-center gap-1"
                  >
                    <AlertOctagon size={14} /> Report Issue
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => completeDonation(donation.id || donation._id)}
                  className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-xs font-extrabold text-white hover:bg-sky-700 transition shadow-md shadow-sky-600/10"
                >
                  Mark as Received & Completed
                </button>
              </div>
            )}
          </article>
        ))}

        {!claims.length && (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 font-semibold">
            You have not claimed any surplus food donations yet.
          </div>
        )}
      </div>

      {/* Complaint Modal */}
      {activeComplaintDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="text-red-600" size={24} /> Report Delivery Partner Issue
            </h2>
            <p className="text-xs text-slate-500">
              Submit a complaint regarding delivery for item "<span className="font-bold text-slate-700">{activeComplaintDonation.food_name}</span>". This will flag system administrators to take compliance action.
            </p>

            <form onSubmit={handleFileComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Complaint Issue Category</label>
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
                  placeholder="Describe the delivery partner issue..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold focus:border-red-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveComplaintDonation(null)}
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
    </DashboardLayout>
  );
}