import {
  useState,
} from "react";

import {
  ArrowLeft,
  Barcode,
  Keyboard,
  ScanLine,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import BarcodeScannerModal from "../components/BarcodeScannerModal";

import DashboardLayout from "../components/DashboardLayout";


export default function BarcodeInventoryPage() {
  const navigate = useNavigate();

  const [scannerOpen, setScannerOpen] =
    useState(false);

  const [manualBarcode, setManualBarcode] =
    useState("");

  const [error, setError] =
    useState("");


  const navigation = [
    {
      label: "Dashboard",
      path: "/donor",
    },

    {
      label: "Inventory",
      path: "/inventory",
    },

    {
      label: "Barcode Scanner",
      path: "/donor/barcode",
    },
  ];


  function continueWithBarcode(
    barcode
  ) {
    const cleanedBarcode =
      String(
        barcode || ""
      ).trim();


    if (!cleanedBarcode) {
      setError(
        "Enter or scan a valid barcode."
      );

      return;
    }


    setScannerOpen(false);


    navigate(
      `/inventory?barcode=${encodeURIComponent(
        cleanedBarcode
      )}&openAdd=true`
    );
  }


  function handleManualSubmit(
    event
  ) {
    event.preventDefault();

    continueWithBarcode(
      manualBarcode
    );
  }


  return (
    <DashboardLayout
      title="Barcode Inventory"
      subtitle="Scan product barcodes and add food items to donor inventory."
      badge="Food Donor Workspace"
      quote="Fast inventory entry helps surplus food reach people sooner."
      navigation={navigation}
      activePath="/donor/barcode"
    >

      <section className="mx-auto max-w-4xl">

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}


        <div className="rounded-[32px] border border-white/80 bg-white/80 dark:bg-slate-900/80 p-8 shadow-[0_18px_50px_rgba(14,165,233,0.06)]">

          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">

            <Barcode size={32} />

          </div>


          <h2 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
            Add Inventory Using Barcode
          </h2>


          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            Scan the barcode printed on the food package.
            After scanning, Aura Food opens the existing inventory form where you can enter quantity, dates, pickup information and other required details.
          </p>


          <button
            type="button"
            onClick={() => {
              setError("");
              setScannerOpen(true);
            }}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-600 px-6 py-4 font-black text-white transition hover:bg-sky-700 shadow-md shadow-sky-600/20"
          >
            <ScanLine size={22} />

            Open Barcode Scanner
          </button>


          <div className="my-7 flex items-center gap-4">

            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />

            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Manual Entry
            </span>

            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />

          </div>


          <form
            onSubmit={handleManualSubmit}
          >

            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              Barcode Number
            </label>


            <div className="flex gap-3">

              <div className="relative flex-1">

                <Keyboard
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />


                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(event) => {
                    setManualBarcode(
                      event.target.value
                    );

                    setError("");
                  }}
                  placeholder="Enter barcode number"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 pl-11 pr-4 outline-none transition focus:border-sky-500 text-slate-900 dark:text-white"
                />

              </div>


              <button
                type="submit"
                className="rounded-2xl bg-slate-900 dark:bg-sky-600 px-6 py-3 font-bold text-white transition hover:bg-slate-800 dark:hover:bg-sky-700"
              >
                Continue
              </button>

            </div>

          </form>


          <button
            type="button"
            onClick={() =>
              navigate("/donor")
            }
            className="mt-7 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-sky-700 dark:hover:text-sky-400 transition"
          >
            <ArrowLeft size={17} />

            Back to Dashboard
          </button>

        </div>

      </section>


      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() =>
          setScannerOpen(false)
        }
        onDetected={
          continueWithBarcode
        }
      />

    </DashboardLayout>
  );
}