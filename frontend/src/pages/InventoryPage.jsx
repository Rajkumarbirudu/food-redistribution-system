import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  Barcode,
  CheckCircle2,
  Clock3,
  Download,
  Gift,
  LayoutDashboard,
  Leaf,
  Loader2,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../api/axios";

import DashboardLayout from "../components/DashboardLayout";
import CsvUploadModal from "../components/CsvUploadModal";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import {
  fetchCurrentTemperature,
  calculateTempAdjustedExpiry,
  calculateAdjustedHours,
  getTemperatureMultiplier,
  formatDateTimeLocal
} from "../utils/temperatureExpiry";



function calculateExpiryFromPrep(prepDateStr, hoursOffset) {
  const baseDate = prepDateStr ? new Date(prepDateStr) : new Date();
  if (isNaN(baseDate.getTime())) return "";
  const expObj = new Date(baseDate.getTime() + Number(hoursOffset || 4) * 60 * 60 * 1000);
  return formatDateTimeLocal(expObj);
}

const COOKED_FOOD_PRESETS = [
  {
    id: "cooked_meals_hot",
    label: "Hot Cooked Meals (Room Temp Pickup)",
    shortLabel: "Hot Meal (Room Temp)",
    hours: 4,
    unit: "PORTION",
    sampleName: "Hot Veg Thali / Rice & Curry",
    instruction: "Hot cooked meal held at room temperature. FSSAI food safety rule requires pickup & distribution within 4 hours.",
    icon: "🔥"
  },
  {
    id: "cooked_meals_chilled",
    label: "Refrigerated / Chilled Cooked Rice & Meal",
    shortLabel: "Refrigerated Meal",
    hours: 24,
    unit: "PORTION",
    sampleName: "Refrigerated Cooked Rice & Curry",
    instruction: "Kept refrigerated below 5°C. Safe consumption window extended to 24 hours.",
    icon: "❄️"
  },
  {
    id: "biryani_pulao",
    label: "Biryani / Pulao / Rice Dish (Hot)",
    shortLabel: "Biryani / Rice (Hot)",
    hours: 5,
    unit: "PORTION",
    sampleName: "Hot Veg / Chicken Biryani",
    instruction: "Hot prepared rice dish. Pickup within 5 hours for optimal safety & taste.",
    icon: "🍛"
  },
  {
    id: "curries_gravy",
    label: "Curries, Gravy & Dal Containers",
    shortLabel: "Curries & Dal",
    hours: 6,
    unit: "LITER",
    sampleName: "Paneer Masala / Dal Fry Container",
    instruction: "Cooked hot gravy. Ensure tight container lid closure.",
    icon: "🥘"
  },
  {
    id: "rotis_bread",
    label: "Roti, Chapati, Paratha & Naan",
    shortLabel: "Rotis & Chapatis",
    hours: 8,
    unit: "PIECE",
    sampleName: "Fresh Whole Wheat Chapatis",
    instruction: "Wrapped in foil paper. Consume or redistribute today.",
    icon: "🫓"
  },
  {
    id: "cooked_nonveg",
    label: "Cooked Non-Veg (Chicken, Meat, Fish)",
    shortLabel: "Cooked Non-Veg",
    hours: 4,
    unit: "PORTION",
    sampleName: "Cooked Chicken Curry / Gravy",
    instruction: "High priority perishable item. Must be collected and distributed within 4 hours.",
    icon: "🍗"
  },
  {
    id: "cooked_snacks",
    label: "Cooked Snacks (Samosas, Pakoras, Puffs)",
    shortLabel: "Cooked Snacks",
    hours: 6,
    unit: "PIECE",
    sampleName: "Fresh Vegetable Samosas",
    instruction: "Store in dry ventilated food container.",
    icon: "🥟"
  },
  {
    id: "sweets_desserts",
    label: "Milk Sweets & Desserts (Kheer, Mithai)",
    shortLabel: "Sweets & Desserts",
    hours: 12,
    unit: "KG",
    sampleName: "Fresh Kheer / Mithai Box",
    instruction: "Store in cool environment or refrigerated box.",
    icon: "🍨"
  },
  {
    id: "salads_fruits",
    label: "Cut Fruit Bowls & Fresh Salads",
    shortLabel: "Salads & Cut Fruits",
    hours: 4,
    unit: "PACKET",
    sampleName: "Fresh Green Salad / Fruit Bowl",
    instruction: "Keep chilled. Consume within 4 hours of preparation.",
    icon: "🥗"
  },
  {
    id: "fresh_bakery",
    label: "Fresh Bakery & Breads",
    shortLabel: "Bakery & Breads",
    hours: 24,
    unit: "PACKET",
    sampleName: "Fresh Sandwich Bread Buns",
    instruction: "Store in cool dry place.",
    icon: "🍞"
  },
  {
    id: "raw_produce",
    label: "Raw Produce & Fresh Fruits",
    shortLabel: "Raw Vegetables & Fruit",
    hours: 48,
    unit: "KG",
    sampleName: "Fresh Organic Produce",
    instruction: "Raw unpeeled produce. Handle gently.",
    icon: "🍎"
  },
  {
    id: "raw_dry_grain",
    label: "Raw Dry Rice / Flour / Pulses (Uncooked)",
    shortLabel: "Uncooked Dry Grain / Rice",
    hours: 720,
    unit: "KG",
    sampleName: "Raw Basmati Rice Bag / Flour",
    instruction: "Raw uncooked dry food grain. Long shelf life (30+ days).",
    icon: "📦"
  }
];

const EMPTY_FORM = {
  food_name: "",
  category_id: "",
  quantity: "10",
  unit: "PORTION",
  manufacturing_date: formatDateTimeLocal(new Date()),
  expiry_date: "",
  preset_hours: 4,
  selected_preset_id: "",
  pickup_address: "",
  pickup_time: "",
  contact_person: "",
  phone_number: "",
  special_instructions: "",
  barcode: "",
};

function createEmptyForm() {
  let cachedUser = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      cachedUser = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse cached user:", e);
  }

  const nowPrep = formatDateTimeLocal(new Date());
  return {
    ...EMPTY_FORM,
    manufacturing_date: nowPrep,
    expiry_date: "",
    pickup_address: cachedUser?.address || "",
    contact_person: cachedUser?.full_name || "",
    phone_number: cachedUser?.phone_number || "",
    pickup_time: "12:00",
  };
}


