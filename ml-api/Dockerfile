# Use the same base Python version as your Conda environment
FROM python:3.13-slim

WORKDIR /app

# Install only the web server libraries. ML libs will be mounted.
COPY requirements.txt ./
RUN pip install --no-cache-dir Flask python-dotenv gunicorn requests google-generativeai

# The command to run the dev server will be provided by docker-compose
CMD ["python", "app.py"]