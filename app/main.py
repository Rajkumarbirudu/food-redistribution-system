from contextlib import asynccontextmanager

from fastapi import (
    FastAPI,
    Request,
)

from fastapi.exceptions import (
    RequestValidationError,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from fastapi.responses import (
    JSONResponse,
)


from app.database import (
    close_mongodb_connection,
    connect_to_mongodb,
)


from app.routes.auth_routes import (
    router as auth_router,
)

from app.routes.category_routes import (
    router as category_router,
)

from app.routes.inventory_routes import (
    router as inventory_router,
)

from app.routes.donation_routes import (
    router as donation_router,
)

from app.routes.admin_routes import (
    router as admin_router,
)

from app.routes.complaint_routes import (
    router as complaint_router,
)


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(
    app: FastAPI,
):
    print("=" * 60)

    print(
        "Starting Aura Food API..."
    )

    print("=" * 60)

    try:
        await connect_to_mongodb()

        try:
            from scripts.create_admin import seed_demo_users_internal
            await seed_demo_users_internal()
        except Exception as seed_err:
            print("Failed to auto-seed demo accounts:", seed_err)

        try:
            from app.seed_categories import seed_categories_internal
            await seed_categories_internal()
        except Exception as cat_err:
            print("Failed to auto-seed categories:", cat_err)

        print(
            "Aura Food API startup completed"
        )

        yield

    finally:
        print(
            "Shutting down Aura Food API..."
        )

        await close_mongodb_connection()

        print(
            "Aura Food API shutdown completed"
        )


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Aura Food API",

    description=(
        "AI-Based Food Redistribution System "
        "for Waste Reduction and Surplus "
        "Inventory Management"
    ),

    version="1.0.0",

    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# VALIDATION ERROR HANDLER
# ============================================================

@app.exception_handler(
    RequestValidationError
)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    print()

    print("=" * 70)

    print(
        "FASTAPI REQUEST VALIDATION ERROR"
    )

    print("=" * 70)

    print(
        "METHOD:",
        request.method,
    )

    print(
        "URL:",
        request.url,
    )

    print(
        "ERRORS:",
        exc.errors(),
    )

    print(
        "BODY:",
        exc.body,
    )

    print("=" * 70)

    print()

    safe_errors = []

    for error in exc.errors():
        safe_errors.append(
            {
                "type":
                    error.get(
                        "type"
                    ),

                "loc":
                    list(
                        error.get(
                            "loc",
                            [],
                        )
                    ),

                "msg":
                    error.get(
                        "msg"
                    ),

                "input":
                    str(
                        error.get(
                            "input"
                        )
                    ),
            }
        )

    return JSONResponse(
        status_code=422,

        content={
            "detail":
                safe_errors,
        },
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():
    return {
        "application":
            "Aura Food API",

        "status":
            "running",

        "version":
            "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health_check():
    return {
        "status":
            "healthy",

        "database":
            "mongodb",
    }


# ============================================================
# REGISTER ROUTERS
# ============================================================

app.include_router(
    auth_router
)

app.include_router(
    category_router
)

app.include_router(
    inventory_router
)

app.include_router(
    donation_router
)

app.include_router(
    admin_router
)

app.include_router(
    complaint_router
)