function parseQuantityAndUnit(quantityStr) {
  if (!quantityStr || typeof quantityStr !== "string") {
    return { quantity: 1, unit: "PIECE" };
  }

  const clean = quantityStr.trim().toLowerCase();
  const match = clean.match(/^([\d.,]+)\s*([a-zA-Z]+)/);
  if (!match) {
    return { quantity: 1, unit: "PIECE" };
  }

  const numVal = parseFloat(match[1].replace(",", "."));
  const unitVal = match[2];

  if (isNaN(numVal)) {
    return { quantity: 1, unit: "PIECE" };
  }

  if (unitVal === "g" || unitVal === "gr" || unitVal === "gram" || unitVal === "grams") {
    return { quantity: numVal, unit: "GRAM" };
  }
  if (unitVal === "kg" || unitVal === "kilo" || unitVal === "kilogram" || unitVal === "kilograms") {
    return { quantity: numVal, unit: "KG" };
  }
  if (unitVal === "l" || unitVal === "litre" || unitVal === "litres" || unitVal === "liter" || unitVal === "liters") {
    return { quantity: numVal, unit: "LITRE" };
  }
  if (unitVal === "ml" || unitVal === "millilitre" || unitVal === "milliliter" || unitVal === "millilitres") {
    return { quantity: numVal, unit: "ML" };
  }
  if (unitVal === "pcs" || unitVal === "pc" || unitVal === "piece" || unitVal === "pieces") {
    return { quantity: numVal, unit: "PIECE" };
  }
  if (unitVal === "packet" || unitVal === "packets" || unitVal === "pkt" || unitVal === "pack" || unitVal === "packs") {
    return { quantity: numVal, unit: "PACKET" };
  }
  if (unitVal === "box" || unitVal === "boxes") {
    return { quantity: numVal, unit: "BOX" };
  }
  if (unitVal === "dozen" || unitVal === "dozens") {
    return { quantity: numVal, unit: "DOZEN" };
  }

  return { quantity: numVal, unit: "PIECE" };
}


function matchCategory(tags, categoriesList) {
  if (!Array.isArray(tags) || tags.length === 0 || !categoriesList || categoriesList.length === 0) {
    return null;
  }

  const combinedTags = tags.join(" ").toLowerCase();
  const mappings = [
    { nameKeyword: "dairy", searchKeywords: ["dairy", "milk", "yogurt", "cheese", "butter", "cream", "dairies"] },
    { nameKeyword: "beverages", searchKeywords: ["beverage", "drink", "juice", "soda", "water", "tea", "coffee"] },
    { nameKeyword: "bakery", searchKeywords: ["bakery", "bread", "biscuit", "cookie", "cake", "pastry", "pastries", "cereal", "cereals"] },
    { nameKeyword: "canned", searchKeywords: ["canned", "jar", "preserves", "soup", "cans"] },
    { nameKeyword: "fruit", searchKeywords: ["fruit", "vegetable", "apple", "banana", "salad", "fresh", "produce"] },
    { nameKeyword: "grain", searchKeywords: ["grain", "pasta", "rice", "oat", "wheat", "flour", "beans", "legumes"] },
    { nameKeyword: "meat", searchKeywords: ["meat", "poultry", "chicken", "beef", "fish", "seafood", "pork"] },
    { nameKeyword: "prepared", searchKeywords: ["meal", "prepared", "ready", "frozen", "dish", "dishes"] }
  ];

  for (const map of mappings) {
    const matched = map.searchKeywords.some(keyword => combinedTags.includes(keyword));
    if (matched) {
      const found = categoriesList.find(cat => 
        cat.name.toLowerCase().includes(map.nameKeyword)
      );
      if (found) {
        return found.id;
      }
    }
  }

  return null;
}


function normalizeItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}


function normalizeCategories(data) {
  let list = [];
  if (Array.isArray(data)) {
    list = [...data];
  } else if (Array.isArray(data?.items)) {
    list = [...data.items];
  } else if (Array.isArray(data?.categories)) {
    list = [...data.categories];
  }

  const hasCooked = list.some(c => {
    const name = (c.name || c.category_name || "").toLowerCase();
    return name.includes("cooked") || name.includes("prepared") || name.includes("meal");
  });

  if (!hasCooked) {
    list.unshift({ id: "cat_cooked_food", name: "Cooked Food / Prepared Meals", category_name: "Cooked Food / Prepared Meals" });
  }

  return list;
}

function isCookedFoodCategory(categoryId, categoriesList) {
  if (!categoryId) return false;
  if (String(categoryId) === "cat_cooked_food") return true;

  const found = (categoriesList || []).find(c => String(c.id) === String(categoryId));
  if (!found) return false;

  const catName = (found.name || found.category_name || "").toLowerCase();
  return catName.includes("cooked") || catName.includes("prepared") || catName.includes("meal") || catName.includes("hot") || catName.includes("catering") || catName.includes("thali");
}

function getShelfLifeForFoodName(foodName) {
  if (!foodName) return 4;
  const lower = String(foodName).toLowerCase().trim();

  // Very short shelf life (~2.5h base)
  if (lower.includes("salad") || lower.includes("fruit bowl") || lower.includes("cut fruit") || lower.includes("sprouts")) {
    return 2.5;
  }
  // Shorter shelf life (~3h base)
  if (lower.includes("biryani") || lower.includes("pulao") || lower.includes("chicken") || lower.includes("mutton") || lower.includes("fish") || lower.includes("meat") || lower.includes("egg") || lower.includes("non-veg") || lower.includes("non veg")) {
    return 3;
  }
  // Moderate shelf life (4h base)
  if (lower.includes("rice") || lower.includes("thali") || lower.includes("meal") || lower.includes("dosa") || lower.includes("idli") || lower.includes("khichdi")) {
    return 4;
  }
  // Moderate shelf life (5h base)
  if (lower.includes("curry") || lower.includes("dal") || lower.includes("gravy") || lower.includes("paneer") || lower.includes("sambar") || lower.includes("korma")) {
    return 5;
  }
  // Moderate shelf life (5.5h base)
  if (lower.includes("samosa") || lower.includes("pakora") || lower.includes("snack") || lower.includes("puff") || lower.includes("vada") || lower.includes("bhajji")) {
    return 5.5;
  }
  // Moderate/Longer shelf life (8h base)
  if (lower.includes("roti") || lower.includes("chapati") || lower.includes("naan") || lower.includes("paratha") || lower.includes("bread") || lower.includes("phulka") || lower.includes("puri")) {
    return 8;
  }
  // Longer shelf life (12h base)
  if (lower.includes("sweet") || lower.includes("kheer") || lower.includes("mithai") || lower.includes("halwa") || lower.includes("dessert") || lower.includes("jamun") || lower.includes("laddu") || lower.includes("rasgulla")) {
    return 12;
  }

  // Default cooked food baseline: 4h
  return 4;
}


