#!/usr/bin/env bash
# Startup script for 天工智序 H5 portal
# Activate virtual environment if present
if [ -d "venv" ]; then
  source "$(pwd)/venv/bin/activate"
fi
# Set Flask environment variables (optional)
export FLASK_APP=app.py
export FLASK_ENV=development
# Run the Flask application
python - <<'PY'
import app
app.run_h5_portal(host='0.0.0.0', port=8888, debug=True)
PY
