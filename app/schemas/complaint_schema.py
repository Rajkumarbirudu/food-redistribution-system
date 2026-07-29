from datetime import datetime
from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    donation_id: str = Field(
        min_length=24,
        max_length=24,
    )

    delivery_boy_id: str | None = Field(
        default=None,
    )

    title: str = Field(
        min_length=2,
        max_length=100,
    )

    description: str = Field(
        min_length=5,
        max_length=1000,
    )


class ComplaintResponse(BaseModel):
    id: str
    donation_id: str
    delivery_boy_id: str
    delivery_boy_name: str
    raised_by_id: str
    raised_by_role: str
    title: str
    description: str
    status: str
    created_at: datetime
