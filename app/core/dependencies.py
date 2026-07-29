from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from datetime import datetime, timezone

from app.core.jwt import decode_access_token
from app.database import get_database
from app.models.enums import UserRole
from app.repositories.user_repository import find_user_by_id


bearer_scheme = HTTPBearer(
    auto_error=False
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    # No Authorization header
    if credentials is None:
        raise credentials_exception

    token = credentials.credentials

    try:
        payload = decode_access_token(token)

        user_id = payload.get("sub")
        token_type = payload.get("type")

        if user_id is None:
            raise credentials_exception

        if token_type != "access":
            raise credentials_exception

    except jwt.PyJWTError:
        raise credentials_exception

    user = await find_user_by_id(user_id)

    if user is None:
        raise credentials_exception

    now = datetime.now(timezone.utc)
    if user.get("is_suspended", False):
        suspended_until = user.get("suspended_until")
        if suspended_until:
            if suspended_until.tzinfo is None:
                suspended_until = suspended_until.replace(tzinfo=timezone.utc)
            if now >= suspended_until:
                db = get_database()
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {
                        "$set": {
                            "is_suspended": False,
                            "is_active": True,
                            "suspended_until": None,
                            "suspension_reason": None,
                            "updated_at": now,
                        }
                    }
                )
                user["is_suspended"] = False
                user["is_active"] = True
            else:
                formatted_until = suspended_until.strftime("%B %d, %Y")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Account suspended for 1 month due to 3 warnings until {formatted_until}.",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account suspended by administrator.",
            )

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    return user


def require_roles(
    *allowed_roles: UserRole,
) -> Callable:

    async def role_checker(
        current_user: dict = Depends(
            get_current_user
        ),
    ) -> dict:
        allowed_role_values = {
            role.value
            for role in allowed_roles
        }

        if current_user["role"] not in allowed_role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to access this resource"
                ),
            )

        return current_user

    return role_checker