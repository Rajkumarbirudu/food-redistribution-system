import {
  useState,
  useRef,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import api from "../api/axios";


export default function CsvUploadModal({
  open,
  onClose,
  onSuccess,
  categories = [],
}) {
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState(null);

  const [status, setStatus] = useState("idle"); // idle, uploading, results

  const [uploadResult, setUploadResult] = useState(null);

  const [error, setError] = useState("");

  const [copiedId, setCopiedId] = useState("");

  const [showCategoryHelper, setShowCategoryHelper] = useState(false);


  if (!open) {
    return null;
  }


  // ============================================================
  // TEMPLATE DOWNLOADING
  // ============================================================

  function handleDownloadTemplate() {
    const headers = [
      "food_name",
      "category_id",
      "quantity",
      "unit",
      "manufacturing_date",
      "expiry_date",
      "pickup_address",
      "pickup_time",
      "contact_person",
      "phone_number",
      "barcode",
      "special_instructions",
    ];


    // Prefill category ID with the first available category if it exists.

    const defaultCategoryId =
      categories[0]?.id || "65c3ab21e4b0a1a2c3d4e5f6";


    const sampleRow = [
      "Fresh Apple Box",
      defaultCategoryId,
      "10.5",
      "BOX",
      new Date().toISOString().split("T")[0],
      new Date(Date.now() + 7 * 24 * 3600 * 1000)
        .toISOString()
        .split("T")[0],
      "123 Main Street, Community Hub",
      "10:00 AM - 02:00 PM",
      "John Doe",
      "9876543210",
      "1234567890123",
      "Store in cool area. Contact upon arrival.",
    ];


    const csvContent = [
      headers.join(","),
      sampleRow.join(","),
    ].join("\n");


    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.setAttribute("href", url);

    link.setAttribute(
      "download",
      "aura_food_bulk_import_template.csv"
    );

    link.style.visibility = "hidden";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  }


  // ============================================================
  // DRAG & DROP HANDLERS
  // ============================================================

  function handleDrag(event) {
    event.preventDefault();

    event.stopPropagation();


    if (
      event.type === "dragenter" ||
      event.type === "dragover"
    ) {
      setDragActive(true);
    } else if (
      event.type === "dragleave"
    ) {
      setDragActive(false);
    }
  }


  function handleDrop(event) {
    event.preventDefault();

    event.stopPropagation();

    setDragActive(false);


    const droppedFile =
      event.dataTransfer?.files?.[0];


    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }


  function handleFileSelect(event) {
    const selectedFile =
      event.target?.files?.[0];


    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }


  function validateAndSetFile(
    selectedFile
  ) {
    setError("");

    setUploadResult(null);


    const name =
      selectedFile.name || "";


    if (
      !name.toLowerCase().endsWith(".csv")
    ) {
      setError(
        "Only CSV files are allowed."
      );

      setFile(null);

      return;
    }


    if (
      selectedFile.size >
      5 * 1024 * 1024
    ) {
      setError(
        "CSV file exceeds the 5 MB size limit."
      );

      setFile(null);

      return;
    }


    setFile(selectedFile);
  }


  // ============================================================
  // SUBMIT FILE
  // ============================================================

  async function handleUpload() {
    if (!file) {
      setError("Please select a file first.");

      return;
    }


    setStatus("uploading");

    setError("");


    const formData = new FormData();

    formData.append("file", file);


    try {
      const response =
        await api.post(
          "/inventory/import-csv",
          formData
        );


      console.log(
        "CSV IMPORT RESPONSE:",
        response.data
      );


      setUploadResult(response.data);

      setStatus("results");


      if (
        response.data.imported_count > 0
      ) {
        // Trigger parent callback to refresh inventory list

        onSuccess?.();
      }

    } catch (uploadError) {
      console.error(
        "CSV UPLOAD ERROR:",
        uploadError
      );


      setStatus("idle");


      setError(
        uploadError?.response?.data
          ?.detail ||
          uploadError.message ||
          "Unable to upload CSV file."
      );
    }
  }


  // ============================================================
  // COPY ID HELPER
  // ============================================================

  function handleCopyId(id) {
    navigator.clipboard.writeText(id);

    setCopiedId(id);


    window.setTimeout(() => {
      setCopiedId("");
    }, 2000);
  }


  // ============================================================
  // RESET & CLOSE
  // ============================================================

  function handleReset() {
    setFile(null);

    setStatus("idle");

    setUploadResult(null);

    setError("");
  }


  function handleClose() {
    handleReset();

    onClose();
  }


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl">
        
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 p-6 lg:p-7">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Bulk CSV Import
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload multiple food items directly to inventory.
            </p>
          </div>


          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition"
          >
            <X size={22} />
          </button>
        </div>


        {/* SCROLLABLE CONTENT */}

        <div className="flex-1 overflow-y-auto p-6 lg:p-7">
          
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p className="font-bold text-sm">
                {error}
              </p>
            </div>
          )}


          {status === "idle" && (
            <div className="space-y-6">
              
              {/* UPLOAD ZONE */}

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className={`relative flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed py-12 px-6 text-center cursor-pointer transition duration-300 ${
                  dragActive
                    ? "border-sky-500 bg-sky-50/50 scale-[0.99]"
                    : "border-slate-200 bg-slate-50/50 hover:border-sky-400 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />


                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 mb-4 transition duration-300 group-hover:scale-110">
                  <Upload size={26} />
                </div>


                {file ? (
                  <div>
                    <p className="font-black text-slate-900 break-all">
                      {file.name}
                    </p>

                    <p className="mt-1.5 text-xs font-bold text-slate-400">
                      {(
                        file.size /
                        (1024 * 1024)
                      ).toFixed(2)}{" "}
                      MB • Click or drag to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-black text-slate-800">
                      Drag & drop your CSV file here
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      or click to browse your files
                    </p>

                    <p className="mt-3 text-xs font-bold text-slate-400">
                      Maximum file size: 5 MB
                    </p>
                  </div>
                )}
              </div>


              {/* ACTIONS: DOWNLOAD TEMPLATE */}

              <div className="flex flex-col gap-3 sm:flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                    <FileText size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-800">
                      Need a CSV Template?
                    </p>

                    <p className="text-xs text-slate-500">
                      Download our template with pre-formatted headers.
                    </p>
                  </div>
                </div>


                <button
                  type="button"
                  onClick={
                    handleDownloadTemplate
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Download size={14} />

                  Download Template
                </button>
              </div>


              {/* CATEGORY HELPER ACCORDION */}

              <div className="rounded-2xl border border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setShowCategoryHelper(
                      !showCategoryHelper
                    )
                  }
                  className="flex w-full items-center justify-between p-4 text-left font-black text-slate-800"
                >
                  <span className="text-sm">
                    View Category IDs for CSV Setup
                  </span>

                  {showCategoryHelper ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>


                {showCategoryHelper && (
                  <div className="border-t border-slate-100 p-4">
                    <p className="text-xs text-slate-500 leading-5 mb-3">
                      Copy the correct 24-character Category ID and paste it into the <code>category_id</code> column in your CSV.
                    </p>


                    <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                      {categories.map(
                        (category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"
                          >
                            <span className="font-black text-slate-800">
                              {category.name}
                            </span>


                            <div className="flex items-center gap-2">
                              <code className="font-mono text-slate-600 bg-white border border-slate-100 px-2 py-1 rounded">
                                {category.id}
                              </code>


                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyId(
                                    category.id
                                  )
                                }
                                className={`p-1.5 rounded transition ${
                                  copiedId ===
                                  category.id
                                    ? "text-sky-700 bg-sky-50"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {copiedId ===
                                category.id ? (
                                  <Check
                                    size={13}
                                  />
                                ) : (
                                  <Copy
                                    size={13}
                                  />
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      )}


                      {categories.length ===
                        0 && (
                        <p className="text-center py-4 text-xs font-bold text-slate-400">
                          No active food categories found.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}


          {/* UPLOADING STATE */}

          {status === "uploading" && (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <Loader2
                size={40}
                className="animate-spin text-sky-600 mb-4"
              />

              <p className="font-black text-slate-800">
                Processing your CSV...
              </p>

              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Parsing records, validating fields and saving items to inventory. Please wait.
              </p>
            </div>
          )}


          {/* RESULTS STATE */}

          {status === "results" &&
            uploadResult && (
              <div className="space-y-6">
                
                {/* METRICS */}

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
                    <p className="text-xs font-bold text-emerald-600 uppercase">
                      Imported
                    </p>

                    <p className="mt-1 text-2xl font-black text-emerald-950">
                      {
                        uploadResult.imported_count
                      }
                    </p>
                  </div>


                  <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
                    <p className="text-xs font-bold text-red-600 uppercase">
                      Failed
                    </p>

                    <p className="mt-1 text-2xl font-black text-red-950">
                      {
                        uploadResult.failed_count
                      }
                    </p>
                  </div>


                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Total Rows
                    </p>

                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {
                        uploadResult.total_rows
                      }
                    </p>
                  </div>
                </div>


                {/* SUMMARY MESSAGE */}

                <div
                  className={`flex items-start gap-3 rounded-2xl p-4 border ${
                    uploadResult.failed_count ===
                    0
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                      : uploadResult.imported_count ===
                        0
                      ? "bg-red-50 border-red-100 text-red-800"
                      : "bg-amber-50 border-amber-100 text-amber-800"
                  }`}
                >
                  {uploadResult.failed_count ===
                  0 ? (
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                  ) : (
                    <AlertCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-red-600"
                    />
                  )}


                  <div>
                    <p className="font-black text-sm">
                      {uploadResult.message}
                    </p>
                  </div>
                </div>


                {/* ERROR LIST */}

                {uploadResult.errors &&
                  uploadResult.errors
                    .length > 0 && (
                    <div className="rounded-[22px] border border-slate-100 bg-white">
                      <div className="border-b border-slate-100 bg-slate-50/50 py-3 px-4 rounded-t-[22px]">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Detailed Error Log
                        </h4>
                      </div>


                      <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100">
                        {uploadResult.errors.map(
                          (err, index) => (
                            <div
                              key={index}
                              className="p-3 text-xs flex items-start gap-3"
                            >
                              <span className="rounded bg-red-100 text-red-800 font-bold px-1.5 py-0.5 shrink-0">
                                Row {err.row}
                              </span>

                              <p className="text-slate-600 leading-5">
                                {err.error}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

              </div>
            )}

        </div>


        {/* FOOTER */}

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
          {status === "results" ? (
            <button
              type="button"
              onClick={handleReset}
              className="h-11 rounded-xl bg-slate-900 px-5 font-black text-sm text-white hover:bg-slate-800 transition"
            >
              Upload Another File
            </button>
          ) : (
            <button
              type="button"
              disabled={
                !file ||
                status === "uploading"
              }
              onClick={handleUpload}
              className="h-11 rounded-xl bg-sky-600 px-6 font-black text-sm text-white hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Import
            </button>
          )}


          <button
            type="button"
            disabled={status === "uploading"}
            onClick={handleClose}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 font-black text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
