# Docker Setup Guide for Tree Psychology Evaluation System

This guide will help you run the entire Tree Psychology Evaluation system using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Miniconda/Anaconda with the `smai` environment containing required ML packages (PyTorch, Timm, etc.)
  - The ML API requires a pre-configured conda environment located at `/home/akmal-ali/miniconda3/envs/smai`
  - If your conda installation is in a different location, update the volume mount path in `docker-compose.yml`

## Project Structure

The project consists of three main services:
- **Backend**: Node.js/Express API (Port 5001)
- **Frontend**: React application (Port 3000)
- **ML API**: Python/Flask ML service (Port 5002)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Tree-psych-eval
```

### 2. Set Up Environment Variables

Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env
```

Edit the `.env` file and add your actual credentials:
- MongoDB connection string
- JWT secret
- Cloudinary credentials
- Google Gemini API key

### 3. Build and Run with Docker Compose

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up

# Or run in detached mode (background)
docker-compose up -d
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- ML API: http://localhost:5002

## Docker Commands

### Starting Services

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up frontend

# Start in background
docker-compose up -d
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Viewing Logs

```bash
# View logs from all services
docker-compose logs

# View logs from specific service
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f
```

### Rebuilding Services

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and start
docker-compose up --build
```

### Accessing Service Shells

```bash
# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Access ML API shell
docker-compose exec ml-api bash
```

## Development Mode

The Docker setup includes volume mounting for hot-reloading:
- Backend: Uses `nodemon` for automatic restart on file changes
- Frontend: React's development server with hot-reload enabled
- ML API: Python files are mounted for development

## Troubleshooting

### Port Already in Use

If you get a port conflict error:

```bash
# Check what's using the port
sudo lsof -i :5001  # or :3000, :5002

# Stop the conflicting process or change the port in docker-compose.yml
```

### Cannot Connect to MongoDB

Ensure your MongoDB connection string in `.env` is correct and accessible from Docker containers. For MongoDB Atlas, make sure to whitelist all IPs (0.0.0.0/0) or your server's IP.

### ML Model Not Found

Ensure the `ml-api/models/best_htp_classifier.pth` file exists before building the ML API container.

### Conda Environment Issues

The ML API uses a mounted conda environment (`smai`) from your host machine. If you encounter issues:

1. **Verify the conda environment exists**:
   ```bash
   conda env list
   # Should show: smai    /home/akmal-ali/miniconda3/envs/smai
   ```

2. **Check the environment has required packages**:
   ```bash
   conda run -n smai pip list
   # Should include: torch, torchvision, timm, Flask, etc.
   ```

3. **Update the volume mount path** if your conda is installed elsewhere:
   Edit `docker-compose.yml` and change the volume mount:
   ```yaml
   volumes:
     - /path/to/your/miniconda3/envs/smai:/opt/conda/envs/smai:ro
   ```

4. **Permission issues**: The conda environment is mounted as read-only (`:ro`). If you need to install packages, do it on the host:
   ```bash
   conda activate smai
   pip install <package-name>
   ```

### Frontend Cannot Connect to Backend

The frontend uses the proxy setting to connect to the backend. In Docker, this is set to `http://backend:5001` (the service name). If you're testing outside Docker, change it back to `http://localhost:5001`.

### Rebuilding After Code Changes

For major changes, rebuild the containers:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Production Deployment

For production deployment, consider:

1. **Use production builds**:
   - Update frontend Dockerfile to use `npm run build` and serve with nginx
   - Remove development dependencies
   - Use production-grade WSGI server for ML API (already using gunicorn)

2. **Environment variables**:
   - Never commit `.env` files
   - Use Docker secrets or environment-specific configuration

3. **Security**:
   - Change all default passwords and secrets
   - Use HTTPS with proper SSL certificates
   - Restrict CORS origins in backend

4. **Scaling**:
   - Use docker-compose scaling for load balancing
   - Consider Kubernetes for larger deployments

## Running Individual Services

If you prefer to run services individually:

### Backend
```bash
cd backend
docker build -t tree-psych-backend .
docker run -p 5001:5001 --env-file ../.env tree-psych-backend
```

### Frontend
```bash
cd frontend
docker build -t tree-psych-frontend .
docker run -p 3000:3000 tree-psych-frontend
```

### ML API
```bash
cd ml-api
docker build -t tree-psych-ml-api .
docker run -p 5002:5002 --env-file ../.env tree-psych-ml-api
```

## Network Architecture

All services communicate through a Docker bridge network called `tree-psych-network`. Services can reference each other by their service name:
- Frontend → Backend: `http://backend:5001`
- Backend → ML API: `http://ml-api:5002`

## Volume Management

The setup uses volumes for:
- Development: Source code mounting for hot-reload
- node_modules: Preventing conflicts between host and container

To clean up volumes:
```bash
docker-compose down -v
```

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
