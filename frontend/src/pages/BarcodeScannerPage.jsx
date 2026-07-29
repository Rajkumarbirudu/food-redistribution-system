import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Barcode,
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  LayoutDashboard,
  Loader2,
  PackageOpen,
  RefreshCw,
  ScanLine,
  XCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  BrowserMultiFormatReader,
} from "@zxing/browser";

import {
  DecodeHintType,
  BarcodeFormat,
} from "@zxing/library";

import DashboardLayout from "../components/DashboardLayout";
import { useTranslation } from "../context/LanguageContext";



const VIDEO_ID = "aura-food-barcode-video";


function cleanBarcode(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "");
}


function getCameraErrorMessage(error) {
  const name = String(error?.name || "");

  const message = String(
    error?.message ||
    error ||
    ""
  );


  console.error(
    "BARCODE SCANNER ERROR:",
    error
  );


  if (
    name === "NotAllowedError" ||
    message.includes("Permission denied")
  ) {
    return (
      "Camera permission was denied. " +
      "Allow camera permission in your browser and reload Aura Food."
    );
  }


  if (
    name === "NotFoundError" ||
    message.includes(
      "Requested device not found"
    )
  ) {
    return (
      "No camera was detected."
    );
  }


  if (
    name === "NotReadableError" ||
    message.includes(
      "Could not start video source"
    )
  ) {
    return (
      "Camera is already being used by another application."
    );
  }


  if (
    name === "SecurityError"
  ) {
    return (
      "Camera access requires localhost or HTTPS."
    );
  }


  return (
    message ||
    "Unable to start barcode scanner."
  );
}


function findPreferredCamera(devices) {
  if (
    !Array.isArray(devices) ||
    devices.length === 0
  ) {
    return null;
  }


  const rearCamera =
    devices.find((device) => {
      const label = String(
        device?.label || ""
      )
        .toLowerCase()
        .trim();


      return (
        label.includes("back") ||
        label.includes("rear") ||
        label.includes("environment")
      );
    });


  return (
    rearCamera ||
    devices[0]
  );
}


