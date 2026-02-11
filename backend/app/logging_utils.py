from flask import current_app


def log_info(message: str) -> None:
    if current_app.config.get('DEBUG_LOGS'):
        current_app.logger.info(message)


def log_debug(message: str) -> None:
    if current_app.config.get('DEBUG_LOGS'):
        current_app.logger.debug(message)
