import logging
import os
from logging.config import dictConfig
from weakref import WeakSet
import asyncio
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: WeakSet[WebSocket] = WeakSet()
        self._lock = asyncio.Lock()

    @property
    def has_connections(self) -> bool:
        return bool(self.active_connections)

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        if not self.has_connections:
            return

        async with self._lock:
            for connection in list(self.active_connections):
                try:
                    await connection.send_text(message)
                except Exception:
                    self.active_connections.remove(connection)


class WebSocketLogHandler(logging.Handler):
    def __init__(self, connection_manager: ConnectionManager):
        super().__init__()
        self.connection_manager = connection_manager
        self.loop = asyncio.get_event_loop()

    def emit(self, record):
        if not self.connection_manager.has_connections:
            return

        try:
            msg = self.format(record)
            if self.loop.is_running():
                asyncio.create_task(self.connection_manager.broadcast(msg))
        except Exception:
            self.handleError(record)


def setup_logging():
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    numeric_level = getattr(logging, log_level, logging.INFO)

    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
                '"name": "%(name)s", "file": "%(filename)s:%(lineno)d", '
                '"message": "%(message)s"}',
            },
            "standard": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": numeric_level,
            "handlers": ["console"],
        },
    }

    dictConfig(config)


def get_logger(name):
    return logging.getLogger(name)
