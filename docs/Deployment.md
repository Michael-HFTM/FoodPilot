# Deployment

Deployment is fully automated by [`deploy.ps1`](../deploy.ps1) at the repo
root. It runs in PowerShell 7+ (works in Windows PowerShell 5.1 too).
It builds the Angular frontend, stages the backend into a temp directory
(excluding `.venv`, `foodpilot.db`, `__pycache__`, ...), copies the staged
tree to the Raspberry Pi via `scp`, installs Python dependencies into a
venv on the Pi, restarts the `foodpilot` systemd service, and runs a
health check.

The Pi runs the FastAPI app under a **systemd** service (`foodpilot.service`),
which must already be installed and enabled on the Pi. `deploy.ps1` only
restarts the service — it does not install or configure it. The SQLite
database (`foodpilot.db`) is **never** overwritten by a deploy.

## Prerequisites

On the dev machine:
- PowerShell 7+ (or Windows PowerShell 5.1)
- `node` / `npm` (matching the version in `frontend/package.json`)
- `scp`, `ssh`, `npx` on `PATH` — all ship with Windows 10+ via OpenSSH and
  with every Node install
- SSH key auth set up for the Pi (run from a regular `cmd`/`PowerShell`):
  ```powershell
  ssh-copy-id pi@Pi-FoodPilot
  ```
  or, if `ssh-copy-id` is missing:
  ```powershell
  type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh pi@Pi-FoodPilot "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
  ```

On the Pi (Raspberry Pi OS Lite 64-bit):
- `python3` and `python3-venv` available
- Build dependencies for `lgpio` (the gpiozero pin factory backend), since
  pip has no prebuilt wheel for aarch64 and compiles it from source:
  ```bash
  sudo apt install -y swig python3-dev gcc liblgpio-dev liblgpio1
  ```
  Without these, `pip install -r requirements.txt` fails while building the
  `lgpio` wheel (missing `swig`, then missing `-llgpio` if only the build
  tools are installed without the native library).
- The SSH user can run the deploy's `sudo systemctl ...` commands **without
  a password prompt** (the script runs them non-interactively over SSH and
  has no TTY to type one into). Grant this with `visudo`:
  ```bash
  ssh admin@Pi-FoodPilot
  sudo visudo -f /etc/sudoers.d/foodpilot
  ```
  Add this single line (replace `admin` with your SSH user, and add more
  commands if you ever invoke them from the script):
  ```
  admin ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart foodpilot.service
  ```
  Save and exit, then verify:
  ```bash
  sudo -n systemctl restart foodpilot.service
  ```
  It should restart the service without asking for a password.

## First-time setup on the Pi

Done once, before the first deploy. The systemd service is **not** managed
by this script — it is created and enabled manually on the Pi (see
`docs/SystemdService.md`).

1. Copy the project to the Pi (any method; rsync, scp, git clone, ...):
   ```powershell
   scp -r backend admin@Pi-FoodPilot:~/foodpilot/
   ```
2. On the Pi, create the venv and install requirements:
   ```bash
   ssh admin@Pi-FoodPilot
   cd ~/foodpilot/backend
   python3 -m venv .venv
   .venv/bin/pip install --upgrade pip
   .venv/bin/pip install -r requirements.txt
   ```
3. Install the systemd service as described in `docs/SystemdService.md`:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable foodpilot.service
   sudo systemctl start  foodpilot.service
   sudo systemctl status foodpilot.service   # should be active (running)
   ```
4. Verify:
   ```
   curl http://127.0.0.1:8000/api/history/
   ```

After this, `.\deploy.ps1` handles every subsequent deploy. Note that
`deploy.ps1` defaults to `pi@Pi-FoodPilot` and `~/foodpilot` — pass
`-PiUser`, `-PiHost`, `-PiDir` to match your setup (e.g. `-PiUser admin`).

## Re-deploying

After pulling new code:

```powershell
.\deploy.ps1
```

The built-in health check will fail fast if anything is wrong.

### Common flags

```powershell
.\deploy.ps1 -DryRun        # show what would run, do nothing
.\deploy.ps1 -SkipBuild     # reuse existing backend/static/ (no ng build)
.\deploy.ps1 -SkipPip       # don't run pip install on the Pi
.\deploy.ps1 -NoRestart     # sync code without restarting the service
```

### Targeting a different host / user / directory

```powershell
.\deploy.ps1 -PiHost 192.168.1.50 -PiUser foodpilot
```

## Operating the service on the Pi

```bash
ssh pi@Pi-FoodPilot

sudo systemctl status foodpilot        # is it running?
sudo systemctl restart foodpilot       # manual restart
sudo systemctl stop foodpilot          # stop it
sudo journalctl -u foodpilot -f        # live logs (Ctrl-C to exit)
sudo journalctl -u foodpilot -n 200    # last 200 log lines
```

## Web UI

Once deployed, the Angular UI is served by FastAPI at:

```
http://Pi-FoodPilot:8000
```

If the hostname does not resolve, use the Pi's IP, e.g.
`http://192.168.1.215:8000`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing required command: scp` | OpenSSH ships with Windows 10+; on older systems install [OpenSSH](https://learn.microsoft.com/windows-server/administration/openssh/openssh_install_firstuse) |
| `Cannot SSH to ...` | `ssh-copy-id pi@Pi-FoodPilot` |
| `Service not installed` on first deploy | Follow the "First-time setup on the Pi" section |
| `sudo: a terminal is required to read the password` / `a password is required` | The deploy runs `sudo` non-interactively over SSH. Add a NOPASSWD rule for the relevant `systemctl` commands — see Prerequisites. |
| Service did not respond (health check fails) | `ssh pi@Pi-FoodPilot 'sudo journalctl -u foodpilot -n 80 --no-pager'` |
| Old `static/` files after frontend change | `Remove-Item -Recurse backend\static` then `.\deploy.ps1` |
| `Module not found` after adding a Python dep | Ensure `.\deploy.ps1` ran (it runs `pip install`); check the file was committed |
| DB schema change needed | Stop service, back up `foodpilot.db`, run a migration script manually, restart |
| Execution policy blocks the script | `powershell -ExecutionPolicy Bypass -File .\deploy.ps1` |

## What gets synced / what doesn't

Sent to the Pi (under `~/foodpilot/backend/`):
- All Python sources (`api/`, `hardware/`, `models/`, `database.py`, `main.py`)
- `requirements.txt`
- The freshly built Angular app under `static/`

**Excluded** (preserved on the Pi across deploys):
- `.venv/` — the Python virtual environment
- `foodpilot.db`, `foodpilot.db-journal` — the runtime database / logs
- `__pycache__/`, `*.pyc`, `*.pyo`
- `.env`, `.pytest_cache/`

If you need to reset the remote state (e.g. blown-up DB), do it explicitly
on the Pi — `deploy.ps1` will not touch it. Note: `scp` only copies files
that exist locally, so anything kept on the Pi that is absent from the
staging dir (venv, DB) stays put.
