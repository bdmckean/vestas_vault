"""FastAPI application entry point."""

import logging
import time

from sqlalchemy import text
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings
from app.database import Base, engine
from app.logging_config import configure_logging

# Logging for error diagnosis (LOG_LEVEL env, or DEBUG when debug=True)
configure_logging(level=settings.log_level, debug=settings.debug)

logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)


def _run_tax_config_state_migration():
    """Add tax_config.state column if missing (e.g. after deploy or fresh DB)."""
    if "postgresql" not in settings.database_url:
        return
    try:
        with engine.connect() as conn:
            conn.execute(
                text(
                    "ALTER TABLE tax_config ADD COLUMN IF NOT EXISTS state VARCHAR(10) DEFAULT 'CO'"
                )
            )
            conn.commit()
    except Exception as e:
        logger.warning("Tax config state migration skipped or failed: %s", e)


_run_tax_config_state_migration()


def _run_saved_scenarios_additional_income_migration():
    """Add saved_scenarios.additional_other_income_annual column if missing."""
    if "postgresql" not in settings.database_url:
        return
    try:
        with engine.connect() as conn:
            conn.execute(
                text(
                    "ALTER TABLE saved_scenarios "
                    "ADD COLUMN IF NOT EXISTS additional_other_income_annual NUMERIC(12,2) "
                    "NOT NULL DEFAULT 0"
                )
            )
            conn.commit()
    except Exception as e:
        logger.warning("Saved scenarios additional income migration skipped or failed: %s", e)


_run_saved_scenarios_additional_income_migration()

app = FastAPI(
    title="Retirement Planner API",
    description="API for retirement planning and portfolio management",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every request (method, path, status, duration). Log 5xx with extra context for diagnosis."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    status = response.status_code
    if status >= 500:
        logger.error(
            "%s %s -> %s %.0fms",
            request.method,
            request.url.path,
            status,
            duration_ms,
            extra={"method": request.method, "path": request.url.path, "status": status},
        )
    else:
        logger.info("%s %s -> %s %.0fms", request.method, request.url.path, status, duration_ms)
    return response


# Include API routes
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Retirement Planner API", "version": "0.1.0"}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
