from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.core.dependencies import get_current_user
from app.schemas.complaint_schema import ComplaintCreate, ComplaintResponse


router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"],
)


def serialize_complaint(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "donation_id": str(doc.get("donation_id", "")),
        "delivery_boy_id": str(doc.get("delivery_boy_id", "")),
        "delivery_boy_name": doc.get("delivery_boy_name", ""),
        "raised_by_id": str(doc.get("raised_by_id", "")),
        "raised_by_role": doc.get("raised_by_role", ""),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "status": doc.get("status", "PENDING"),
        "created_at": doc.get("created_at"),
    }


# ============================================================
# CREATE COMPLAINT
# ============================================================

@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_complaint(
    payload: ComplaintCreate,
    current_user: dict = Depends(get_current_user),
):
    database = get_database()

    role = str(current_user.get("role") or "").upper()
    if role not in ["DONOR", "INDIVIDUAL_DONOR", "NGO", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Donors, Individual Donors, and NGOs can raise complaints.",
        )

    # 1. Verify donation exists
    try:
        donation_id_obj = ObjectId(payload.donation_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid donation ID format.",
        )

    donation = await database.donations.find_one({"_id": donation_id_obj})
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found.",
        )

    # 2. Verify caller is part of the donation
    if role in ["DONOR", "INDIVIDUAL_DONOR"]:
        donor_user_id = str(current_user["_id"])
        donor_tenant_id = str(current_user.get("tenant_id") or "")
        valid_donor_ids = [
            str(donation.get("donor_id")),
            str(donation.get("tenant_id")),
            str(donation.get("donor_tenant_id")),
            str(donation.get("organization_id")),
            str(donation.get("created_by")),
        ]
        if donor_user_id not in valid_donor_ids and donor_tenant_id not in valid_donor_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to raise a complaint for this donation.",
            )
    elif role == "NGO":
        ngo_user_id = str(current_user["_id"])
        ngo_tenant_id = str(current_user.get("tenant_id") or "")
        valid_ngo_ids = [
            str(donation.get("ngo_id")),
            str(donation.get("claimed_by")),
            str(donation.get("claimed_by_ngo_id")),
            str(donation.get("assigned_ngo_id")),
        ]
        if ngo_user_id not in valid_ngo_ids and ngo_tenant_id not in valid_ngo_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to raise a complaint for this donation.",
            )

    # 3. Retrieve Delivery Boy / Partner ID and name
    dboy_id_raw = payload.delivery_boy_id or donation.get("delivery_boy_id") or donation.get("delivery_partner_id")
    if not dboy_id_raw or str(dboy_id_raw) == "None":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No delivery partner assigned to this donation yet.",
        )

    try:
        dboy_id_obj = ObjectId(str(dboy_id_raw))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid delivery partner ID format.",
        )

    dboy = await database.users.find_one({"_id": dboy_id_obj, "role": {"$in": ["DELIVERY_PARTNER", "DELIVERY_BOY"]}})
    dboy_name = (
        dboy.get("full_name") if dboy else donation.get("delivery_boy_name") or donation.get("driver_name") or "Assigned Transporter"
    )

    # 4. Insert Complaint
    now = datetime.now(timezone.utc)
    complaint_doc = {
        "donation_id": donation_id_obj,
        "delivery_boy_id": dboy_id_obj,
        "delivery_boy_name": dboy_name,
        "raised_by_id": current_user["_id"],
        "raised_by_role": role,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "status": "PENDING",
        "created_at": now,
        "updated_at": now,
    }

    result = await database.complaints.insert_one(complaint_doc)
    complaint_doc["_id"] = result.inserted_id

    return serialize_complaint(complaint_doc)


# ============================================================
# GET ALL COMPLAINTS (ADMIN ONLY)
# ============================================================

@router.get(
    "",
    response_model=List[ComplaintResponse],
    status_code=status.HTTP_200_OK,
)
async def get_all_complaints(
    current_user: dict = Depends(get_current_user),
):
    database = get_database()
    role = current_user.get("role")

    if role == "ADMIN":
        query = {}
    elif role in ["DONOR", "NGO"]:
        user_id_obj = current_user["_id"]
        user_id_str = str(user_id_obj)
        query = {
            "$or": [
                {"raised_by_id": user_id_obj},
                {"raised_by_id": user_id_str}
            ]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )

    cursor = database.complaints.find(query).sort("created_at", -1)
    complaints = await cursor.to_list(length=100)

    return [serialize_complaint(c) for c in complaints]


# ============================================================
# RESOLVE COMPLAINT (ADMIN ONLY)
# ============================================================

@router.post(
    "/{complaint_id}/resolve",
    response_model=ComplaintResponse,
    status_code=status.HTTP_200_OK,
)
async def resolve_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
):
    database = get_database()

    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    try:
        complaint_id_obj = ObjectId(complaint_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid complaint ID format.",
        )

    now = datetime.now(timezone.utc)
    complaint = await database.complaints.find_one_and_update(
        {"_id": complaint_id_obj},
        {"$set": {"status": "RESOLVED", "updated_at": now}},
        return_document=True
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )

    return serialize_complaint(complaint)
