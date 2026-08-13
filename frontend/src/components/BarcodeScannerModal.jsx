import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  Keyboard,
  ScanLine,
  X,
} from "lucide-react";


export default function BarcodeScannerModal({
  open,
  onClose,
  onDetected,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const detectorRef = useRef(null);
  const frameRef = useRef(null);

  const [manualBarcode, setManualBarcode] =
    useState("");

  const [error, setError] =
    useState("");

  const [starting, setStarting] =
    useState(false);


  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    setManualBarcode("");
    setError("");

    startCamera();

    return () => {
      stopCamera();
    };
  }, [open]);


  function stopCamera() {
    scanningRef.current = false;

    if (frameRef.current) {
      cancelAnimationFrame(
        frameRef.current
      );

      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    detectorRef.current = null;
  }


  async function startCamera() {
    stopCamera();

    setStarting(true);
    setError("");

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }


      if (
        typeof window.BarcodeDetector ===
        "undefined"
      ) {
        throw new Error(
          "Automatic barcode scanning is not supported by this browser. Use manual barcode entry."
        );
      }


      const supportedFormats =
        await window.BarcodeDetector
          .getSupportedFormats();


      const requestedFormats = [
        "ean_13",
        "ean_8",
        "upc_a",
        "upc_e",
        "code_128",
        "code_39",
        "itf",
      ].filter((format) =>
        supportedFormats.includes(format)
      );


      detectorRef.current =
        new window.BarcodeDetector({
          formats:
            requestedFormats.length > 0
              ? requestedFormats
              : supportedFormats,
        });


      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: {
                ideal: "environment",
              },

              width: {
                ideal: 1280,
              },

              height: {
                ideal: 720,
              },
            },

            audio: false,
          });


      streamRef.current = stream;


      if (!videoRef.current) {
        stopCamera();
        return;
      }


      videoRef.current.srcObject =
        stream;


      await videoRef.current.play();


      scanningRef.current = true;

      frameRef.current =
        requestAnimationFrame(
          scanLoop
        );

    } catch (cameraError) {
      console.error(
        "BARCODE CAMERA ERROR:",
        cameraError
      );

      stopCamera();

      setError(
        cameraError.message ||
          "Unable to start barcode scanner."
      );

    } finally {
      setStarting(false);
    }
  }


  async function scanLoop() {
    if (
      !scanningRef.current ||
      !detectorRef.current ||
      !videoRef.current
    ) {
      return;
    }


    try {
      if (
        videoRef.current.readyState >= 2
      ) {
        const barcodes =
          await detectorRef.current.detect(
            videoRef.current
          );


        if (
          Array.isArray(barcodes) &&
          barcodes.length > 0
        ) {
          const barcode =
            String(
              barcodes[0]?.rawValue || ""
            ).trim();


          if (barcode) {
            handleDetected(barcode);
            return;
          }
        }
      }

    } catch (detectionError) {
      console.error(
        "BARCODE DETECTION ERROR:",
        detectionError
      );
    }


    if (scanningRef.current) {
      frameRef.current =
        requestAnimationFrame(
          scanLoop
        );
    }
  }


  function handleDetected(barcode) {
    const cleanedBarcode =
      String(barcode || "").trim();

    if (!cleanedBarcode) {
      return;
    }

    stopCamera();

    onDetected(cleanedBarcode);
  }


  function handleManualSubmit(event) {
    event.preventDefault();

    const cleanedBarcode =
      manualBarcode.trim();

    if (!cleanedBarcode) {
      setError(
        "Enter a barcode number."
      );

      return;
    }

    handleDetected(
      cleanedBarcode
    );
  }


  function handleClose() {
    stopCamera();

    setManualBarcode("");
    setError("");

    onClose();
  }


  if (!open) {
    return null;
  }


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">

      <div className="w-full max-w-xl overflow-hidden rounded-[30px] bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-100 p-6">

          <div>

            <h2 className="text-xl font-black text-slate-900">
              Scan Food Barcode
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Scan a barcode or enter the number manually.
            </p>

          </div>


          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={22} />
          </button>

        </div>


        <div className="p-6">

          {error && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {error}
            </div>
          )}


          <div className="relative overflow-hidden rounded-[24px] bg-slate-950">

            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-video w-full object-cover"
            />


            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

              <div className="flex h-36 w-[80%] items-center justify-center rounded-2xl border-2 border-white/90">

                <ScanLine
                  size={42}
                  className="text-white"
                />

              </div>

            </div>


            {starting && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 font-bold text-white">
                Starting camera...
              </div>
            )}

          </div>


          <button
            type="button"
            onClick={startCamera}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 font-bold text-sky-700 transition hover:bg-sky-100"
          >
            <Camera size={18} />

            Restart Camera
          </button>


          <div className="my-6 flex items-center gap-4">

            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Or enter manually
            </span>

            <div className="h-px flex-1 bg-slate-200" />

          </div>


          <form
            onSubmit={handleManualSubmit}
          >

            <label className="mb-2 block text-sm font-bold text-slate-700">
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
                  placeholder="Example: 8901234567890"
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-sky-500"
                />

              </div>


              <button
                type="submit"
                className="rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white transition hover:bg-sky-700"
              >
                Continue
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}