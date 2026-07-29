from datetime import datetime

from pydantic import BaseModel, Field, field_validator


# ============================================================
# CREATE DONATION
# ============================================================

class DonationCreate(BaseModel):
    inventory_id: str

    quantity: float = Field(gt=0)

    pickup_deadline: datetime

    notes: str | None = Field(
        default=None,
        max_length=500,
    )

    @field_validator("inventory_id")
    @classmethod
    def clean_inventory_id(
        cls,
        value: str,
    ) -> str:
        return value.strip()

    @field_validator("notes")
    @classmethod
    def clean_notes(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = " ".join(
            value.split()
        )

        return cleaned or None


# ============================================================
# PICKUP DETAILS
# ============================================================

class PickupScheduleRequest(BaseModel):
    pickup_date: datetime

    pickup_time: str = Field(
        min_length=1,
        max_length=20,
    )

    vehicle_number: str = Field(
        min_length=1,
        max_length=50,
    )

    driver_name: str = Field(
        min_length=1,
        max_length=100,
    )

    volunteer_name: str = Field(
        min_length=1,
        max_length=100,
    )

    special_instructions: str | None = Field(
        default=None,
        max_length=500,
    )

    @field_validator(
        "pickup_time",
        "vehicle_number",
        "driver_name",
        "volunteer_name",
    )
    @classmethod
    def clean_required_text(
        cls,
        value: str,
    ) -> str:
        cleaned = " ".join(
            value.split()
        )

        if not cleaned:
            raise ValueError(
                "Field cannot be empty"
            )

        return cleaned

    @field_validator(
        "special_instructions"
    )
    @classmethod
    def clean_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = " ".join(
            value.split()
        )

        return cleaned or None


# ============================================================
# DONATION RESPONSE
# ============================================================

class DonationResponse(BaseModel):
    id: str

    inventory_id: str

    tenant_id: str

    donor_id: str | None = None

    ngo_id: str | None = None

    food_name: str

    category_id: str

    category_name: str

    quantity: float

    unit: str

    pickup_address: str

    pickup_time: str

    contact_person: str

    phone_number: str

    expiry_date: datetime

    pickup_deadline: datetime

    notes: str | None = None

    status: str

    pickup_date: datetime | None = None

    scheduled_pickup_time: str | None = None

    vehicle_number: str | None = None

    driver_name: str | None = None

    volunteer_name: str | None = None

    special_instructions: str | None = None

    delivery_partner_id: str | None = None

    delivery_boy_id: str | None = None

    delivery_boy_name: str | None = None

    accepted_at: datetime | None = None

    pickup_scheduled_at: datetime | None = None

    picked_up_at: datetime | None = None

    completed_at: datetime | None = None

    cancelled_at: datetime | None = None

    created_at: datetime

    updated_at: datetime


# ============================================================
# GENERIC ACTION RESPONSE
# ============================================================

class DonationActionResponse(BaseModel):
    message: str

    donation: DonationResponse


# ============================================================
# EXISTING CANCEL RESPONSE COMPATIBILITY
# ============================================================

class DonationCancelResponse(BaseModel):
    message: str

    donation: DonationResponse