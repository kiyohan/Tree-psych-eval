# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install gunicorn
    
# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5002

# Run the app using gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "app:app"]