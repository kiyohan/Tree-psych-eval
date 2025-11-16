

# DSI Platform - Dockerized Full Stack Application

This repository contains the full-stack source code for the Design for Social Innovation (DSI) ML-Assisted HTP Interpretation Platform. The entire architecture is containerized using Docker and managed with Docker Compose for easy setup and development.

### Table of Contents
1.  [Project Overview](#project-overview)
2.  [Architecture](#architecture)
3.  [Prerequisites](#prerequisites)
4.  [One-Time Setup (Host Machine)](#one-time-setup-host-machine)
    -   [Install Docker](#install-docker)
    -   [Configure Docker Permissions (Linux Only)](#configure-docker-permissions-linux-only)
5.  [Configuration](#configuration)
    -   [Backend & Database](#backend--database)
    -   [ML API (Google Gemini)](#ml-api-google-gemini)
    -   [Conda Environment Volume (ML API)](#conda-environment-volume-ml-api)
6.  [Running the Application](#running-the-application)
7.  [Stopping the Application](#stopping-the-application)
8.  [Development Workflow](#development-workflow)
9.  [Troubleshooting](#troubleshooting)

---

### Project Overview

This project is a web-based platform designed to assist psychologists in interpreting House-Tree-Person (HTP) drawings. It uses a Machine Learning pipeline to provide preliminary analysis, which is then reviewed by a human expert.

### Architecture

The application is composed of three separate services orchestrated by Docker Compose:

1.  **`frontend`**: A React single-page application served by Nginx. It provides the user interface for all roles (Uploader, Assessor, Admin).
2.  **`backend`**: A Node.js/Express RESTful API server. It handles user authentication, business logic, case management, and database interactions.
3.  **`ml-api`**: A Python/Flask API service. It runs the "Seer" (EfficientNet) model for visual feature detection and calls the "Interpreter" (Google Gemini) for generating psychological reports.

### Prerequisites

-   [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose (v2.x) installed on your machine.
-   A local [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or Anaconda installation with a Python environment containing the required ML libraries (PyTorch, Timm, etc.).
-   A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account for the database.
-   A [Cloudinary](https://cloudinary.com/) account for image storage.
-   A [Google AI Studio](https://aistudio.google.com/) API key for Gemini.

### One-Time Setup (Host Machine)

#### Install Docker

Follow the official instructions for your operating system:
-   [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
-   [Install Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install/)
-   [Install Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/)

The latest versions of Docker include the `docker compose` plugin.

#### Configure Docker Permissions (Linux Only)

To run Docker commands without `sudo`, you must add your user to the `docker` group.

1.  Add your user to the `docker` group:
    ```bash
    sudo usermod -aG docker $USER
    ```

2.  **Log out and log back in.** This step is mandatory for the group changes to take effect. or Just restart your system.

3.  Verify by opening a new terminal and running `groups`. The output should include `docker`.

### Configuration

Before running the application, you need to configure the environment variables for each service.

#### Backend & Database

1.  Open the `docker-compose.yml` file in the root directory.
2.  Locate the `backend` service definition.
3.  Fill in the placeholder values in the `environment` section with your actual credentials:
    ```yaml
    environment:
      MONGO_URI: "your_mongodb_atlas_connection_string"
      JWT_SECRET: "choose_a_long_random_secret_string"
      CLOUDINARY_CLOUD_NAME: "your_cloudinary_cloud_name"
      CLOUDINARY_API_KEY: "your_cloudinary_api_key"
      CLOUDINARY_API_SECRET: "your_cloudinary_api_secret"
    ```

#### ML API (Google Gemini)

1.  Go to the `ml-api/` directory.
2.  Rename the `.env.example` file to `.env` (or create it if it doesn't exist).
3.  Add your Google Gemini API key to the `ml-api/.env` file:
    ```ini
    GOOGLE_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```

#### Conda Environment Volume (ML API)

This setup is optimized for local development to avoid re-downloading large ML libraries. It mounts your local Conda environment's packages into the `ml-api` container.

1.  Activate your Conda environment (e.g., `smai`):
    ```bash
    conda activate smai
    ```

2.  Find the exact path to its `site-packages`:
    ```bash
    python -c "import site; print(site.getsitepackages()[0])"
    ```

3.  Open `docker-compose.yml` and find the `volumes` section for the `ml-api` service.
4.  **Replace the placeholder path** with the full path you just copied. Ensure the Python version in the path matches the one in `ml-api/Dockerfile.dev` (`python:3.13-slim`).
    ```yaml
    volumes:
      - ./ml-api:/app
      # Replace this line with your actual path
      - /home/your_username/miniconda3/envs/smai/lib/python3.13/site-packages:/usr/local/lib/python3.13/site-packages
    ```

### Running the Application

Once all configuration is complete, you can start the entire application stack with a single command from the root `dsi/` directory.

```bash
docker compose up --build
```

-   `--build`: This flag tells Docker Compose to build the images from the `Dockerfile`s before starting the containers. You only need to use it the first time or after making changes to a `Dockerfile` or source code that affects the image (like adding a dependency in `package.json`).

The services will be available at:
-   **Frontend (Web App):** `http://localhost:3000`
-   **Backend API:** `http://localhost:5001`
-   **ML API:** `http://localhost:5002`

You will see logs from all three services interleaved in your terminal.

### Stopping the Application

To stop and remove all the running containers and the network, press `Ctrl+C` in the terminal where `docker compose` is running, and then run:

```bash
docker compose down
```

This will clean up the environment completely.

### Development Workflow

This setup is optimized for local development with **hot-reloading**.

-   The `backend` and `frontend` source code is mounted as a volume. When you save a change in a file in either of these directories, the development server inside the container (`nodemon` for backend, `react-scripts` for frontend) will automatically detect the change and reload the application.
-   You do not need to rebuild the Docker images for simple code changes.
-   If you add a new dependency (e.g., run `npm install new-package`), you will need to rebuild the corresponding image by running `docker compose up --build`.

### Troubleshooting

-   **`Permission denied` error on `docker.sock`:** Your user is not in the `docker` group. See the [Configure Docker Permissions](#configure-docker-permissions-linux-only) section and remember to log out and back in.
-   **`ModuleNotFoundError: No module named 'torch'`:** The volume path for your Conda environment in `docker-compose.yml` is incorrect, or the Python versions do not match. Double-check the path using the command in the configuration section.
-   **`Conflict. The container name is already in use`:** An old container was not properly removed. Run `docker compose down` to clean up before trying again.
-   **Service fails to start:** Check the logs for that specific service in your terminal for error messages. For example, an incorrect `MONGO_URI` will cause the `backend` service to crash on startup.