from fastapi import (
    APIRouter,
    Depends,
    status,
)

from app.core.dependencies import get_current_user

from app.schemas.auth_schema import (
    LoginResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)


from app.services.auth_service import (
    authenticate_user,
    register_user,
    serialize_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# REGISTER USER
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: UserRegister,
):
    user = await register_user(payload)

    # register_user may already return serialized API data.
    if isinstance(user, dict) and "id" in user:
        return user

    return serialize_user(user)


# ============================================================
# LOGIN USER
#
# authenticate_user expects:
#
# authenticate_user(email, password)
# ============================================================

@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
)
async def login(
    payload: UserLogin,
):
    return await authenticate_user(
        payload.email,
        payload.password,
    )


# ============================================================
# GET CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def get_me(
    current_user: dict = Depends(
        get_current_user
    ),
):
    return serialize_user(
        current_user
    )


# ============================================================
# UPDATE CURRENT USER PROFILE
# ============================================================

@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def update_me(
    payload: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    from app.services.auth_service import update_user_profile
    return await update_user_profile(
        str(current_user["_id"]),
        payload.model_dump(exclude_unset=True),
    )