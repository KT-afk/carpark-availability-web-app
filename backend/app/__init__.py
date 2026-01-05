# backend/app/__init__.py
from flask import Flask
from flask_caching import Cache
from flask_cors import CORS


cache = Cache()

def create_app():
    # Create Flask instance
    app = Flask(__name__)
    
    # Load config
    from app.config import Config
    app.config.from_object(Config)
    
    cache.init_app(app, config={'CACHE_TYPE': 'SimpleCache', 'CACHE_DEFAULT_TIMEOUT': 300})

    
    # Initialize extensions
    CORS(app)
    
    # Register blueprints (we'll create these)
    from app.routes.health import health_bp
    from app.routes.carparks import carparks_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(carparks_bp)
    
    return app
