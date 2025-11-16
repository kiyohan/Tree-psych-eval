# Use continuumio/miniconda3 base image
FROM continuumio/miniconda3:latest

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Expose the port the app runs on
EXPOSE 5002

# The entire miniconda3 directory will be mounted from the host at the same path
# Start the application using the host's conda environment's gunicorn
CMD ["/home/akmal-ali/miniconda3/envs/smai/bin/gunicorn", "--bind", "0.0.0.0:5002", "--timeout", "120", "app:app"]
