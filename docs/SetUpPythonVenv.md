# Create a Python Virtual Environment
Open a terminal in the project root folder<br>

```powershell
# create the virtual environment
python -m venv .venv

# activate (PS shows '(.venv)' in the prompt after activation)
.venv\Scripts\Activate.ps1

# install python dependencies
pip install -r backend\requirements.txt

# leave the virtual environment
deactivate
```

Maybe you need to set the execution policy to allow running scripts.
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```