import csv
import io

from fastapi import (
    HTTPException,
    UploadFile,
    status,
)

from pydantic import ValidationError

from app.schemas.inventory_schema import (
    InventoryCreate,
)


REQUIRED_COLUMNS = {
    "food_name",
    "category_id",
    "quantity",
    "unit",
    "expiry_date",
    "pickup_address",
    "pickup_time",
    "contact_person",
    "phone_number",
}


MAX_CSV_SIZE = 5 * 1024 * 1024

MAX_ROWS = 1000


def clean_value(value):
    if value is None:
        return None

    value = str(value).strip()

    if value == "":
        return None

    return value


def validation_error_text(
    error: ValidationError,
) -> str:
    messages = []

    for validation_error in error.errors():
        location = ".".join(
            str(part)
            for part in validation_error.get(
                "loc",
                [],
            )
        )

        message = validation_error.get(
            "msg",
            "Invalid value",
        )

        messages.append(
            f"{location}: {message}"
        )

    return "; ".join(messages)


async def import_inventory_csv(
    file: UploadFile,
    current_user: dict,
):
    filename = (
        file.filename or ""
    ).strip()

    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty",
        )

    if len(content) > MAX_CSV_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="CSV file exceeds the 5 MB limit",
        )

    try:
        text = content.decode("utf-8-sig")

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV must use UTF-8 encoding",
        )

    reader = csv.DictReader(
        io.StringIO(text)
    )

    if reader.fieldnames is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV header is missing",
        )

    # Normalize header whitespace.

    reader.fieldnames = [
        str(header).strip()
        for header in reader.fieldnames
    ]

    missing_columns = (
        REQUIRED_COLUMNS
        - set(reader.fieldnames)
    )

    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Missing CSV columns: "
                + ", ".join(
                    sorted(missing_columns)
                )
            ),
        )

    # Delayed imports prevent circular imports.

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

    for row_number, row in enumerate(
        reader,
        start=2,
    ):
        # Ignore completely empty rows.

        if not any(
            clean_value(value)
            for value in row.values()
        ):
            continue

        if processed_count >= MAX_ROWS:
            errors.append(
                {
                    "row": row_number,
                    "error":
                        "Maximum CSV row limit reached",
                }
            )

            break

        processed_count += 1

        payload = {
            "food_name":
                clean_value(
                    row.get("food_name")
                ),

            "category_id":
                clean_value(
                    row.get("category_id")
                ),

            "quantity":
                clean_value(
                    row.get("quantity")
                ),

            "unit":
                clean_value(
                    row.get("unit")
                ),

            "manufacturing_date":
                clean_value(
                    row.get("manufacturing_date")
                ),

            "expiry_date":
                clean_value(
                    row.get("expiry_date")
                ),

            "pickup_address":
                clean_value(
                    row.get("pickup_address")
                ),

            "pickup_time":
                clean_value(
                    row.get("pickup_time")
                ),

            "contact_person":
                clean_value(
                    row.get("contact_person")
                ),

            "phone_number":
                clean_value(
                    row.get("phone_number")
                ),

            "barcode":
                clean_value(
                    row.get("barcode")
                ),

            "special_instructions":
                clean_value(
                    row.get(
                        "special_instructions"
                    )
                ),
        }

        try:
            inventory_data = InventoryCreate(
                **payload
            )

            document = (
                await build_inventory_document(
                    inventory_data,
                    current_user,
                )
            )

            created_item = (
                await create_inventory_item(
                    document
                )
            )

            imported_items.append(
                serialize_inventory(
                    created_item
                )
            )

        except ValidationError as error:
            errors.append(
                {
                    "row": row_number,
                    "error":
                        validation_error_text(
                            error
                        ),
                }
            )

        except HTTPException as error:
            errors.append(
                {
                    "row": row_number,
                    "error":
                        str(error.detail),
                }
            )

        except Exception as error:
            errors.append(
                {
                    "row": row_number,
                    "error":
                        f"{type(error).__name__}: {error}",
                }
            )

    if processed_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV contains no data rows",
        )

    # Important:
    # Return 200 even when individual rows fail.
    # The frontend can display the row errors.

    return {
        "message": (
            f"CSV import completed: "
            f"{len(imported_items)} imported, "
            f"{len(errors)} failed."
        ),

        "imported_count":
            len(imported_items),

        "failed_count":
            len(errors),

        "total_processed":
            processed_count,

        "errors":
            errors,

        "items":
            imported_items,
    }