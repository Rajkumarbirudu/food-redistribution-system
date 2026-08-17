import csv
import io
import re
from datetime import date, datetime, timedelta, timezone
from bson import ObjectId
from fastapi import (
    HTTPException,
    UploadFile,
    status,
)
from pydantic import ValidationError

from app.database import get_database
from app.schemas.inventory_schema import (
    ALLOWED_UNITS,
    InventoryCreate,
)

MAX_CSV_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_ROWS = 2000

COLUMN_ALIASES = {
    "food_name": [
        "food_name", "foodname", "food", "name", "item_name", "itemname",
        "item", "title", "product", "product_name", "dish_name", "food_item"
    ],
    "category_id": [
        "category_id", "categoryid", "cat_id", "catid"
    ],
    "category_name": [
        "category_name", "categoryname", "category", "cat_name", "cat", "type"
    ],
    "quantity": [
        "quantity", "qty", "count", "amount", "num_items", "total_quantity", "portions"
    ],
    "unit": [
        "unit", "units", "uom", "measurement", "package_type", "unit_of_measure"
    ],
    "manufacturing_date": [
        "manufacturing_date", "mfg_date", "mfg", "manufacture_date", "cooked_date", "prepared_date", "prep_date"
    ],
    "expiry_date": [
        "expiry_date", "expiry", "exp_date", "exp", "expiration_date", "expiration", "use_by", "best_before", "best_before_date"
    ],
    "pickup_address": [
        "pickup_address", "pickup_location", "address", "location", "donor_address"
    ],
    "pickup_time": [
        "pickup_time", "pickup_window", "time", "pickup_hours", "collection_time", "timing"
    ],
    "contact_person": [
        "contact_person", "contact_name", "contact", "person", "donor_name", "full_name"
    ],
    "phone_number": [
        "phone_number", "phone", "mobile", "mobile_number", "contact_phone", "tel"
    ],
    "barcode": [
        "barcode", "upc", "ean", "sku", "code"
    ],
    "special_instructions": [
        "special_instructions", "instructions", "notes", "description", "note", "storage_instructions"
    ],
}


def clean_str(val) -> str | None:
    if val is None:
        return None
    cleaned = str(val).strip()
    return cleaned if cleaned != "" else None


def normalize_header_key(key: str) -> str:
    if not key:
        return ""
    # remove special chars, convert spaces/hyphens to underscore
    s = str(key).strip().lower()
    s = re.sub(r"[^\w\s]", "", s)
    s = re.sub(r"[\s\-]+", "_", s)
    return s


