import socket
import sys
import uvicorn
from app.main import app

def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def start():
    lan_ip = get_lan_ip()
    print(f"==================================================")
    print(f"  SnapIT Backend Server Starting")
    print(f"  Local LAN IP: {lan_ip}")
    print(f"  Access URL:  http://{lan_ip}:8000")
    print(f"==================================================")

    # Try 0.0.0.0 first so all interfaces receive traffic
    try:
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    except OSError as e:
        if "10048" in str(e):
            print(f"[Notice] 0.0.0.0 port 8000 has socket collision. Binding to {lan_ip}:8000...")
            uvicorn.run("app.main:app", host=lan_ip, port=8000, reload=True)
        else:
            raise

if __name__ == "__main__":
    start()