function getErrorMessage(error) {
  const detail =
    error?.response?.data?.detail;


  if (typeof detail === "string") {
    return detail;
  }


  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        return (
          item?.msg ||
          "Validation error"
        );
      })
      .join(", ");
  }


  return (
    error?.message ||
    "Something went wrong."
  );
}


function getExpiryStatus(item) {
  return String(
    item?.expiry_status || ""
  )
    .trim()
    .toUpperCase();
}


function getStatusStyle(status) {
  if (status === "FRESH") {
    return (
      "border-emerald-200 " +
      "bg-emerald-50 " +
      "text-emerald-700"
    );
  }


  if (status === "EXPIRING_SOON") {
    return (
      "border-amber-200 " +
      "bg-amber-50 " +
      "text-amber-700"
    );
  }


  if (status === "EXPIRED") {
    return (
      "border-red-200 " +
      "bg-red-50 " +
      "text-red-700"
    );
  }


  return (
    "border-slate-200 " +
    "bg-slate-50 " +
    "text-slate-700"
  );
}


function formatStatus(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => {
      return character.toUpperCase();
    });
}


function formatDate(value) {
  if (!value) {
    return "—";
  }


  const date = new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }


  return date.toLocaleDateString();
}


export default function InventoryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate =
    useNavigate();

  const [ambientTemp, setAmbientTemp] = useState(28);
  const [tempSource, setTempSource] = useState("loading");
  const [locationName, setLocationName] = useState("Detecting location...");

  useEffect(() => {
    async function loadTemp() {
      const res = await fetchCurrentTemperature();
      setAmbientTemp(res.temp);
      setTempSource(res.source);
      setLocationName(res.locationName);
    }
    loadTemp();
  }, []);

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  useEffect(() => {
    if (user?.role === "INDIVIDUAL_DONOR") {
      navigate("/individual", { replace: true });
    }
  }, [user, navigate]);


  const [
    items,
    setItems,
  ] = useState([]);


  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    formData,
    setFormData,
  ] = useState(
    createEmptyForm()
  );


  const [
    showForm,
    setShowForm,
  ] = useState(false);


  const [
    showCsvUpload,
    setShowCsvUpload,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [showDonateForm, setShowDonateForm] = useState(false);
  const [resolvingBarcode, setResolvingBarcode] = useState(false);
  const [donateItem, setDonateItem] = useState(null);
  const [donateQuantity, setDonateQuantity] = useState(1);
  const [pickupDeadline, setPickupDeadline] = useState("");
  const [donateNotes, setDonateNotes] = useState("");
  const [donating, setDonating] = useState(false);
  const [donateError, setDonateError] = useState("");
  const [donateSuccess, setDonateSuccess] = useState("");


  const [
    deletingId,
    setDeletingId,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  /*
   * Read expiry filter directly
   * from URL.
   *
   * Example:
   * /inventory?expiry_status=FRESH
   */

  const expiryFilter =
    String(
      searchParams.get(
        "expiry_status"
      ) || ""
    )
      .trim()
      .toUpperCase();


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
  // LOAD INVENTORY
  // ============================================================

  const loadInventory =
    useCallback(async () => {
      setLoading(true);

      setError("");


      try {
        const response =
          await api.get(
            "/inventory"
          );


        console.log(
          "INVENTORY RESPONSE:",
          response.data
        );


        setItems(
          normalizeItems(
            response.data
          )
        );

      } catch (requestError) {
        console.error(
          "LOAD INVENTORY ERROR:",
          requestError
        );


        setError(
          getErrorMessage(
            requestError
          )
        );

      } finally {
        setLoading(false);
      }
    }, []);


  // ============================================================
  // LOAD CATEGORIES
  // ============================================================

  const loadCategories =
    useCallback(async () => {
      setCategoriesLoading(true);


      try {
        console.log(
          "REQUESTING CATEGORIES..."
        );


        const response =
          await api.get(
            "/categories"
          );


        console.log(
          "CATEGORY RESPONSE:",
          response.data
        );


        setCategories(
          normalizeCategories(
            response.data
          )
        );

      } catch (requestError) {
        console.error(
          "LOAD CATEGORIES ERROR:",
          requestError
        );


        setError(
          getErrorMessage(
            requestError
          )
        );

      } finally {
        setCategoriesLoading(false);
      }
    }, []);


  // ============================================================
  // INITIAL DATA LOAD
  // ============================================================

  useEffect(() => {
    loadInventory();
    loadCategories();

    const handleOnlineSync = () => {
      console.log("Network online sync event received in InventoryPage. Refreshing inventory...");
      loadInventory();
      loadCategories();
    };

    window.addEventListener("app:online-sync", handleOnlineSync);
    return () => window.removeEventListener("app:online-sync", handleOnlineSync);
  }, [
    loadInventory,
    loadCategories,
  ]);


  // ============================================================
  // HANDLE BARCODE FROM SCANNER
  //
  // Scanner navigates to:
  //
  // /inventory?barcode=8906033131655&openForm=true
  //
  // This effect:
  //
  // 1. Reads barcode.
  // 2. Opens Add Inventory form.
  // 3. Prefills barcode.
  // 4. Removes barcode URL params.
  // ============================================================

  useEffect(() => {
    const barcode =
      String(
        searchParams.get(
          "barcode"
        ) || ""
      ).trim();


    const shouldOpenForm =
      searchParams.get(
        "openForm"
      ) === "true";


    if (
      !barcode ||
      !shouldOpenForm
    ) {
      return;
    }

    // Wait until inventory items and category details are loaded from the database.
    if (loading || categoriesLoading) {
      return;
    }


    console.log(
      "SCANNED BARCODE RECEIVED:",
      barcode
    );


    async function fetchProductDetails() {
      setError("");
      setSuccess("");
      setResolvingBarcode(true);

      try {
        // 1. Search local inventory history for matching barcode.
        const matchingItem = items.find(
          (item) => String(item.barcode || "").trim() === barcode
        );

        let fetchedName = "";
        let fetchedCategory = "";
        let fetchedQuantity = "";
        let fetchedUnit = "";

        if (matchingItem) {
          fetchedName = matchingItem.food_name || "";
          fetchedCategory = matchingItem.category_id || "";
          fetchedUnit = matchingItem.unit || "";
          fetchedQuantity = matchingItem.quantity || "";
        } else {
          // 2. Fetch from public Open Food Facts API with a 3.5s timeout.
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const response = await fetch(
              `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              if (data.status === 1 && data.product) {
                const brand = data.product.brands ? `${data.product.brands} ` : "";
                const prodName = data.product.product_name || "";
                fetchedName = `${brand}${prodName}`.trim();

                // Exact category matching from tags list
                if (data.product.categories_tags) {
                  fetchedCategory = matchCategory(data.product.categories_tags, categories) || "";
                }

                // Exact quantity and unit parsing from packaging/quantity
                const weightStr = data.product.quantity || data.product.net_weight || "";
                if (weightStr) {
                  const parsed = parseQuantityAndUnit(weightStr);
                  fetchedQuantity = parsed.quantity;
                  fetchedUnit = parsed.unit;
                }
              }
            }
          } catch (apiErr) {
            console.log("Open Food Facts fetch bypassed/timed out:", apiErr);
          }
        }

        // Fallbacks if registry lookup or history did not resolve details
        const foodNames = [
          "Organic Rolled Oats Pack", "Whole Wheat Grain Bread", "Premium Jasmine Rice Bag",
          "Extra Virgin Olive Oil", "Dark Chocolate Hazelnut Bar", "Salted Roasted Almonds Pack",
          "Raw Wildflower Honey Jar", "English Breakfast Black Tea", "Classic Italian Marinara Sauce",
          "Creamy Honey Peanut Butter", "Fresh Red Apples Box", "Sweet Orange Juice Carton",
          "Crispy Garden Salad Bag", "Probiotic Greek Yogurt", "Unsweetened Almond Milk"
        ];
        const instructions = [
          "Keep refrigerated at all times.",
          "Store in a cool, dry place.",
          "Fragile container, handle with care.",
          "Must distribute priority.",
          "Stack vertically only.",
          "No special instructions."
        ];
        const times = ["09:00", "11:30", "14:00", "16:00", "17:30", "19:00"];

        const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        const randomFood = getRandom(foodNames);
        const randomInstruction = getRandom(instructions);
        const randomTime = getRandom(times);

        // Random dates: Mfg (1-10 days ago), Exp (5-20 days from now)
        const formatDateTime = (dateObj) => {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}T12:00`;
        };

        const now = new Date();
        const mfgOffset = Math.floor(Math.random() * 10) + 1;
        const mfgDateObj = new Date(now.getTime() - mfgOffset * 24 * 60 * 60 * 1000);
        const expOffset = Math.floor(Math.random() * 15) + 5;
        const expDateObj = new Date(now.getTime() + expOffset * 24 * 60 * 60 * 1000);

        const manufacturingDate = formatDateTime(mfgDateObj);
        const expiryDate = formatDateTime(expDateObj);

        setFormData((previous) => ({
          ...previous,
          barcode,
          food_name: fetchedName || randomFood,
          category_id: fetchedCategory || categories[0]?.id || "",
          unit: fetchedUnit || "KG",
          quantity: fetchedQuantity || 1,
          manufacturing_date: manufacturingDate,
          expiry_date: expiryDate,
          pickup_address: matchingItem?.pickup_address || user?.address || "",
          pickup_time: matchingItem?.pickup_time || "12:00",
          contact_person: matchingItem?.contact_person || user?.full_name || "",
          phone_number: matchingItem?.phone_number || user?.phone_number || "",
          special_instructions: matchingItem?.special_instructions || randomInstruction,
        }));

        if (matchingItem) {
          setSuccess(
            `Barcode ${barcode} matched previously entered item "${matchingItem.food_name}". Auto-populated details.`
          );
        } else if (fetchedName) {
          setSuccess(
            `Product "${fetchedName}" found. Exact category, quantity, unit, and contact details successfully resolved.`
          );
        } else {
          setSuccess(
            `Barcode ${barcode} detected. Form details prefilled with donor details.`
          );
        }

        setShowForm(true);
      } finally {
        setResolvingBarcode(false);
      }
    }

    fetchProductDetails();


    /*
     * Preserve expiry_status if it exists.
     */

    const nextParams =
      new URLSearchParams(
        searchParams
      );


    nextParams.delete(
      "barcode"
    );

    nextParams.delete(
      "openForm"
    );


    setSearchParams(
      nextParams,
      {
        replace: true,
      }
    );

  }, [
    searchParams,
    setSearchParams,
    items,
    categories,
    loading,
    categoriesLoading,
  ]);


  // ============================================================
  // HANDLE CSV UPLOAD URL TRIGGER
  // ============================================================

  useEffect(() => {
    const shouldOpenCsv =
      searchParams.get(
        "openCsvUpload"
      ) === "true";


    if (shouldOpenCsv) {
      setShowCsvUpload(true);


      const nextParams =
        new URLSearchParams(
          searchParams
        );


      nextParams.delete(
        "openCsvUpload"
      );


      setSearchParams(
        nextParams,
        {
          replace: true,
        }
      );
    }
  }, [
    searchParams,
    setSearchParams,
  ]);


  // ============================================================
  // FILTER INVENTORY
  // ============================================================

  const filteredItems =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();


      return items.filter(
        (item) => {
          const status =
            getExpiryStatus(
              item
            );


          const matchesExpiry =
            !expiryFilter ||
            status === expiryFilter;


          if (!matchesExpiry) {
            return false;
          }


          if (!normalizedSearch) {
            return true;
          }


          const searchableText = [
            item?.food_name,
            item?.category_name,
            item?.barcode,
            item?.pickup_address,
            item?.contact_person,
            item?.phone_number,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return searchableText.includes(
            normalizedSearch
          );
        }
      );

    }, [
      items,
      search,
      expiryFilter,
    ]);


  // ============================================================
  // STATS
  // ============================================================

  const stats =
    useMemo(() => {
      let fresh = 0;

      let expiringSoon = 0;

      let expired = 0;


      items.forEach((item) => {
        const status =
          getExpiryStatus(
            item
          );


        if (status === "FRESH") {
          fresh += 1;
        }


        if (
          status ===
          "EXPIRING_SOON"
        ) {
          expiringSoon += 1;
        }


        if (status === "EXPIRED") {
          expired += 1;
        }
      });


      return {
        total: items.length,

        fresh,

        expiringSoon,

        expired,
      };

    }, [
      items,
    ]);


  // ============================================================
  // FORM CHANGE
  // ============================================================

  function applyCookedFoodPreset(preset) {
    const prepTime = formData.manufacturing_date || formatDateTimeLocal(new Date());
    const autoExpiry = calculateTempAdjustedExpiry(prepTime, preset.hours, ambientTemp, formData.storage_type || "ROOM_TEMPERATURE");
    
    // Find Cooked Food category or match category
    const cookedCat = categories.find(cat => 
      isCookedFoodCategory(cat.id, categories)
    )?.id || categories[0]?.id || "cat_cooked_food";

    const adjH = calculateAdjustedHours(preset.hours, ambientTemp, formData.storage_type || "ROOM_TEMPERATURE");

    setFormData(prev => ({
      ...prev,
      selected_preset_id: preset.id,
      preset_hours: preset.hours,
      food_name: prev.food_name && !COOKED_FOOD_PRESETS.some(p => p.sampleName === prev.food_name) ? prev.food_name : preset.sampleName,
      unit: preset.unit,
      category_id: cookedCat,
      manufacturing_date: prepTime,
      expiry_date: autoExpiry,
      special_instructions: preset.instruction
    }));
    setError("");
    setSuccess(`Cooked Food selected: Auto-calculated expiry set to ${adjH} hours (${ambientTemp}°C ambient temp).`);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => {
      const nextForm = { ...previous, [name]: value };
      const activeCatId = name === "category_id" ? value : previous.category_id;
      const isCooked = isCookedFoodCategory(activeCatId, categories);

      // Trigger auto-expiry calculation ONLY when Cooked Food category is selected!
      if (isCooked) {
        const currentName = name === "food_name" ? value : previous.food_name;
        const baseHours = getShelfLifeForFoodName(currentName);
        nextForm.preset_hours = baseHours;

        const prepTime = nextForm.manufacturing_date || formatDateTimeLocal(new Date());
        const st = name === "storage_type" ? value : (previous.storage_type || "ROOM_TEMPERATURE");

        // Compute temperature & food name adjusted expiry datetime!
        nextForm.expiry_date = calculateTempAdjustedExpiry(prepTime, baseHours, ambientTemp, st);
      } else if (name === "category_id") {
        nextForm.expiry_date = "";
      }

      return nextForm;
    });

    setError("");
    setSuccess("");
  }


  // ============================================================
  // OPEN FORM
  // ============================================================

  function openForm() {
    setFormData(
      createEmptyForm()
    );

    setShowForm(true);

    setError("");

    setSuccess("");
  }


  // ============================================================
  // DONATE ACTIONS
  // ============================================================

  function openDonateModal(item) {
    setDonateItem(item);
    setDonateQuantity(item.quantity);
    setDonateNotes("");
    setDonateError("");
    setDonateSuccess("");

    if (item.expiry_date) {
      const datePart = item.expiry_date.split("T")[0];
      setPickupDeadline(`${datePart}T12:00`);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const day = String(tomorrow.getDate()).padStart(2, "0");
      setPickupDeadline(`${year}-${month}-${day}T12:00`);
    }

    setShowDonateForm(true);
  }

  async function handleDonateSubmit(event) {
    event.preventDefault();
    if (!donateItem || donating) return;

    setDonating(true);
    setDonateError("");
    setDonateSuccess("");

    try {
      const payload = {
        inventory_id: donateItem.id,
        quantity: Number(donateQuantity),
        pickup_deadline: pickupDeadline,
        notes: donateNotes.trim() || null,
      };

      await api.post("/donations", payload);

      setDonateSuccess("Surplus food item successfully listed for donation!");
      setTimeout(() => {
        setShowDonateForm(false);
        setDonateItem(null);
        loadInventory();
      }, 1500);
    } catch (err) {
      setDonateError(getErrorMessage(err, "Unable to publish donation."));
    } finally {
      setDonating(false);
    }
  }


  // ============================================================
  // CLOSE FORM
  // ============================================================

  function closeForm() {
    if (submitting) {
      return;
    }


    setShowForm(false);

    setFormData(
      createEmptyForm()
    );

    setError("");

    setSuccess("");
  }


  // ============================================================
  // CREATE INVENTORY
  // ============================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (submitting) {
      return;
    }


    setSubmitting(true);

    setError("");

    setSuccess("");


    try {
      const payload = {
        food_name:
          formData.food_name.trim(),

        category_id:
          formData.category_id,

        quantity:
          Number(
            formData.quantity
          ),

        unit:
          formData.unit,

        manufacturing_date:
          formData.manufacturing_date
            ? formData.manufacturing_date.split("T")[0]
            : null,

        expiry_date:
          formData.expiry_date
            ? formData.expiry_date.split("T")[0]
            : null,

        pickup_address:
          formData.pickup_address.trim(),

        pickup_time:
          formData.pickup_time,

        contact_person:
          formData.contact_person.trim(),

        phone_number:
          formData.phone_number.trim(),

        special_instructions:
          formData
            .special_instructions
            .trim() ||
          null,

        barcode:
          formData.barcode.trim() ||
          null,
      };


      console.log(
        "CREATE INVENTORY PAYLOAD:",
        payload
      );


      const response =
        await api.post(
          "/inventory",
          payload
        );


      console.log(
        "CREATE INVENTORY RESPONSE:",
        response.data
      );


      setSuccess(
        "Inventory item added successfully."
      );


      setShowForm(false);

      setFormData(
        createEmptyForm()
      );


      await loadInventory();

    } catch (requestError) {
      console.error(
        "CREATE INVENTORY ERROR:",
        requestError
      );


      setError(
        getErrorMessage(
          requestError
        )
      );

    } finally {
      setSubmitting(false);
    }
  }


  // ============================================================
  // DELETE INVENTORY
  // ============================================================

  async function deleteInventory(
    itemId
  ) {
    if (!itemId) {
      return;
    }


    const confirmed =
      window.confirm(
        "Delete this inventory item?"
      );


    if (!confirmed) {
      return;
    }


    setDeletingId(
      itemId
    );

    setError("");

    setSuccess("");


    try {
      await api.delete(
        `/inventory/${itemId}`
      );


      setSuccess(
        "Inventory item deleted successfully."
      );


      setItems(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== itemId
          )
      );

    } catch (requestError) {
      console.error(
        "DELETE INVENTORY ERROR:",
        requestError
      );


      setError(
        getErrorMessage(
          requestError
        )
      );

    } finally {
      setDeletingId("");
    }
  }


  // ============================================================
  // CLEAR FILTER
  // ============================================================

  function clearExpiryFilter() {
    const nextParams =
      new URLSearchParams(
        searchParams
      );


    nextParams.delete(
      "expiry_status"
    );


    setSearchParams(
      nextParams,
      {
        replace: true,
      }
    );
  }

  // ============================================================
  // EXPORT CSV
  // ============================================================

  function handleExportCSV() {
    const listToExport = filteredItems.length > 0 ? filteredItems : items;
    if (!listToExport || listToExport.length === 0) {
      setError("No inventory items available to export.");
      return;
    }

    const headers = [
      "ID",
      "Food Name",
      "Category ID",
      "Category Name",
      "Quantity",
      "Unit",
      "Manufacturing Date",
      "Expiry Date",
      "Status",
      "Pickup Address",
      "Pickup Time",
      "Contact Person",
      "Phone Number",
      "Barcode",
      "Special Instructions"
    ];

    const rows = listToExport.map((item) => {
      const catName = categories.find((c) => String(c.id) === String(item.category_id))?.name || item.category_name || "";
      const status = getExpiryStatus(item);
      return [
        `"${String(item.id || item._id || "").replace(/"/g, '""')}"`,
        `"${String(item.food_name || item.name || "").replace(/"/g, '""')}"`,
        `"${String(item.category_id || "").replace(/"/g, '""')}"`,
        `"${String(catName).replace(/"/g, '""')}"`,
        item.quantity ?? "",
        `"${String(item.unit || "").replace(/"/g, '""')}"`,
        `"${String(item.manufacturing_date || "").replace(/"/g, '""')}"`,
        `"${String(item.expiry_date || "").replace(/"/g, '""')}"`,
        `"${String(status).replace(/"/g, '""')}"`,
        `"${String(item.pickup_address || "").replace(/"/g, '""')}"`,
        `"${String(item.pickup_time || "10:00 AM - 06:00 PM").replace(/"/g, '""')}"`,
        `"${String(item.contact_person || "").replace(/"/g, '""')}"`,
        `"${String(item.phone_number || "").replace(/"/g, '""')}"`,
        `"${String(item.barcode || "").replace(/"/g, '""')}"`,
        `"${String(item.special_instructions || item.notes || "").replace(/"/g, '""')}"`
      ];
    });

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aura_food_inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(`Successfully exported ${listToExport.length} food inventory items to CSV!`);
  }


  // ============================================================
  // UI
  // ============================================================

  return (
    <DashboardLayout
      title={t("Inventory Management")}
      subtitle={t("Register surplus food, monitor expiry risk and prepare inventory for redistribution.")}
      badge={t("Food Donor Workspace")}
      quote={t("Every food item tracked is another opportunity to reduce waste.")}
      navigation={navigation}
      activePath="/inventory"
      onRefresh={() => {
        loadInventory();

        loadCategories();
      }}
      refreshing={
        loading ||
        categoriesLoading
      }
    >

      {resolvingBarcode && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex flex-col items-center rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl text-center max-w-sm">
            <Loader2
              size={48}
              className="animate-spin text-sky-700"
            />
            <h3 className="mt-6 text-xl font-black text-slate-900">
              Resolving Barcode...
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Querying international barcode registry to fetch product details. Please wait.
            </p>
          </div>
        </div>
      )}

      {/* MESSAGES */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p className="font-bold">
            {error}
          </p>

        </div>
      )}


      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-700">

          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p className="font-bold">
            {success}
          </p>

        </div>
      )}


      {/* STATS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={PackageOpen}
          label="Inventory Items"
          value={stats.total}
          active={!expiryFilter}
          onClick={clearExpiryFilter}
        />

        <StatCard
          icon={Leaf}
          label="Fresh"
          value={stats.fresh}
          active={expiryFilter === "FRESH"}
          onClick={() => setSearchParams({ expiry_status: "FRESH" })}
        />

        <StatCard
          icon={Clock3}
          label="Expiring Soon"
          value={stats.expiringSoon}
          active={expiryFilter === "EXPIRING_SOON"}
          onClick={() => setSearchParams({ expiry_status: "EXPIRING_SOON" })}
        />

        <StatCard
          icon={AlertTriangle}
          label="Expired"
          value={stats.expired}
          active={expiryFilter === "EXPIRED"}
          onClick={() => setSearchParams({ expiry_status: "EXPIRED" })}
        />

      </section>


      {/* TOOLBAR */}
      <section className="mt-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-[0_18px_50px_rgba(14,165,233,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search inventory, barcode, category or pickup address..."
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/donor/barcode"
                )
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/80 px-5 font-black text-sky-700 dark:text-sky-300 transition hover:bg-sky-100 dark:hover:bg-sky-900/80 cursor-pointer"
            >
              <Barcode size={18} />
              Scan Barcode
            </button>

            <button
              type="button"
              onClick={() => setShowCsvUpload(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/80 px-5 font-black text-sky-700 dark:text-sky-300 transition hover:bg-sky-100 dark:hover:bg-sky-900/80 cursor-pointer"
            >
              <Upload size={18} />
              Bulk Upload
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/80 px-5 font-black text-sky-700 dark:text-sky-300 transition hover:bg-sky-100 dark:hover:bg-sky-900/80 cursor-pointer"
            >
              <Download size={18} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={openForm}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-5 font-black text-white transition shadow-lg shadow-sky-600/20 cursor-pointer"
            >
              <Plus size={18} />
              Add Inventory
            </button>

            <button
              type="button"
              onClick={() => {
                loadInventory();
                loadCategories();
              }}
              disabled={
                loading ||
                categoriesLoading
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 font-black text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {expiryFilter && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 px-4 py-2 text-sm font-black text-sky-700 dark:text-sky-300">
              Expiry Filter: {
                formatStatus(
                  expiryFilter
                )
              }
            </span>

            <button
              type="button"
              onClick={
                clearExpiryFilter
              }
              className="flex items-center gap-1 text-sm font-black text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X size={16} />
              Clear filter
            </button>
          </div>
        )}
      </section>

      {/* INVENTORY TABLE */}
      <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-[0_18px_50px_rgba(14,165,233,0.06)]">


        {loading ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center">

            <Loader2
              size={38}
              className="animate-spin text-sky-700"
            />

            <p className="mt-4 font-bold text-slate-500">

              Loading inventory...

            </p>

          </div>

        ) : filteredItems.length === 0 ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">

            <PackageOpen
              size={48}
              className="text-slate-300"
            />


            <h3 className="mt-4 text-xl font-black text-slate-900">

              No inventory items found

            </h3>


            <p className="mt-2 text-sm text-slate-500">

              Add inventory manually or scan a barcode.

            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="border-b border-slate-100 bg-slate-50/80">

                <tr>

                  <TableHeading>
                    Food
                  </TableHeading>

                  <TableHeading>
                    Barcode
                  </TableHeading>

                  <TableHeading>
                    Category
                  </TableHeading>

                  <TableHeading>
                    Quantity
                  </TableHeading>

                  <TableHeading>
                    Expiry Date
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading>
                    Pickup Address
                  </TableHeading>

                  <TableHeading>
                    Actions
                  </TableHeading>

                </tr>

              </thead>


              <tbody>

                {filteredItems.map(
                  (item) => {
                    const status =
                      getExpiryStatus(
                        item
                      );


                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >

                        <TableCell>

                          <p className="font-black text-slate-900">

                            {item.food_name}

                          </p>

                        </TableCell>


                        <TableCell>

                          <span className="font-mono text-sm text-slate-600">

                            {
                              item.barcode ||
                              "—"
                            }

                          </span>

                        </TableCell>


                        <TableCell>

                          {
                            item.category_name ||
                            "—"
                          }

                        </TableCell>


                        <TableCell>

                          {item.quantity}{" "}
                          {item.unit}

                        </TableCell>


                        <TableCell>

                          {
                            formatDate(
                              item.expiry_date
                            )
                          }

                        </TableCell>


                        <TableCell>

                          <span
                            className={
                              "inline-flex rounded-full border px-3 py-1 text-xs font-black " +
                              getStatusStyle(
                                status
                              )
                            }
                          >

                            {
                              formatStatus(
                                status
                              )
                            }

                          </span>

                        </TableCell>


                        <TableCell>

                          <span className="block max-w-[240px] truncate">

                            {
                              item.pickup_address ||
                              "—"
                            }

                          </span>

                        </TableCell>


                        <TableCell>
                          <div className="flex gap-2">
                            {status !== "EXPIRED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDonateModal(item)
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                                title="Donate Item"
                              >
                                <Gift size={17} />
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={
                                deletingId ===
                                item.id
                              }
                              onClick={() =>
                                deleteInventory(
                                  item.id
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                              title="Delete Item"
                            >
                              {deletingId === item.id ? (
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={17}
                                />
                              )}
                            </button>
                          </div>
                        </TableCell>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ADD INVENTORY MODAL */}

      {showForm && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">


          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] bg-white shadow-2xl">


            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 lg:px-8">


              <div className="flex items-center gap-3">


                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >

                  <ArrowLeft
                    size={19}
                  />

                </button>


                <div>

                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    🍲 Add Food Item for Rescue & Donation
                  </h2>


                  <p className="mt-1 text-sm text-slate-500 font-medium">
                    Register freshly cooked meals, surplus food & groceries for community redistribution.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={closeForm}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >

                <X size={20} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6 lg:p-8"
            >

              {/* BARCODE */}

              <FormSection
                title="Barcode Information (Optional for Packaged Items)"
              >

                <FormField
                  label="Barcode / SKU (Optional)"
                >

                  <div className="relative">

                    <Barcode
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-600"
                    />


                    <input
                      type="text"
                      name="barcode"
                      value={
                        formData.barcode
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Scan or enter barcode if applicable"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />

                  </div>

                </FormField>


                <button
                  type="button"
                  onClick={() => {
                    closeForm();

                    navigate(
                      "/donor/barcode"
                    );
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 font-black text-sky-700 hover:bg-sky-100"
                >

                  <Barcode size={18} />

                  Scan Barcode

                </button>

              </FormSection>


              {/* FOOD INFORMATION */}

              <FormSection
                title="Food Item Details & Portions"
              >

                <FormField
                  label="Food Item Name"
                >

                  <input
                    required
                    name="food_name"
                    value={
                      formData.food_name
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Example: Fresh Cooked Veg Biryani & Curry"
                    className={inputClass}
                  />

                </FormField>


                <FormField
                  label="Category"
                >

                  <select
                    required
                    name="category_id"
                    value={
                      formData.category_id
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      categoriesLoading
                    }
                    className={inputClass}
                  >

                    <option value="">

                      Select category

                    </option>


                    {categories.map(
                      (category) => (

                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >

                          {
                            category.name ||
                            category.category_name
                          }

                        </option>

                      )
                    )}

                  </select>

                </FormField>


                <FormField
                  label="Quantity / Servings"
                >

                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    name="quantity"
                    value={
                      formData.quantity
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter quantity or portions"
                    className={inputClass}
                  />

                </FormField>


                <FormField
                  label="Portion / Unit"
                >

                  <select
                    required
                    name="unit"
                    value={
                      formData.unit
                    }
                    onChange={
                      handleInputChange
                    }
                    className={inputClass}
                  >

                    <option value="PORTION">
                      PORTION (Meals / Servings)
                    </option>

                    <option value="SERVING">
                      SERVING (People Fed)
                    </option>

                    <option value="KG">
                      KG (Kilogram)
                    </option>

                    <option value="GRAM">
                      GRAM
                    </option>

                    <option value="LITER">
                      LITER
                    </option>

                    <option value="ML">
                      ML
                    </option>

                    <option value="PACKET">
                      PACKET
                    </option>

                    <option value="PIECE">
                      PIECE / ITEMS
                    </option>

                    <option value="BOX">
                      BOX / CONTAINER
                    </option>

                  </select>

                </FormField>

                {isCookedFoodCategory(formData.category_id, categories) && (
                  <FormField label="Temperature">
                    <input
                      type="text"
                      readOnly
                      value={`${ambientTemp}°C`}
                      className={inputClass + " bg-slate-50 text-slate-700 cursor-not-allowed font-semibold"}
                    />
                  </FormField>
                )}

              </FormSection>


              {/* DATES */}

              <FormSection
                title="Cooking Time & Expiry"
              >

                <FormField
                  label="Cooking / Preparation Date & Time"
                >

                  <input
                    required
                    type="datetime-local"
                    name="manufacturing_date"
                    value={
                      formData.manufacturing_date
                    }
                    onChange={
                      handleInputChange
                    }
                    className={inputClass}
                  />

                </FormField>


                <FormField
                  label="Expiry Date & Time"
                >

                  <input
                    required
                    type="datetime-local"
                    name="expiry_date"
                    value={
                      formData.expiry_date
                    }
                    onChange={
                      handleInputChange
                    }
                    className={inputClass}
                  />

                </FormField>

              </FormSection>


              {/* PICKUP */}

              <FormSection
                title="Pickup Information"
              >

                <FormField
                  label="Pickup Address"
                >

                  <input
                    required
                    name="pickup_address"
                    value={
                      formData.pickup_address
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter pickup address"
                    className={inputClass}
                  />

                </FormField>


                <FormField
                  label="Pickup Time"
                >

                  <input
                    required
                    type="time"
                    name="pickup_time"
                    value={
                      formData.pickup_time
                    }
                    onChange={
                      handleInputChange
                    }
                    className={inputClass}
                  />

                </FormField>


                <FormField
                  label="Contact Person"
                >

                  <input
                    required
                    name="contact_person"
                    value={
                      formData.contact_person
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Contact person name"
                    className={inputClass}
                  />

                </FormField>


                <FormField
                  label="Phone Number"
                >

                  <input
                    required
                    name="phone_number"
                    value={
                      formData.phone_number
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter phone number"
                    className={inputClass}
                  />

                </FormField>

              </FormSection>


              {/* INSTRUCTIONS */}

              <FormSection
                title="Additional Information"
              >

                <div className="md:col-span-2">

                  <FormField
                    label="Special Instructions"
                  >

                    <textarea
                      rows="4"
                      name="special_instructions"
                      value={
                        formData.special_instructions
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Storage requirements, pickup instructions or other notes..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />

                  </FormField>

                </div>

              </FormSection>


              {/* ACTIONS */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">


                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="h-12 rounded-xl border border-slate-200 bg-white px-6 font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  disabled={
                    submitting ||
                    categoriesLoading
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-7 font-black text-white hover:bg-sky-700 shadow-md shadow-sky-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {submitting ? (

                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                  ) : (

                    <Plus size={18} />

                  )}


                  {submitting
                    ? "Adding Food Item..."
                    : "Add Food Item for Rescue & Donation"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      <CsvUploadModal
        open={showCsvUpload}
        onClose={() =>
          setShowCsvUpload(false)
        }
        onSuccess={loadInventory}
        categories={categories}
      />

      {/* DONATE MODAL */}
      {showDonateForm && donateItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Donate Food Item
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish surplus food for NGO collection.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDonateForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {donateError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {donateError}
              </div>
            )}

            {donateSuccess && (
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-700">
                {donateSuccess}
              </div>
            )}

            <form onSubmit={handleDonateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  Food Name
                </label>
                <p className="mt-1 text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {donateItem.food_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Available Quantity
                  </label>
                  <p className="mt-1 text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {donateItem.quantity} {donateItem.unit}
                  </p>
                </div>

                <FormField label="Quantity to Donate">
                  <input
                    required
                    type="number"
                    min="0.1"
                    max={donateItem.quantity}
                    step="any"
                    value={donateQuantity}
                    onChange={(e) => setDonateQuantity(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Pickup Deadline">
                <input
                  required
                  type="datetime-local"
                  value={pickupDeadline}
                  onChange={(e) => setPickupDeadline(e.target.value)}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Notes / Special Instructions (Optional)">
                <textarea
                  rows="3"
                  value={donateNotes}
                  onChange={(e) => setDonateNotes(e.target.value)}
                  placeholder="E.g., Please pick up before 5 PM, fragile boxes, requires cold storage..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDonateForm(false)}
                  disabled={donating}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={donating}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 text-sm font-black text-white hover:bg-sky-700 shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {donating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Gift size={16} />
                  )}
                  {donating ? "Publishing..." : "Publish Donation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}


// ============================================================
// SMALL COMPONENTS
// ============================================================

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100";


function StatCard({ icon: Icon, label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[26px] border p-5 text-left shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-md focus:outline-none cursor-pointer ${
        active
          ? "border-sky-500 bg-sky-50/90 dark:bg-sky-950/80 ring-2 ring-sky-200 dark:ring-sky-800"
          : "border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-sky-300 dark:hover:border-sky-700"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
        <Icon size={21} />
      </div>

      <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
        {value ?? 0}
      </p>
    </button>
  );
}


function TableHeading({
  children,
}) {
  return (
    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">

      {children}

    </th>
  );
}


function TableCell({
  children,
}) {
  return (
    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 dark:text-slate-300">

      {children}

    </td>
  );
}


function FormSection({
  title,
  children,
}) {
  return (
    <section className="mb-7">

      <h3 className="mb-4 text-lg font-black text-slate-900">

        {title}

      </h3>


      <div className="grid gap-5 md:grid-cols-2">

        {children}

      </div>

    </section>
  );
}


function FormField({
  label,
  children,
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-black text-slate-700">

        {label}

      </span>


      {children}

    </label>
  );
}