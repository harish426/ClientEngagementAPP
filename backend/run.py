import os
import sys
import argparse
import uvicorn

def main():
    parser = argparse.ArgumentParser(description="Run B2B Lead Scoring Backend")
    parser.add_argument(
        "--env",
        choices=["dev", "development", "test", "prod", "production"],
        default="development",
        help="Environment to run in (default: development)"
    )
    parser.add_argument("--port", type=int, default=None, help="Override port")
    parser.add_argument("--host", type=str, default=None, help="Override host")

    args = parser.parse_args()

    env_map = {
        "dev": "development",
        "development": "development",
        "test": "test",
        "prod": "production",
        "production": "production"
    }

    selected_env = env_map[args.env]
    os.environ["APP_ENV"] = selected_env

    # Import config after setting APP_ENV
    from backend.app.core.config import get_settings
    settings = get_settings()

    port = args.port or settings.PORT
    host = args.host or settings.HOST
    reload = (selected_env == "development")

    print(f"[*] Initializing server for environment: {selected_env.upper()} (Host: {host}, Port: {port}, Reload: {reload})")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=reload)

if __name__ == "__main__":
    main()
