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

    
    # Initialize CORS - Allow all origins for public API
    # Since carpark data is public government data, we allow all origins
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    origins_value = "*" if cors_origins == '*' else [o.strip() for o in cors_origins.split(',')]
    CORS(app,
         origins=origins_value,
         methods=["GET", "POST", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         expose_headers=["Content-Type"],
         supports_credentials=False
    )
    
    # Register blueprints (we'll create these)
    from app.routes.health import health_bp
    from app.routes.carparks import carparks_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(carparks_bp)
    
    # Pre-load data on startup to avoid cold start delay
    with app.app_context():
        # Cache warm-up
        
        # Pre-load HDB carpark info (static data)
        from app.services.hdb_service import load_hdb_carpark_info
        load_hdb_carpark_info()
        # HDB info loaded
        
        # Pre-load search aliases
        from app.services.search_service import load_search_config
        load_search_config()
        # Search aliases loaded
        
        # Warm up cache by fetching initial data
        try:
            from app.services.carpark_service import fetch_all_carparks, fetch_all_hdb_carparks
            fetch_all_carparks()
            # LTA data cached
            fetch_all_hdb_carparks()
            # HDB availability cached
            # Cache warm-up complete
        except Exception as e:
            app.logger.warning(f"⚠️ Cache warm-up failed: {e}")
    
    return app
