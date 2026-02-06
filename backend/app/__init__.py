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

    
    # Initialize extensions with explicit CORS configuration
    # In production, CORS_ORIGINS should be set to your frontend URL
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    if cors_origins == '*':
        # Development mode - allow localhost
        cors_origins = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"]
    else:
        # Production mode - parse comma-separated origins
        cors_origins = [origin.strip() for origin in cors_origins.split(',')]
    
    CORS(app, resources={
        r"/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })
    
    # Register blueprints (we'll create these)
    from app.routes.health import health_bp
    from app.routes.carparks import carparks_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(carparks_bp)
    
    # Pre-load data on startup to avoid cold start delay
    with app.app_context():
        app.logger.info("🚀 Warming up cache...")
        
        # Pre-load HDB carpark info (static data)
        from app.services.hdb_service import load_hdb_carpark_info
        load_hdb_carpark_info()
        app.logger.info("✅ HDB info loaded")
        
        # Pre-load search aliases
        from app.services.search_service import load_search_config
        load_search_config()
        app.logger.info("✅ Search aliases loaded")
        
        # Warm up cache by fetching initial data
        try:
            from app.services.carpark_service import fetch_all_carparks, fetch_all_hdb_carparks
            fetch_all_carparks()
            app.logger.info("✅ LTA data cached")
            fetch_all_hdb_carparks()
            app.logger.info("✅ HDB availability cached")
            app.logger.info("🎉 All data pre-loaded, ready to serve requests!")
        except Exception as e:
            app.logger.warning(f"⚠️ Cache warm-up failed: {e}")
    
    return app
