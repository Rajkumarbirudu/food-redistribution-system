from pydantic import BaseModel, Field, field_validator

from app.models.enums import (
    PerishabilityRisk,
    StorageRequirement,
)


class CategoryCreateRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    description: str = Field(
        min_length=2,
        max_length=500,
    )

    perishability_risk: PerishabilityRisk

    storage_requirement: StorageRequirement

    default_expiry_warning_days: int = Field(
        ge=1,
        le=30,
    )

    @field_validator(
        "name",
        "description",
        mode="before",
    )
    @classmethod
    def clean_text(cls, value):
        if not isinstance(value, str):
            return value

        cleaned_value = " ".join(
            value.split()
        )

        if not cleaned_value:
            raise ValueError(
                "Value cannot be empty"
            )

        return cleaned_value


class CategoryUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        min_length=2,
        max_length=500,
    )

    perishability_risk: (
        PerishabilityRisk | None
    ) = None

    storage_requirement: (
        StorageRequirement | None
    ) = None

    default_expiry_warning_days: (
        int | None
    ) = Field(
        default=None,
        ge=1,
        le=30,
    )

    @field_validator(
        "name",
        "description",
        mode="before",
    )
    @classmethod
    def clean_optional_text(cls, value):
        if value is None:
            return None

        if not isinstance(value, str):
            return value

        cleaned_value = " ".join(
            value.split()
        )

        if not cleaned_value:
            raise ValueError(
                "Value cannot be empty"
            )

        return cleaned_value


class CategoryResponse(BaseModel):
    id: str

    name: str

    description: str

    perishability_risk: PerishabilityRisk

    storage_requirement: StorageRequirement

    default_expiry_warning_days: int

    is_active: bool