from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.enums import UserRole


class UserRegister(BaseModel):
    role: UserRole

    organization_name: str | None = Field(
        default=None,
        max_length=150,
    )

    full_name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    phone_number: str = Field(
        min_length=10,
        max_length=15,
    )

    address: str = Field(
        min_length=3,
        max_length=500,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    confirm_password: str = Field(
        min_length=8,
        max_length=128,
    )

    license_number: str | None = Field(
        default=None,
        max_length=100,
    )

    vehicle_number: str | None = Field(
        default=None,
        max_length=100,
    )

    aadhar_number: str | None = Field(
        default=None,
        max_length=50,
    )

    pan_number: str | None = Field(
        default=None,
        max_length=50,
    )

    is_otp_verified: bool = Field(
        default=False,
    )

    is_aadhar_verified: bool = Field(
        default=False,
    )

    is_pan_verified: bool = Field(
        default=False,
    )

    is_license_verified: bool = Field(
        default=False,
    )

    is_face_verified: bool = Field(
        default=False,
    )

    agree_terms: bool = Field(
        default=False,
    )

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if not self.organization_name or not self.organization_name.strip():
            if self.role == UserRole.DELIVERY_PARTNER:
                self.organization_name = "Independent Delivery Partner"
            elif self.role == UserRole.INDIVIDUAL_DONOR:
                self.organization_name = f"Individual Household - {self.full_name}"
            else:
                raise ValueError("Organization Name is required")

        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    organization_name: str | None = None
    phone_number: str | None = None
    address: str | None = None
    aadhar_number: str | None = None
    pan_number: str | None = None
    license_number: str | None = None


class UserResponse(BaseModel):
    id: str
    tenant_id: str | None = None
    organization_id: str | None = None
    organization_name: str = ""
    full_name: str = ""
    email: str = ""
    phone_number: str = ""
    address: str = ""
    role: UserRole
    is_active: bool = False
    license_number: str | None = None
    vehicle_number: str | None = None
    aadhar_number: str | None = None
    pan_number: str | None = None
    is_otp_verified: bool = False
    is_aadhar_verified: bool = False
    is_pan_verified: bool = False
    is_license_verified: bool = False
    is_face_verified: bool = False
    warnings_count: int = 0
    wallet_balance: float = 1000.0
    is_suspended: bool = False
    suspended_until: datetime | None = None
    suspension_reason: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse