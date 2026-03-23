"""Centralized logging configuration for error diagnosis and request tracing."""

import logging
import sys
from typing import Optional

# Format: timestamp level logger message
LOG_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configure_logging(
    level: Optional[str] = None,
    debug: bool = False,
) -> None:
    """
    Configure application logging. Call once at startup (e.g. in main.py).
    - level: e.g. 'DEBUG', 'INFO', 'WARNING', 'ERROR'. If None, uses INFO (or DEBUG when debug=True).
    - debug: when True, sets level to DEBUG if level is not explicitly set.
    """
    log_level = level or ("DEBUG" if debug else "INFO")
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Avoid re-configuring if already set (e.g. in tests)
    root = logging.getLogger()
    if root.handlers:
        root.setLevel(numeric_level)
        return

    handler = logging.StreamHandler(sys.stderr)
    handler.setLevel(numeric_level)
    handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))

    root.setLevel(numeric_level)
    root.addHandler(handler)

    # Reduce noise from third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING if not debug else logging.INFO)
