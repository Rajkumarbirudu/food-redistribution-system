from datetime import date, datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


ALLOWED_UNITS = {
    "KG",
    "GRAM",
    "LITRE",
    "LITER",
    "ML",
    "PIECE",
    "PACKET",
    "BOX",
    "DOZEN",
    "SERVING",
    "PORTION",
}


class InventoryCreate(BaseModel):
    food_name: str = Field(
        min_length=2,
        max_length=150,
    )

    category_id: str = Field(
        min_length=1,
        max_length=150,
    )

    quantity: float = Field(
        gt=0,
    )

    unit: str = Field(
        default="KG",
        min_length=1,
        max_length=30,
    )

    manufacturing_date: Optional[date] = None

    expiry_date: date

    pickup_address: Optional[str] = Field(
        default="Home Address",
        max_length=500,
    )

    pickup_time: Optional[str] = Field(
        default="09:00 AM - 08:00 PM",
        max_length=100,
    )

    contact_person: Optional[str] = Field(
        default="Home Donor",
        max_length=150,
    )

    phone_number: Optional[str] = Field(
        default="9876543210",
        max_length=20,
    )

    barcode: Optional[str] = Field(
        default=None,
        max_length=150,
    )

    special_instructions: Optional[str] = Field(
        default=None,
        max_length=1000,
    )

    @field_validator(
        "food_name",
        "pickup_address",
        "contact_person",
    )
    @classmethod
    def clean_required_text(
        cls,
        value: str,
    ) -> str:
        return " ".join(value.split())

    @field_validator(
        "barcode",
        "special_instructions",
        mode="before",
    )
    @classmethod
    def clean_optional_text(
        cls,
        value,
    ):
        if value is None:
            return None

        cleaned = str(value).strip()

        if not cleaned:
            return None

        return cleaned

    @field_validator("unit")
    @classmethod
    def validate_unit(
        cls,
        value: str,
    ) -> str:
        normalized = value.strip().upper()

        if normalized not in ALLOWED_UNITS:
            raise ValueError(
                "Unit must be one of: "
                + ", ".join(
                    sorted(ALLOWED_UNITS)
                )
            )

        return normalized

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(
        cls,
        value: str,
    ) -> str:
        cleaned = value.strip()

        if not cleaned.isdigit():
            raise ValueError(
                "Phone number must contain only digits"
            )

        if not 10 <= len(cleaned) <= 15:
            raise ValueError(
                "Phone number must contain 10 to 15 digits"
            )

        return cleaned

    @field_validator("category_id")
    @classmethod
    def clean_category_id(
        cls,
        value: str,
    ) -> str:
        return value.strip()

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.manufacturing_date is not None
            and self.expiry_date
            < self.manufacturing_date
        ):
            raise ValueError(
                "Expiry date cannot be before manufacturing date"
            )

        return self


class InventoryUpdate(BaseModel):
    food_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    category_id: Optional[str] = Field(
        default=None,
        min_length=24,
        max_length=24,
    )

    quantity: Optional[float] = Field(
        default=None,
        gt=0,
    )

    unit: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    manufacturing_date: Optional[date] = None

    expiry_date: Optional[date] = None

    pickup_address: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=500,
    )

    pickup_time: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    contact_person: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    phone_number: Optional[str] = Field(
        default=None,
        min_length=10,
        max_length=15,
    )

    barcode: Optional[str] = Field(
        default=None,
        max_length=150,
    )

    special_instructions: Optional[str] = Field(
        default=None,
        max_length=1000,
    )

    @field_validator("unit")
    @classmethod
    def validate_unit(
        cls,
        value,
    ):
        if value is None:
            return None

        normalized = value.strip().upper()

        if normalized not in ALLOWED_UNITS:
            raise ValueError(
                "Invalid inventory unit"
            )

        return normalized

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(
        cls,
        value,
    ):
        if value is None:
            return None

        cleaned = value.strip()

        if not cleaned.isdigit():
            raise ValueError(
                "Phone number must contain only digits"
            )

        return cleaned


class InventoryResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )

    id: str

    food_name: str

    category_id: str

    category_name: Optional[str] = None

    quantity: float

    unit: str

    manufacturing_date: Optional[date] = None

    expiry_date: date

    pickup_address: str

    pickup_time: str

    contact_person: str

    phone_number: str

    barcode: Optional[str] = None

    special_instructions: Optional[str] = None

    days_until_expiry: Optional[int] = None

    expiry_status: Optional[str] = None

    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None


# Compatibility aliases for older files in your project.

InventoryCreateRequest = InventoryCreate

InventoryUpdateRequest = InventoryUpdate