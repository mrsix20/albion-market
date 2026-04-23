from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.routes import router_bm_flipper, router_trade_routes, router_private_sync

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modules routers
app.include_router(router_bm_flipper.router, prefix=settings.API_V1_STR, tags=["Black Market Flipper"])
app.include_router(router_trade_routes.router, prefix=settings.API_V1_STR, tags=["Trade Routes"])
app.include_router(router_private_sync.router, prefix=settings.API_V1_STR, tags=["Private Sync"])

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API"}
