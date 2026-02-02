FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first (for better layer caching)
COPY pyproject.toml ./

# Install dependencies using uv (install from pyproject.toml)
RUN uv pip install --system fastapi uvicorn[standard] sqlalchemy psycopg2-binary pydantic pydantic-settings python-dotenv python-multipart pytest pytest-asyncio httpx

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
