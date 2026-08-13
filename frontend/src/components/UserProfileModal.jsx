import React, { useState, useEffect } from "react";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    full_name: "",
    organization_name: "",
    email: "",
    phone_number: "",
    address: "",
    aadhar_number: "",
    pan_number: "",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        organization_name: user.organization_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
        aadhar_number: user.aadhar_number || "",
        pan_number: user.pan_number || "",
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const initials = (formData.full_name || user.email || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile({
        full_name: formData.full_name,
        organization_name: formData.organization_name,
        phone_number: formData.phone_number,
        address: formData.address,
        aadhar_number: formData.aadhar_number,
        pan_number: formData.pan_number,
      });
      setSuccess(t("Profile updated successfully!") || "Profile updated successfully!");
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Profile update failed:", err);
      setError(err?.response?.data?.detail || err?.message || t("Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 font-black text-white text-lg shadow-md shadow-sky-600/20">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {t("User Profile & Account")}
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-black text-sky-800 uppercase">
                  {t(user.role?.replace("_", " "))}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {t("Manage your personal details, contact info and identity verification")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* VERIFICATION BADGES */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            <ShieldCheck size={15} />
            <span>{t("Aadhar Verified ✓")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            <FileCheck size={15} />
            <span>{t("PAN Card Verified ✓")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200">
            <CheckCircle2 size={15} />
            <span>{t("Mobile OTP Security ✓")}</span>
          </div>
        </div>

        {/* ERROR / SUCCESS ALERTS */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* PROFILE EDIT FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* FULL NAME */}
            <div>
              <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                {t("Full Name")} *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* HOUSEHOLD / ORG NAME */}
            <div>
              <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                {t("Organization Name")}
              </label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* EMAIL (READ-ONLY) */}
            <div>
              <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                {t("Email address")} ({t("Secure Login")})
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-8 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
                <Lock size={13} className="absolute right-3 top-3.5 text-slate-400" />
              </div>
            </div>

            {/* PHONE NUMBER */}
            <div>
              <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                {t("Phone Number")} *
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ADDRESS */}
          <div>
            <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
              {t("Address")} *
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* AADHAR NUMBER */}
            <div>
              <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                Aadhar Card Number
              </label>
              <div className="relative">
                <CreditCard size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* PAN NUMBER */}
            <div>
              <label className="block uppercase font-bold text-[10px] tracking-wider text-slate-400 mb-1">
                PAN Card Number
              </label>
              <div className="relative">
                <FileCheck size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {t("Cancel") || "Cancel"}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-black text-white hover:bg-sky-700 transition shadow-md shadow-sky-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? t("Saving...") || "Saving..." : t("Save Profile") || "Save Profile"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
