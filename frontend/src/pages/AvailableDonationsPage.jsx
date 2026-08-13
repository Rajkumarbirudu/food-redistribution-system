import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useTranslation } from "../context/LanguageContext";

export default function AvailableDonationsPage() {
  const { t } = useTranslation();
  const [donations, setDonations] = useState([]);
  const [error, setError] = useState("");
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimId, setClaimId] = useState(null);
  const [claimForm, setClaimForm] = useState({
    pickup_date: "",
    pickup_time: "",
    vehicle_number: "",
    driver_name: "",
    volunteer_name: "",
    special_instructions: "",
  });

  useEffect(() => {
    loadDonations();
  }, []);

  async function loadDonations() {
    try {
      const response = await api.get("/donations");
      const items = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];
      const available = items.filter(
        (d) =>
          ["AVAILABLE", "OPEN", "PENDING"].includes(String(d.status).toUpperCase()) &&
          !d.claimed_by
      );
      setDonations(available);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          t("Unable to load available donations.")
      );
    }
  }

  function openClaimModal(id) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const driverNames = ["Ramesh Kumar", "Suresh Singh", "Amit Sharma", "Vikram Patel", "Rajesh Gupta"];
    const volunteerNames = ["Karan Malhotra", "Rahul Verma", "Neha Joshi", "Sneha Roy", "Anjali Mehta"];
    const vehicleNumbers = ["TS-09-EA-4523", "DL-3C-BJ-8912", "MH-12-GP-3847", "KA-03-MM-7182", "HR-26-AQ-9011"];

    const randomDriver = driverNames[Math.floor(Math.random() * driverNames.length)];
    const randomVolunteer = volunteerNames[Math.floor(Math.random() * volunteerNames.length)];
    const randomVehicle = vehicleNumbers[Math.floor(Math.random() * vehicleNumbers.length)];

    setClaimForm({
      pickup_date: dateStr,
      pickup_time: "10:30 AM - 12:30 PM",
      vehicle_number: randomVehicle,
      driver_name: randomDriver,
      volunteer_name: randomVolunteer,
      special_instructions: "Please handle food packages with care. Drivers carry insulated thermal bags.",
    });

    setClaimId(id);
    setShowClaimModal(true);
  }

  async function submitClaim(e) {
    if (e) e.preventDefault();
    try {
      const payload = {
        ...claimForm,
        pickup_date: claimForm.pickup_date.includes("T")
          ? claimForm.pickup_date
          : `${claimForm.pickup_date}T12:00:00Z`,
      };
      await api.post(`/donations/${claimId}/claim`, payload);
      setShowClaimModal(false);
      loadDonations();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          t("Failed to claim donation.")
      );
    }
  }

  return (
    <DashboardLayout
      title={t("Available Surplus Food Donations")}
      subtitle={t("Browse surplus food items published by commercial donors and home kitchens ready for NGO pickup.")}
      badge={t("Surplus Marketplace")}
      navigation={[
        { label: t("Dashboard"), path: "/ngo" },
        { label: t("Available Donations"), path: "/ngo/available" },
        { label: t("My Claims"), path: "/ngo/claims" },
      ]}
      activePath="/ngo/available"
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {donations.map((donation) => (
          <article
            key={donation.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold">
              {t(donation.food_name)}
            </h3>

            <p className="mt-2 text-sm font-semibold text-sky-600">
              {donation.donor_organization_name}
            </p>

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p>
                {t("Quantity:")} {donation.quantity} {t(donation.unit)}
              </p>

              <p>{t("Expiry Date")}: {donation.expiry_date}</p>

              <p>{t("Address:")} {donation.pickup_address}</p>

              <p>{t("Pickup Time")}: {donation.pickup_time}</p>

              <p>{t("Contact")}: {donation.contact_person}</p>

              <p>{t("Phone Number")}: {donation.phone_number}</p>
            </div>

            <button
              type="button"
              onClick={() => openClaimModal(donation.id)}
              className="mt-6 w-full rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700 transition"
            >
              {t("Claim Donation")}
            </button>
          </article>
        ))}

        {!donations.length && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            {t("No available donations.")}
          </div>
        )}
      </div>

      {/* CLAIM DONATION MODAL */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/80 bg-white/95 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-md">
            <h2 className="text-2xl font-black text-slate-900">
              {t("Claim Surplus Food Donation")}
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-slate-500">
              Provide pickup logistics to schedule collection.
            </p>

            <form onSubmit={submitClaim} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    required
                    value={claimForm.pickup_date}
                    onChange={(e) =>
                      setClaimForm({
                        ...claimForm,
                        pickup_date: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    Pickup Time
                  </label>
                  <input
                    type="text"
                    required
                    value={claimForm.pickup_time}
                    onChange={(e) =>
                      setClaimForm({
                        ...claimForm,
                        pickup_time: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    required
                    value={claimForm.driver_name}
                    onChange={(e) =>
                      setClaimForm({
                        ...claimForm,
                        driver_name: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    required
                    value={claimForm.vehicle_number}
                    onChange={(e) =>
                      setClaimForm({
                        ...claimForm,
                        vehicle_number: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Volunteer Name
                </label>
                <input
                  type="text"
                  required
                  value={claimForm.volunteer_name}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      volunteer_name: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Special Instructions
                </label>
                <textarea
                  rows="3"
                  value={claimForm.special_instructions}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      special_instructions: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white hover:bg-sky-700 transition-all"
                >
                  Confirm Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}