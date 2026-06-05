# Systemd service for FoodPilot

```bash
# Create systemd service
sudo nano /etc/systemd/system/foodpilot.service
```

Service content:
```SystemdService
[Unit]
Description=FoodPilot FastAPI service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=admin
Group=admin
WorkingDirectory=/home/admin/foodpilot/backend
Environment=PYTHONUNBUFFERED=1
ExecStart=/home/admin/foodpilot/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl enable foodpilot.service
sudo systemctl start foodpilot.service
```

```bash
# Check service status
sudo systemctl status foodpilot.service
# Check service logs
sudo journalctl -u foodpilot.service -f
```
