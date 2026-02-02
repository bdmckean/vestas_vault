"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings
from app.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

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
