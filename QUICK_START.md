# Tree Psychology Evaluation - Docker Quick Reference

## Starting the Application

### Development Mode (with hot-reload)
```bash
./start.sh dev
# or
docker-compose up
```

### Production Mode
```bash
./start.sh prod
# or
docker-compose -f docker-compose.prod.yml up -d
```

## Stopping the Application

```bash
./start.sh down
# or
docker-compose down
```

## Viewing Logs

```bash
./start.sh logs
# or
docker-compose logs -f
```

## Accessing Services

- **Frontend**: http://localhost:3000 (dev) or http://localhost (prod)
- **Backend API**: http://localhost:5001
- **ML API**: http://localhost:5002

## Common Commands

### Rebuild containers after changes
```bash
docker-compose build
docker-compose up
```

### Access a container shell
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec ml-api bash
```

### View specific service logs
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs ml-api
```

### Restart a specific service
```bash
docker-compose restart backend
docker-compose restart ml-api
```

### Clean up everything (including volumes)
```bash
./start.sh clean
# or
docker-compose down -v
```

## Important Notes

1. **Conda Environment**: The ML API uses the host's `smai` conda environment mounted at `/home/akmal-ali/miniconda3/envs/smai`
2. **Environment Variables**: Make sure `.env` file exists in the root directory with all required credentials
3. **Model File**: Ensure `ml-api/models/best_htp_classifier.pth` exists before running

## Troubleshooting

### Conda environment not found
```bash
# Check if environment exists
conda env list

# If path is different, update docker-compose.yml volume mount
```

### Port conflicts
```bash
# Check what's using the port
sudo lsof -i :5001

# Kill the process or change the port in docker-compose.yml
```

### Container won't start
```bash
# Check logs
docker-compose logs <service-name>

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

For detailed documentation, see:
- `DOCKER_SETUP.md` - Complete Docker setup guide
- `CONDA_SETUP.md` - Conda environment configuration
