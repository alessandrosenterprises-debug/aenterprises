"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  RotateCcw,
  X,
} from "lucide-react";

interface LoanTerm {
  id: string;
  loan_product_id: string;
  period_days: number;
  interest_rate: number;
  active: boolean;
}

interface LoanProduct {
  id: string;
  name: string;
  description: string | null;
  min_amount: number | null;
  max_amount: number | null;
  requires_collateral: boolean;
  terms: LoanTerm[];
}

interface Collateral {
  id: string;
  name: string;
  description: string | null;
}

interface CustomerLoanApplicationFormProps {
  businessSlug: string;
  products: LoanProduct[];
  collaterals: Collateral[];
}

interface CustomerProfile {
  customer_id?: string;
  customer?: {
    id?: string;
  } | null;
  profile?: {
    customer_id?: string;
  } | null;
  id?: string;
}

type FormStep = 1 | 2 | 3;

type CameraTarget =
  | "nrcFront"
  | "nrcBack"
  | "selfie"
  | null;

interface CapturedImage {
  file: File;
  preview: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
  }).format(value);

const today = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + days);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0",
  )}`;
};

const getCustomerId = (data: CustomerProfile | null) =>
  data?.customer_id ??
  data?.customer?.id ??
  data?.profile?.customer_id ??
  data?.id ??
  "";

export default function CustomerLoanApplicationForm({
  businessSlug,
  products,
  collaterals,
}: CustomerLoanApplicationFormProps) {
  const [step, setStep] = useState<FormStep>(1);

  const [customerId, setCustomerId] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  const [productId, setProductId] = useState("");
  const [termId, setTermId] = useState("");

  const [applicationDate, setApplicationDate] =
    useState(today());

  const [principal, setPrincipal] = useState("");

  const [residentialAddress, setResidentialAddress] =
    useState("");

  const [nextOfKinName, setNextOfKinName] =
    useState("");

  const [nextOfKinRelationship, setNextOfKinRelationship] =
    useState("");

  const [nextOfKinPhone, setNextOfKinPhone] =
    useState("");

  const [collateralId, setCollateralId] = useState("");

  const [collateralWorth, setCollateralWorth] =
    useState("");

  const [notes, setNotes] = useState("");

  const [nrcFront, setNrcFront] =
    useState<CapturedImage | null>(null);

  const [nrcBack, setNrcBack] =
    useState<CapturedImage | null>(null);

  const [selfie, setSelfie] =
    useState<CapturedImage | null>(null);

  const [cameraTarget, setCameraTarget] =
    useState<CameraTarget>(null);

  const [cameraError, setCameraError] =
    useState("");

  const [cameraReady, setCameraReady] =
    useState(false);

  const [error, setError] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [applicationNumber, setApplicationNumber] =
    useState("");

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  /*
   * Load authenticated customer profile.
   */
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);

        const response = await fetch(
          "/api/customer/profile",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as CustomerProfile & {
            error?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Unable to load your customer profile.",
          );
        }

        if (!mounted) return;

        const id = getCustomerId(data);

        if (!id) {
          throw new Error(
            "Your customer profile could not be linked to this application.",
          );
        }

        setCustomerId(id);
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your customer profile.",
        );
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () =>
      products.find(
        (product) => product.id === productId,
      ) ?? null,
    [products, productId],
  );

  const availableTerms = useMemo(
    () =>
      selectedProduct?.terms.filter(
        (term) => term.active,
      ) ?? [],
    [selectedProduct],
  );

  const selectedTerm = useMemo(
    () =>
      availableTerms.find(
        (term) => term.id === termId,
      ) ?? null,
    [availableTerms, termId],
  );

  const selectedCollateral = useMemo(
    () =>
      collaterals.find(
        (collateral) =>
          collateral.id === collateralId,
      ) ?? null,
    [collaterals, collateralId],
  );

  const principalAmount =
    Number(principal) || 0;

  const interestRate =
    selectedTerm?.interest_rate ?? 0;

  const interestAmount =
    principalAmount > 0
      ? (principalAmount * interestRate) / 100
      : 0;

  const totalPayable =
    principalAmount + interestAmount;

  const dueDate =
    applicationDate && selectedTerm
      ? addDays(
          applicationDate,
          selectedTerm.period_days,
        )
      : "";

  /*
   * Stop every active camera stream.
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  };

  /*
   * Open device camera.
   *
   * Selfie:
   *   front/user-facing camera
   *
   * NRC:
   *   rear/environment-facing camera
   */
  const openCamera = async (
    target: Exclude<CameraTarget, null>,
  ) => {
    setError("");
    setCameraError("");
    setCameraReady(false);

    /*
     * Always stop an existing camera before opening
     * another one.
     */
    stopCamera();

    setCameraTarget(target);

    try {
      /*
       * Camera APIs are only available in a browser.
       */
      if (typeof window === "undefined") {
        throw new Error(
          "Camera access is only available in a web browser.",
        );
      }

      /*
       * Check secure context.
       *
       * localhost is allowed by browsers.
       * HTTPS is required when accessing the site
       * from another device such as a phone.
       */
      if (!window.isSecureContext) {
        throw new Error(
          "Camera access requires HTTPS or localhost. If you are opening this site on your phone using a local network address such as http://192.168.x.x, use HTTPS or open the application on localhost.",
        );
      }

      /*
       * Some browsers/environments may not expose
       * mediaDevices.
       */
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !==
          "function"
      ) {
        throw new Error(
          "Camera access is not available in this browser. Please use a modern browser such as Chrome, Edge, Safari, or Firefox.",
        );
      }

      /*
       * Request the correct camera.
       *
       * Selfie -> front camera
       * NRC    -> rear camera
       */
      const videoConstraints: MediaTrackConstraints =
        {
          facingMode:
            target === "selfie"
              ? { ideal: "user" }
              : { ideal: "environment" },

          width: {
            ideal: 1280,
          },

          height: {
            ideal: 720,
          },
        };

      let stream: MediaStream;

      try {
        stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: videoConstraints,
              audio: false,
            },
          );
      } catch (firstError) {
        /*
         * Some devices do not correctly support
         * facingMode constraints.
         *
         * Retry with a simple video request so
         * the browser can choose an available camera.
         */
        console.warn(
          "Preferred camera request failed. Retrying with basic camera access.",
          firstError,
        );

        stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: false,
            },
          );
      }

      streamRef.current = stream;

      /*
       * The overlay is already rendered by the time
       * getUserMedia resolves in normal browser use.
       */
      if (!videoRef.current) {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;

        throw new Error(
          "The camera preview could not be initialized. Please try again.",
        );
      }

      videoRef.current.srcObject = stream;

      /*
       * playsInline is important on mobile Safari/iOS.
       */
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;

      await videoRef.current.play();

      setCameraReady(true);
      setCameraError("");
    } catch (err) {
      console.error(
        "Camera access error:",
        err,
      );

      stopCamera();
      setCameraTarget(null);

      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            setCameraError(
              "Camera permission was denied. Please allow camera access in your browser settings and try again.",
            );
            break;

          case "NotFoundError":
            setCameraError(
              "No camera was found on this device.",
            );
            break;

          case "NotReadableError":
            setCameraError(
              "The camera is currently being used by another application. Close other camera apps and try again.",
            );
            break;

          case "OverconstrainedError":
            setCameraError(
              "The requested camera is unavailable. Please check that your device has a working camera and try again.",
            );
            break;

          case "SecurityError":
            setCameraError(
              "Camera access was blocked by the browser. Please use HTTPS or localhost.",
            );
            break;

          case "AbortError":
            setCameraError(
              "Camera access was interrupted. Please try again.",
            );
            break;

          default:
            setCameraError(
              "Unable to access the camera. Please check your browser camera permissions and try again.",
            );
        }
      } else {
        setCameraError(
          err instanceof Error
            ? err.message
            : "Unable to access the camera.",
        );
      }
    }
  };

  /*
   * Capture current camera frame.
   */
  const capturePhoto = () => {
    if (
      !cameraTarget ||
      !videoRef.current ||
      !cameraReady
    ) {
      return;
    }

    const video = videoRef.current;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError(
        "The camera is not ready yet. Please wait a moment and try again.",
      );

      return;
    }

    const canvas =
      document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d");

    if (!context) {
      setCameraError(
        "Unable to capture the camera image.",
      );

      return;
    }

    /*
     * Mirror selfie capture so the saved selfie
     * matches the normal orientation.
     *
     * NRC images are NOT mirrored.
     */
    if (cameraTarget === "selfie") {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(
      video,
      0,
      0,
      width,
      height,
    );

    const target = cameraTarget;

    canvas.toBlob(
      (blob) => {
        if (!blob || !target) {
          setCameraError(
            "Unable to capture the image.",
          );

          return;
        }

        const file = new File(
          [blob],
          `${target}.jpg`,
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          },
        );

        const captured: CapturedImage = {
          file,
          preview:
            URL.createObjectURL(blob),
        };

        if (target === "nrcFront") {
          setNrcFront((current) => {
            if (current) {
              URL.revokeObjectURL(
                current.preview,
              );
            }

            return captured;
          });
        }

        if (target === "nrcBack") {
          setNrcBack((current) => {
            if (current) {
              URL.revokeObjectURL(
                current.preview,
              );
            }

            return captured;
          });
        }

        if (target === "selfie") {
          setSelfie((current) => {
            if (current) {
              URL.revokeObjectURL(
                current.preview,
              );
            }

            return captured;
          });
        }

        stopCamera();
        setCameraTarget(null);
        setCameraError("");
      },
      "image/jpeg",
      0.9,
    );
  };

  /*
   * Remove captured image.
   */
  const removeCapture = (
    target: Exclude<CameraTarget, null>,
  ) => {
    if (target === "nrcFront" && nrcFront) {
      URL.revokeObjectURL(nrcFront.preview);
      setNrcFront(null);
    }

    if (target === "nrcBack" && nrcBack) {
      URL.revokeObjectURL(nrcBack.preview);
      setNrcBack(null);
    }

    if (target === "selfie" && selfie) {
      URL.revokeObjectURL(selfie.preview);
      setSelfie(null);
    }
  };

  /*
   * Clean up camera and preview URLs when the
   * component is removed.
   */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (nrcFront) {
        URL.revokeObjectURL(nrcFront.preview);
      }

      if (nrcBack) {
        URL.revokeObjectURL(nrcBack.preview);
      }

      if (selfie) {
        URL.revokeObjectURL(selfie.preview);
      }
    };
  }, [nrcFront, nrcBack, selfie]);

  const validateStep = (
    currentStep: FormStep,
  ) => {
    setError("");

    if (!customerId) {
      setError(
        "Your customer profile could not be identified. Please refresh and try again.",
      );

      return false;
    }

    if (currentStep === 1) {
      if (!productId) {
        setError(
          "Please select a loan service.",
        );

        return false;
      }

      if (!selectedProduct) {
        setError(
          "The selected loan service is unavailable.",
        );

        return false;
      }

      if (!termId || !selectedTerm) {
        setError(
          "Please select a repayment term.",
        );

        return false;
      }

      if (!applicationDate) {
        setError(
          "Please select the application date.",
        );

        return false;
      }

      if (principalAmount <= 0) {
        setError(
          "Please enter a valid loan amount.",
        );

        return false;
      }

      if (
        selectedProduct.min_amount !== null &&
        principalAmount <
          selectedProduct.min_amount
      ) {
        setError(
          `The minimum amount for this loan service is ${money(
            selectedProduct.min_amount,
          )}.`,
        );

        return false;
      }

      if (
        selectedProduct.max_amount !== null &&
        principalAmount >
          selectedProduct.max_amount
      ) {
        setError(
          `The maximum amount for this loan service is ${money(
            selectedProduct.max_amount,
          )}.`,
        );

        return false;
      }

      return true;
    }

    if (currentStep === 2) {
      if (
        residentialAddress.trim().length < 5
      ) {
        setError(
          "Please enter your residential address.",
        );

        return false;
      }

      if (
        nextOfKinName.trim().length < 2
      ) {
        setError(
          "Please enter your next of kin's name.",
        );

        return false;
      }

      if (
        nextOfKinRelationship.trim().length <
        2
      ) {
        setError(
          "Please enter your relationship with your next of kin.",
        );

        return false;
      }

      if (
        nextOfKinPhone.trim().length < 7
      ) {
        setError(
          "Please enter a valid next of kin phone number.",
        );

        return false;
      }

      if (!nrcFront) {
        setError(
          "Please capture the front of your NRC.",
        );

        return false;
      }

      if (!nrcBack) {
        setError(
          "Please capture the back of your NRC.",
        );

        return false;
      }

      if (!selfie) {
        setError(
          "Please capture your selfie.",
        );

        return false;
      }

      return true;
    }

    /*
     * Collateral is OPTIONAL.
     *
     * The customer must deliberately choose:
     * None OR an actual collateral item.
     */
    if (!collateralId) {
      setError(
        "Please select either None or a collateral item.",
      );

      return false;
    }

    if (
      collateralId !== "none" &&
      collateralWorth
    ) {
      const value =
        Number(collateralWorth);

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        setError(
          "Collateral worth cannot be negative.",
        );

        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      return;
    }

    setStep(
      (current) =>
        current < 3
          ? ((current + 1) as FormStep)
          : current,
    );
  };

  const previousStep = () => {
    setError("");

    setStep(
      (current) =>
        current > 1
          ? ((current - 1) as FormStep)
          : current,
    );
  };

  const submitApplication = async () => {
    if (!validateStep(3)) {
      return;
    }

    if (
      !selectedProduct ||
      !selectedTerm ||
      !nrcFront ||
      !nrcBack ||
      !selfie
    ) {
      setError(
        "Please complete all required application information.",
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();

      formData.append(
        "product_id",
        selectedProduct.id,
      );

      formData.append(
        "term_id",
        selectedTerm.id,
      );

      formData.append(
        "application_date",
        applicationDate,
      );

      formData.append(
        "requested_amount",
        String(principalAmount),
      );

      formData.append(
        "residential_address",
        residentialAddress.trim(),
      );

      formData.append(
        "next_of_kin_name",
        nextOfKinName.trim(),
      );

      formData.append(
        "next_of_kin_relationship",
        nextOfKinRelationship.trim(),
      );

      formData.append(
        "next_of_kin_phone",
        nextOfKinPhone.trim(),
      );

      formData.append(
        "collateral_id",
        collateralId,
      );

      if (
        collateralId !== "none" &&
        collateralWorth
      ) {
        formData.append(
          "collateral_worth",
          collateralWorth,
        );
      }

      formData.append(
        "notes",
        notes.trim(),
      );

      formData.append(
        "nrc_front",
        nrcFront.file,
        "nrc-front.jpg",
      );

      formData.append(
        "nrc_back",
        nrcBack.file,
        "nrc-back.jpg",
      );

      formData.append(
        "selfie",
        selfie.file,
        "selfie.jpg",
      );

      const response = await fetch(
        "/api/customer/loan-applications",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Unable to submit your loan application.",
        );
      }

      setApplicationNumber(
        data?.application
          ?.application_number ?? "",
      );

      setSubmitted(true);

      stopCamera();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your loan application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h2 className="mt-5 text-xl font-black text-[#03162F]">
          Application Submitted
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Your loan application has been submitted
          successfully and is now pending review by
          Alessandro Soft Loans.
        </p>

        {applicationNumber && (
          <div className="mt-5 rounded-2xl bg-[#03162F] p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Application Number
            </p>

            <p className="mt-1 text-lg font-black">
              {applicationNumber}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
          <SummaryRow
            label="Requested Amount"
            value={money(principalAmount)}
          />

          <div className="mt-3">
            <SummaryRow
              label="Status"
              value="Pending Review"
              strong
            />
          </div>
        </div>

        <Link
          href={`/customer/businesses/${businessSlug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#08264D]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Soft Loans
        </Link>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#D4AF37]" />

        <p className="mt-4 text-sm font-semibold text-slate-600">
          Loading your customer profile...
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <FileCheck2 className="mx-auto h-10 w-10 text-slate-400" />

        <h2 className="mt-4 text-lg font-black text-[#03162F]">
          Applications Currently Unavailable
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          There are currently no active loan services
          available for online applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* CAMERA OVERLAY */}
      {cameraTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <div className="relative flex h-full w-full max-w-[720px] flex-col bg-black">
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-black/50 px-5 py-4 text-white backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Camera Verification
                </p>

                <p className="mt-1 text-sm font-black">
                  {cameraTarget === "nrcFront"
                    ? "NRC Front"
                    : cameraTarget === "nrcBack"
                      ? "NRC Back"
                      : "Selfie"}
                </p>

                <p className="mt-1 text-[10px] text-white/60">
                  {cameraTarget === "selfie"
                    ? "Front camera"
                    : "Rear camera"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCameraTarget(null);
                  setCameraError("");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close camera"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className={`h-full w-full object-cover ${
                  cameraTarget === "selfie"
                    ? "-scale-x-100"
                    : ""
                }`}
              />

              {cameraTarget !== "selfie" && (
                <div className="pointer-events-none absolute inset-x-8 top-1/2 h-48 -translate-y-1/2 rounded-2xl border-2 border-[#D4AF37] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              )}

              {cameraTarget === "selfie" && (
                <div className="pointer-events-none absolute inset-x-16 top-1/2 h-72 -translate-y-1/2 rounded-[50%] border-2 border-[#D4AF37] shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
              )}

              {!cameraReady &&
                !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="text-center text-white">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#D4AF37]" />

                      <p className="mt-4 text-sm font-semibold">
                        Starting camera...
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {cameraError && (
              <div className="absolute bottom-28 left-5 right-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold leading-5 text-red-700">
                {cameraError}
              </div>
            )}

            <div className="flex items-center justify-center bg-black px-5 py-6">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#D4AF37] text-[#03162F] shadow-xl transition active:scale-95 disabled:opacity-40"
                aria-label="Capture photo"
              >
                <Camera className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-2 flex-1 rounded-full transition ${
                item <= step
                  ? "bg-[#D4AF37]"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-400">
          <span
            className={
              step >= 1
                ? "text-[#03162F]"
                : ""
            }
          >
            Loan
          </span>

          <span
            className={
              step >= 2
                ? "text-[#03162F]"
                : ""
            }
          >
            Verification
          </span>

          <span
            className={
              step >= 3
                ? "text-[#03162F]"
                : ""
            }
          >
            Review
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-5 text-red-700">
          {error}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Step 1
          </p>

          <h2 className="mt-1 text-xl font-black text-[#03162F]">
            Loan Information
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Select the loan service and repayment term you
            would like to apply for.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Loan Service
              </label>

              <select
                value={productId}
                onChange={(event) => {
                  setProductId(
                    event.target.value,
                  );
                  setTermId("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              >
                <option value="">
                  Select a loan service
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name}
                  </option>
                ))}
              </select>

              {selectedProduct?.description && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {selectedProduct.description}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Repayment Term
              </label>

              <select
                value={termId}
                onChange={(event) =>
                  setTermId(
                    event.target.value,
                  )
                }
                disabled={!selectedProduct}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {selectedProduct
                    ? "Select repayment term"
                    : "Select a loan service first"}
                </option>

                {availableTerms.map((term) => (
                  <option
                    key={term.id}
                    value={term.id}
                  >
                    {term.period_days} days —{" "}
                    {term.interest_rate}%
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Application Date
              </label>

              <input
                type="date"
                value={applicationDate}
                onChange={(event) =>
                  setApplicationDate(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Loan Amount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  K
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={principal}
                  onChange={(event) =>
                    setPrincipal(
                      event.target.value,
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              {selectedProduct &&
                (selectedProduct.min_amount !==
                  null ||
                  selectedProduct.max_amount !==
                    null) && (
                  <p className="mt-2 text-xs text-slate-500">
                    Available range:{" "}
                    {selectedProduct.min_amount !==
                    null
                      ? money(
                          selectedProduct.min_amount,
                        )
                      : "No minimum"}{" "}
                    –{" "}
                    {selectedProduct.max_amount !==
                    null
                      ? money(
                          selectedProduct.max_amount,
                        )
                      : "No maximum"}
                  </p>
                )}
            </div>

            {selectedTerm &&
              principalAmount > 0 && (
                <div className="rounded-2xl bg-[#03162F] p-5 text-white">
                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-slate-300">
                      Interest Rate
                    </span>

                    <span className="text-sm font-black text-[#D4AF37]">
                      {interestRate}%
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between gap-4">
                    <span className="text-xs text-slate-300">
                      Interest
                    </span>

                    <span className="text-sm font-bold">
                      {money(interestAmount)}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <div className="flex justify-between gap-4">
                      <span className="text-xs font-bold text-slate-200">
                        Total Payable
                      </span>

                      <span className="text-lg font-black text-[#D4AF37]">
                        {money(totalPayable)}
                      </span>
                    </div>
                  </div>

                  {dueDate && (
                    <p className="mt-3 text-xs text-slate-400">
                      Expected due date:{" "}
                      <span className="font-bold text-white">
                        {dueDate}
                      </span>
                    </p>
                  )}
                </div>
              )}
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-4 text-sm font-black text-white transition hover:bg-[#08264D]"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Step 2
          </p>

          <h2 className="mt-1 text-xl font-black text-[#03162F]">
            Customer Verification
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Capture your NRC and selfie directly using your
            device camera.
          </p>

          <div className="mt-6 space-y-5">
            <CameraCapture
              label="NRC Front"
              description="Capture the front side of your NRC using the rear camera."
              capture={nrcFront}
              onCapture={() =>
                openCamera("nrcFront")
              }
              onRemove={() =>
                removeCapture("nrcFront")
              }
            />

            <CameraCapture
              label="NRC Back"
              description="Capture the back side of your NRC using the rear camera."
              capture={nrcBack}
              onCapture={() =>
                openCamera("nrcBack")
              }
              onRemove={() =>
                removeCapture("nrcBack")
              }
            />

            <CameraCapture
              label="Selfie"
              description="Take a clear selfie using your front camera."
              capture={selfie}
              onCapture={() =>
                openCamera("selfie")
              }
              onRemove={() =>
                removeCapture("selfie")
              }
            />

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Residential Address
              </label>

              <textarea
                value={residentialAddress}
                onChange={(event) =>
                  setResidentialAddress(
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Enter your residential address"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            <div>
              <h3 className="text-sm font-black text-[#03162F]">
                Next of Kin
              </h3>

              <div className="mt-3 space-y-3">
                <input
                  value={nextOfKinName}
                  onChange={(event) =>
                    setNextOfKinName(
                      event.target.value,
                    )
                  }
                  placeholder="Full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />

                <input
                  value={nextOfKinRelationship}
                  onChange={(event) =>
                    setNextOfKinRelationship(
                      event.target.value,
                    )
                  }
                  placeholder="Relationship"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />

                <input
                  value={nextOfKinPhone}
                  onChange={(event) =>
                    setNextOfKinPhone(
                      event.target.value,
                    )
                  }
                  placeholder="Phone number"
                  type="tel"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={previousStep}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-black text-white transition hover:bg-[#08264D]"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Step 3
            </p>

            <h2 className="mt-1 text-xl font-black text-[#03162F]">
              Collateral & Notes
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Collateral is optional. You may select None if
              you do not have collateral.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Collateral
                </label>

                <select
                  value={collateralId}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setCollateralId(value);

                    if (value === "none") {
                      setCollateralWorth("");
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  <option value="">
                    Select collateral option
                  </option>

                  <option value="none">
                    None
                  </option>

                  {collaterals.map(
                    (collateral) => (
                      <option
                        key={collateral.id}
                        value={collateral.id}
                      >
                        {collateral.name}
                      </option>
                    ),
                  )}
                </select>

                {selectedCollateral?.description && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {selectedCollateral.description}
                  </p>
                )}
              </div>

              {collateralId === "none" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold text-emerald-700">
                    No collateral selected
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-emerald-600">
                    You can continue your application
                    without providing collateral.
                  </p>
                </div>
              )}

              {collateralId &&
                collateralId !== "none" && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Collateral Worth
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        K
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={collateralWorth}
                        onChange={(event) =>
                          setCollateralWorth(
                            event.target.value,
                          )
                        }
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                      />
                    </div>
                  </div>
                )}

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Additional Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  rows={4}
                  placeholder="Add any additional information you would like the loan team to know."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-black text-[#03162F]">
                  Review Application
                </h2>

                <p className="text-xs text-slate-500">
                  Check your information before submitting.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
              <SummaryRow
                label="Loan Service"
                value={
                  selectedProduct?.name ?? "—"
                }
              />

              <SummaryRow
                label="Loan Amount"
                value={money(principalAmount)}
              />

              <SummaryRow
                label="Interest"
                value={`${interestRate}% (${money(
                  interestAmount,
                )})`}
              />

              <SummaryRow
                label="Repayment Term"
                value={
                  selectedTerm
                    ? `${selectedTerm.period_days} days`
                    : "—"
                }
              />

              <SummaryRow
                label="Total Payable"
                value={money(totalPayable)}
                strong
              />

              <SummaryRow
                label="Due Date"
                value={dueDate || "—"}
              />

              <SummaryRow
                label="Collateral"
                value={
                  collateralId === "none"
                    ? "None"
                    : selectedCollateral?.name ??
                      "—"
                }
              />

              <SummaryRow
                label="Application Status"
                value="Pending Review"
                strong
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold text-[#03162F]">
                Verification captured
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <VerificationBadge
                  label="NRC Front"
                  captured={Boolean(nrcFront)}
                />

                <VerificationBadge
                  label="NRC Back"
                  captured={Boolean(nrcBack)}
                />

                <VerificationBadge
                  label="Selfie"
                  captured={Boolean(selfie)}
                />
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-5 text-slate-500">
              By submitting this application, you confirm
              that the information and verification images
              provided are accurate and belong to you.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={previousStep}
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={submitApplication}
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#03162F] transition hover:bg-[#E4C45A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Application"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

interface CameraCaptureProps {
  label: string;
  description: string;
  capture: CapturedImage | null;
  onCapture: () => void;
  onRemove: () => void;
}

function CameraCapture({
  label,
  description,
  capture,
  onCapture,
  onRemove,
}: CameraCaptureProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </label>

      {capture ? (
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
            <img
              src={capture.preview}
              alt={`${label} captured`}
              className="h-full w-full object-cover"
            />

            <div className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black text-white">
              Captured
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-3">
            <div>
              <p className="text-xs font-bold text-emerald-700">
                {label} captured successfully
              </p>

              <p className="mt-0.5 text-[10px] text-emerald-600">
                You can retake the image if necessary.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCapture}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retake
              </button>

              <button
                type="button"
                onClick={onRemove}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
                aria-label={`Remove ${label}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCapture}
          className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-left transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]">
            <Camera className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#03162F]">
              Capture {label}
            </p>

            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              {description}
            </p>

            <p className="mt-1 text-[10px] font-semibold text-[#D4AF37]">
              Camera required
            </p>
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      )}
    </div>
  );
}

function VerificationBadge({
  label,
  captured,
}: {
  label: string;
  captured: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center ${
        captured
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      <CheckCircle2
        className={`mx-auto h-4 w-4 ${
          captured
            ? "text-emerald-600"
            : "text-red-500"
        }`}
      />

      <p className="mt-1 text-[9px] font-bold">
        {label}
      </p>

      <p className="mt-0.5 text-[8px]">
        {captured ? "Ready" : "Required"}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span
        className={`text-right text-xs ${
          strong
            ? "font-black text-[#03162F]"
            : "font-bold text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}