def parse_date_flexible(val) -> str:
    if not val:
        # Default expiry: 3 days from now
        return (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")
    val_str = str(val).strip().split("T")[0].split(" ")[0]
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y",
        "%Y/%m/%d", "%d.%m.%Y", "%Y.%m.%d", "%b %d, %Y", "%d %b %Y"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(val_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return val_str


def parse_quantity_and_unit(qty_val, unit_val) -> tuple[float, str]:
    unit = "KG"
    if unit_val:
        u = str(unit_val).strip().upper()
        if u in ALLOWED_UNITS:
            unit = u
        elif u in ["PCS", "PIECES", "PIECE", "NOS", "ITEMS", "COUNT"]:
            unit = "PIECE"
        elif u in ["KGS", "KILO", "KILOS", "KILOGRAM", "KILOGRAMS"]:
            unit = "KG"
        elif u in ["GMS", "GM", "G", "GRAMS"]:
            unit = "GRAM"
        elif u in ["L", "LTR", "LTRS", "LITRE", "LITRES", "LITERS"]:
            unit = "LITER"
        elif u in ["MLS", "MILLILITER", "MILLILITRE"]:
            unit = "ML"
        elif u in ["BOXES", "PKTS", "PACKETS", "PACK", "PACKS"]:
            unit = "BOX" if "BOX" in u else "PACKET"
        elif u in ["SERVINGS", "PORTIONS", "MEALS", "PLATES"]:
            unit = "SERVING"

    qty = 1.0
    if qty_val is not None:
        raw = str(qty_val).strip()
        match = re.search(r"(\d+(\.\d+)?)", raw)
        if match:
            try:
                qty = float(match.group(1))
            except ValueError:
                qty = 1.0
        # If unit wasn't specified but quantity had text (e.g. "5 boxes")
        if not unit_val:
            raw_lower = raw.lower()
            if "box" in raw_lower: unit = "BOX"
            elif "pkt" in raw_lower or "pack" in raw_lower: unit = "PACKET"
            elif "pc" in raw_lower or "piece" in raw_lower: unit = "PIECE"
            elif "kg" in raw_lower: unit = "KG"
            elif "gm" in raw_lower or "gram" in raw_lower: unit = "GRAM"
            elif "liter" in raw_lower or "litre" in raw_lower or " l" in raw_lower: unit = "LITER"
            elif "serv" in raw_lower or "meal" in raw_lower: unit = "SERVING"

    return max(0.01, qty), unit


async def resolve_category_id(cat_id_val, cat_name_val, database) -> str:
    # 1. If valid ObjectId string and exists in db
    if cat_id_val and ObjectId.is_valid(str(cat_id_val)):
        found = await database.categories.find_one({"_id": ObjectId(str(cat_id_val))})
        if found:
            return str(found["_id"])

    # 2. If category name provided, look up by name
    search_name = clean_str(cat_name_val) or clean_str(cat_id_val) or ""
    if search_name:
        found = await database.categories.find_one(
            {"name": {"$regex": f"^{re.escape(search_name)}$", "$options": "i"}}
        )
        if found:
            return str(found["_id"])
        # Partial match
        found_partial = await database.categories.find_one(
            {"name": {"$regex": re.escape(search_name), "$options": "i"}}
        )
        if found_partial:
            return str(found_partial["_id"])

    # 3. Fallback to first active category in database
    first_cat = await database.categories.find_one({"is_active": {"$ne": False}})
    if first_cat:
        return str(first_cat["_id"])

    # 4. Fallback default
    return "65c3ab21e4b0a1a2c3d4e5f6"


def validation_error_text(error: ValidationError) -> str:
    messages = []
    for validation_error in error.errors():
        location = ".".join(str(part) for part in validation_error.get("loc", []))
        message = validation_error.get("msg", "Invalid value")
        messages.append(f"{location}: {message}")
    return "; ".join(messages)


async def import_inventory_csv(
    file: UploadFile,
    current_user: dict,
):
    filename = (file.filename or "").strip()
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed (.csv extension required)",
        )

    content = await file.read()
    if not content or len(content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV file is empty",
        )

    if len(content) > MAX_CSV_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="CSV file exceeds the 10 MB size limit",
        )

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV must use UTF-8 or Latin-1 text encoding",
            )

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV header row is missing or empty",
        )

    database = get_database()

    from app.routes.inventory_routes import (
        build_inventory_document,
        serialize_inventory,
    )
    from app.services.inventory_service import (
        create_inventory_item,
    )

    imported_items = []
    errors = []
    processed_count = 0

    # User defaults for missing columns
    default_address = clean_str(current_user.get("address")) or "100 Market Way, City Center"
    default_contact = (
        clean_str(current_user.get("full_name"))
        or clean_str(current_user.get("organization_name"))
        or "Aura Food Donor"
    )
    default_phone = clean_str(current_user.get("phone_number")) or "9876543210"
    # Ensure phone has 10 digits
    phone_clean = re.sub(r"\D", "", default_phone)
    if len(phone_clean) < 10:
        phone_clean = "9876543210"
    default_phone = phone_clean[:15]

    for row_number, raw_row in enumerate(reader, start=2):
        if not raw_row or not any(clean_str(v) for v in raw_row.values()):
            continue

        if processed_count >= MAX_ROWS:
            errors.append({
                "row": row_number,
                "error": f"Maximum row limit ({MAX_ROWS}) reached.",
            })
            break

        processed_count += 1

        # Map row keys through normalized aliases
        norm_row = {}
        for k, v in raw_row.items():
            if k is not None:
                clean_k = normalize_header_key(k)
                norm_row[clean_k] = clean_str(v)

        standard_row = {}
        for standard_key, aliases in COLUMN_ALIASES.items():
            for alias in aliases:
                if alias in norm_row and norm_row[alias] is not None:
                    standard_row[standard_key] = norm_row[alias]
                    break

        # If food_name wasn't matched by alias, check first non-empty column
        food_name = standard_row.get("food_name")
        if not food_name:
            for val in raw_row.values():
                if clean_str(val) and not str(val).isdigit():
                    food_name = str(val).strip()
                    break
        if not food_name:
            food_name = f"Food Item #{processed_count}"

        # Resolve category
        category_id = await resolve_category_id(
            standard_row.get("category_id"),
            standard_row.get("category_name"),
            database,
        )

        # Parse quantity and unit
        quantity, unit = parse_quantity_and_unit(
            standard_row.get("quantity"),
            standard_row.get("unit"),
        )

        # Parse dates
        expiry_date = parse_date_flexible(standard_row.get("expiry_date"))
        manufacturing_date = None
        if standard_row.get("manufacturing_date"):
            try:
                manufacturing_date = parse_date_flexible(standard_row["manufacturing_date"])
            except Exception:
                manufacturing_date = None

        # Resolve contact & pickup details with fallbacks
        pickup_address = standard_row.get("pickup_address") or default_address
        pickup_time = standard_row.get("pickup_time") or "10:00 AM - 06:00 PM"
        contact_person = standard_row.get("contact_person") or default_contact
        
        row_phone = standard_row.get("phone_number") or default_phone
        row_phone_digits = re.sub(r"\D", "", row_phone)
        if len(row_phone_digits) < 10:
            row_phone_digits = default_phone
        phone_number = row_phone_digits[:15]

        payload = {
            "food_name": food_name,
            "category_id": category_id,
            "quantity": quantity,
            "unit": unit,
            "manufacturing_date": manufacturing_date,
            "expiry_date": expiry_date,
            "pickup_address": pickup_address,
            "pickup_time": pickup_time,
            "contact_person": contact_person,
            "phone_number": phone_number,
            "barcode": standard_row.get("barcode"),
            "special_instructions": standard_row.get("special_instructions"),
        }

        try:
            inventory_data = InventoryCreate(**payload)
            document = await build_inventory_document(inventory_data, current_user)
            created_item = await create_inventory_item(document)
            imported_items.append(serialize_inventory(created_item))
        except ValidationError as error:
            errors.append({
                "row": row_number,
                "error": validation_error_text(error),
            })
        except HTTPException as error:
            errors.append({
                "row": row_number,
                "error": str(error.detail),
            })
        except Exception as error:
            errors.append({
                "row": row_number,
                "error": f"{type(error).__name__}: {error}",
            })

    if processed_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file contains no valid data rows",
        )

    return {
        "message": (
            f"CSV import completed: {len(imported_items)} item(s) imported successfully."
            + (f" ({len(errors)} failed)" if errors else "")
        ),
        "imported_count": len(imported_items),
        "failed_count": len(errors),
        "total_rows": processed_count,
        "total_processed": processed_count,
        "errors": errors,
        "items": imported_items,
    }