export default function BarcodeScannerPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();



  const controlsRef = useRef(null);

  const mountedRef = useRef(true);

  const startingRef = useRef(false);

  const detectedRef = useRef(false);


  const [cameras, setCameras] =
    useState([]);


  const [
    selectedCameraId,
    setSelectedCameraId,
  ] = useState("");


  const [
    manualBarcode,
    setManualBarcode,
  ] = useState("");


  const [
    scannedBarcode,
    setScannedBarcode,
  ] = useState("");


  const [
    detectedFormat,
    setDetectedFormat,
  ] = useState("");


  const [
    loadingCameras,
    setLoadingCameras,
  ] = useState(false);


  const [
    starting,
    setStarting,
  ] = useState(false);


  const [
    scanning,
    setScanning,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const navigation = [
    {
      label: "Dashboard",
      path: "/donor",
      icon: LayoutDashboard,
    },

    {
      label: "Inventory",
      path: "/inventory",
      icon: PackageOpen,
    },

    {
      label: "Barcode Scanner",
      path: "/donor/barcode",
      icon: Barcode,
    },
  ];


  // ============================================================
  // STOP SCANNER
  // ============================================================

  const stopScanner =
    useCallback(() => {
      console.log(
        "STOPPING BARCODE SCANNER"
      );


      try {
        controlsRef.current?.stop();
      } catch (stopError) {
        console.warn(
          "SCANNER STOP ERROR:",
          stopError
        );
      }


      controlsRef.current = null;


      const video =
        document.getElementById(
          VIDEO_ID
        );


      if (video) {
        const stream =
          video.srcObject;


        if (stream) {
          try {
            stream
              .getTracks()
              .forEach((track) => {
                track.stop();
              });

          } catch (streamError) {
            console.warn(
              "CAMERA TRACK STOP ERROR:",
              streamError
            );
          }
        }


        video.srcObject = null;
      }


      if (mountedRef.current) {
        setScanning(false);

        setStarting(false);
      }
    }, []);


  // ============================================================
  // LOAD CAMERAS
  // ============================================================

  const loadCameras =
    useCallback(async () => {
      setLoadingCameras(true);

      setError("");


      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          throw new Error(
            "Your browser does not support camera access."
          );
        }


        if (
          !window.isSecureContext &&
          window.location.hostname !==
            "localhost" &&
          window.location.hostname !==
            "127.0.0.1"
        ) {
          throw new Error(
            "Camera access requires localhost or HTTPS."
          );
        }


        /*
         * Request permission first.
         *
         * This allows Chrome to expose
         * the actual camera labels.
         */

        const permissionStream =
          await navigator
            .mediaDevices
            .getUserMedia({
              video: true,
              audio: false,
            });


        permissionStream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });


        const devices =
          await BrowserMultiFormatReader
            .listVideoInputDevices();


        console.log(
          "AVAILABLE CAMERAS:",
          devices
        );


        if (
          !Array.isArray(devices) ||
          devices.length === 0
        ) {
          throw new Error(
            "No camera was detected."
          );
        }


        const preferredCamera =
          findPreferredCamera(
            devices
          );


        if (mountedRef.current) {
          setCameras(devices);


          setSelectedCameraId(
            preferredCamera.deviceId
          );
        }


        return devices;

      } catch (cameraError) {
        console.error(
          "LOAD CAMERAS ERROR:",
          cameraError
        );


        if (mountedRef.current) {
          setCameras([]);

          setSelectedCameraId("");

          setError(
            getCameraErrorMessage(
              cameraError
            )
          );
        }


        return [];

      } finally {
        if (mountedRef.current) {
          setLoadingCameras(false);
        }
      }
    }, []);


  // ============================================================
  // SUCCESSFUL SCAN
  // ============================================================

  const handleSuccessfulScan =
    useCallback(
      (
        result,
        controls
      ) => {
        if (
          detectedRef.current ||
          !result
        ) {
          return;
        }


        const barcode =
          cleanBarcode(
            result.getText()
          );


        if (!barcode) {
          return;
        }


        detectedRef.current = true;


        let formatName = "";


        try {
          formatName =
            String(
              result.getBarcodeFormat()
            );

        } catch {
          formatName = "";
        }


        console.log(
          "================================"
        );

        console.log(
          "BARCODE DETECTED:",
          barcode
        );

        console.log(
          "BARCODE FORMAT:",
          formatName
        );

        console.log(
          "================================"
        );


        try {
          controls?.stop();
        } catch {
          // Ignore.
        }


        controlsRef.current = null;


        if (mountedRef.current) {
          setScannedBarcode(
            barcode
          );

          setManualBarcode(
            barcode
          );

          setDetectedFormat(
            formatName
          );

          setScanning(false);

          setStarting(false);

          setError("");
        }
      },

      []
    );


  // ============================================================
  // START SCANNER
  // ============================================================

  const startScanner =
    useCallback(async () => {
      if (
        startingRef.current ||
        scanning
      ) {
        return;
      }


      startingRef.current = true;

      detectedRef.current = false;


      setStarting(true);

      setError("");

      setScannedBarcode("");

      setDetectedFormat("");


      try {
        stopScanner();


        let cameraId =
          selectedCameraId;


        if (!cameraId) {
          const devices =
            await loadCameras();


          if (
            !Array.isArray(devices) ||
            devices.length === 0
          ) {
            throw new Error(
              "No camera is available."
            );
          }


          const preferredCamera =
            findPreferredCamera(
              devices
            );


          cameraId =
            preferredCamera.deviceId;


          if (mountedRef.current) {
            setSelectedCameraId(
              cameraId
            );
          }
        }


        await new Promise(
          (resolve) => {
            window.setTimeout(
              resolve,
              150
            );
          }
        );


        const video =
          document.getElementById(
            VIDEO_ID
          );


        if (!video) {
          throw new Error(
            "Barcode scanner video element was not found."
          );
        }


        video.muted = true;

        video.playsInline = true;


        /*
         * Optimize barcode detection speed by restricting formats
         * strictly to standard 1D product barcodes (EAN-13, EAN-8, UPC-A, UPC-E, etc.).
         * This bypasses the heavy CPU load of scanning for QR codes, Data Matrix, and PDF417.
         */
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.CODABAR,
          BarcodeFormat.ITF
        ]);

        const reader =
          new BrowserMultiFormatReader(
            hints,
            {
              delayBetweenScanAttempts:
                50,

              delayBetweenScanSuccess:
                500,
            }
          );


        console.log(
          "STARTING ZXING SCANNER"
        );

        console.log(
          "CAMERA ID:",
          cameraId
        );


        const controls =
          await reader
            .decodeFromVideoDevice(
              cameraId,

              video,

              (
                result,
                decodeError,
                callbackControls
              ) => {
                /*
                 * Store scanner controls.
                 */

                if (
                  callbackControls &&
                  !controlsRef.current
                ) {
                  controlsRef.current =
                    callbackControls;
                }


                if (result) {
                  handleSuccessfulScan(
                    result,
                    callbackControls
                  );

                  return;
                }


                /*
                 * Do not log every
                 * decode failure.
                 *
                 * No barcode in a frame
                 * is normal while scanning.
                 */
              }
            );


        controlsRef.current =
          controls;


        if (mountedRef.current) {
          setScanning(true);

          setStarting(false);
        }

      } catch (scannerError) {
        console.error(
          "START SCANNER ERROR:",
          scannerError
        );


        stopScanner();


        if (mountedRef.current) {
          setError(
            getCameraErrorMessage(
              scannerError
            )
          );
        }

      } finally {
        startingRef.current = false;


        if (mountedRef.current) {
          setStarting(false);
        }
      }
    }, [
      handleSuccessfulScan,
      loadCameras,
      scanning,
      selectedCameraId,
      stopScanner,
    ]);


  // ============================================================
  // CAMERA CHANGE
  // ============================================================

  function handleCameraChange(
    event
  ) {
    stopScanner();


    setSelectedCameraId(
      event.target.value
    );

    setScannedBarcode("");

    setDetectedFormat("");

    setError("");
  }


  // ============================================================
  // CONTINUE TO INVENTORY
  // ============================================================

  function continueToInventory(
    barcodeValue
  ) {
    const barcode =
      cleanBarcode(
        barcodeValue
      );


    if (!barcode) {
      setError(
        "Scan a barcode or enter the barcode manually."
      );

      return;
    }


    stopScanner();


    navigate(
      `/inventory?barcode=${encodeURIComponent(
        barcode
      )}&openForm=true`
    );
  }


  // ============================================================
  // MANUAL SUBMIT
  // ============================================================

  function handleManualSubmit(
    event
  ) {
    event.preventDefault();


    continueToInventory(
      manualBarcode
    );
  }


  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    mountedRef.current = true;


    return () => {
      mountedRef.current = false;


      try {
        controlsRef.current?.stop();
      } catch {
        // Ignore.
      }


      controlsRef.current = null;


      const video =
        document.getElementById(
          VIDEO_ID
        );


      if (
        video &&
        video.srcObject
      ) {
        try {
          video.srcObject
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

        } catch {
          // Ignore.
        }


        video.srcObject = null;
      }
    };
  }, []);


  // ============================================================
  // UI
  // ============================================================

  return (
    <DashboardLayout
      title="Barcode Scanner"
      subtitle="Scan packaged food barcodes and continue directly to inventory registration."
      badge="Food Donor Workspace"
      quote="Faster inventory registration helps good food reach people sooner."
      navigation={navigation}
      activePath="/donor/barcode"
    >

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

          <XCircle
            size={20}
            className="mt-0.5 shrink-0"
          />


          <div>

            <p className="font-bold">
              {error}
            </p>


            <p className="mt-1 text-sm">
              Manual barcode entry is still available.
            </p>

          </div>

        </div>
      )}


      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">


        {/* ====================================================
            CAMERA SECTION
        ==================================================== */}

        <div className="rounded-[30px] border border-white/80 bg-white/80 p-6 shadow-[0_18px_55px_rgba(15,118,110,0.08)] backdrop-blur-xl lg:p-8">


          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">


            <div className="flex items-center gap-3">


              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">

                <ScanLine
                  size={24}
                />

              </div>


              <div>

                <h2 className="text-2xl font-black text-slate-900">
                  Camera Barcode Scanner
                </h2>


                <p className="mt-1 text-sm text-slate-500">
                  Scan packaged food barcodes using your device camera.
                </p>

              </div>

            </div>


            <button
              type="button"
              disabled={
                loadingCameras ||
                starting ||
                scanning
              }
              onClick={
                loadCameras
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loadingCameras ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw
                  size={17}
                />
              )}


              {loadingCameras
                ? "Detecting..."
                : "Detect Cameras"}

            </button>

          </div>


          {/* CAMERA SELECTOR */}

          {cameras.length > 0 && (
            <div className="mt-6">

              <label className="text-sm font-black text-slate-700">
                Select Camera
              </label>


              <select
                value={
                  selectedCameraId
                }
                onChange={
                  handleCameraChange
                }
                disabled={
                  scanning ||
                  starting
                }
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
              >

                {cameras.map(
                  (
                    camera,
                    index
                  ) => (
                    <option
                      key={
                        camera.deviceId
                      }
                      value={
                        camera.deviceId
                      }
                    >

                      {camera.label ||
                        `Camera ${index + 1}`}

                    </option>
                  )
                )}

              </select>

            </div>
          )}


          {/* CAMERA PREVIEW */}

          <div className="relative mt-6 min-h-[420px] overflow-hidden rounded-[26px] border border-slate-200 bg-black">


            <video
              id={VIDEO_ID}
              autoPlay
              muted
              playsInline
              className="h-[420px] w-full object-contain"
            />


            {scanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">


                <div className="relative h-[210px] w-[94%] max-w-[650px] rounded-2xl border-2 border-emerald-400">


                  <div className="absolute left-4 right-4 top-1/2 h-[2px] -translate-y-1/2 bg-emerald-400" />


                  <p className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-4 py-2 text-xs font-black text-white">

                    Keep complete barcode visible

                  </p>

                </div>

              </div>
            )}


            {!scanning &&
              !starting && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 text-center">

                  <CameraOff
                    size={50}
                    className="text-slate-500"
                  />


                  <p className="mt-4 font-black text-white">
                    Camera is not running
                  </p>


                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Detect available cameras and press Start Camera.
                  </p>

                </div>
              )}


            {starting && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">

                <Loader2
                  size={42}
                  className="animate-spin text-emerald-400"
                />


                <p className="mt-4 font-black text-white">
                  Starting scanner...
                </p>

              </div>
            )}

          </div>


          {/* CAMERA BUTTON */}

          <div className="mt-5">

            {!scanning ? (

              <button
                type="button"
                disabled={
                  starting ||
                  loadingCameras
                }
                onClick={
                  startScanner
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {starting ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Camera
                    size={18}
                  />
                )}


                {starting
                  ? "Starting..."
                  : "Start Camera"}

              </button>

            ) : (

              <button
                type="button"
                onClick={
                  stopScanner
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 font-black text-red-700 transition hover:bg-red-100"
              >

                <CameraOff
                  size={18}
                />

                Stop Camera

              </button>

            )}

          </div>


          {/* TIPS */}

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

            <p className="text-sm font-black text-emerald-900">
              Scanning instructions
            </p>


            <p className="mt-2 text-sm leading-6 text-emerald-800">
              Keep the entire barcode visible in the camera preview. Hold the product approximately 20–50 cm from a laptop webcam and slowly change the distance until the barcode lines are sharp. Use good lighting and avoid glare.
            </p>

          </div>

        </div>


        {/* ====================================================
            RIGHT COLUMN
        ==================================================== */}

        <div className="space-y-6">


          {/* SUCCESS */}

          {scannedBarcode && (
            <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">


              <div className="flex items-center gap-3">


                <CheckCircle2
                  size={25}
                  className="text-emerald-700"
                />


                <div>

                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600">
                    Scan Successful
                  </p>


                  <h3 className="mt-1 text-xl font-black text-slate-900">
                    Barcode Detected
                  </h3>

                </div>

              </div>


              <div className="mt-5 rounded-2xl bg-white p-4">

                <p className="text-xs font-bold text-slate-400">
                  BARCODE VALUE
                </p>


                <p className="mt-2 break-all text-xl font-black text-slate-900">
                  {scannedBarcode}
                </p>


                {detectedFormat && (
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    Format ID: {detectedFormat}
                  </p>
                )}

              </div>


              <button
                type="button"
                onClick={() =>
                  continueToInventory(
                    scannedBarcode
                  )
                }
                className="mt-5 h-12 w-full rounded-xl bg-emerald-700 px-5 font-black text-white transition hover:bg-emerald-800"
              >

                Add to Inventory

              </button>

            </div>
          )}


          {/* MANUAL INPUT */}

          <div className="rounded-[30px] border border-white/80 bg-white/80 p-6 shadow-[0_18px_55px_rgba(15,118,110,0.08)] backdrop-blur-xl">


            <div className="flex items-center gap-3">


              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">

                <Keyboard
                  size={21}
                />

              </div>


              <div>

                <h3 className="text-xl font-black text-slate-900">
                  Manual Barcode
                </h3>


                <p className="text-sm text-slate-500">
                  Enter the barcode if camera scanning is unavailable.
                </p>

              </div>

            </div>


            <form
              onSubmit={
                handleManualSubmit
              }
              className="mt-6"
            >


              <label className="text-sm font-black text-slate-700">
                Barcode Number
              </label>


              <input
                required
                value={
                  manualBarcode
                }
                onChange={
                  (event) => {
                    setManualBarcode(
                      event.target.value
                    );

                    setError("");
                  }
                }
                placeholder="Example: 8901234567890"
                inputMode="numeric"
                autoComplete="off"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />


              <button
                type="submit"
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 font-black text-white transition hover:bg-emerald-800"
              >

                <Barcode
                  size={18}
                />

                Continue to Inventory

              </button>

            </form>

          </div>

        </div>

      </section>

    </DashboardLayout>
  );
}