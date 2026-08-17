# Docker Development Guide

## Node.js Version Policy

All examples in this guide pin **Node 24**. Production applications use only
Active or Maintenance LTS releases — never a `Current` or end-of-life release.
Verify a release's current support status on the official
[Node.js release schedule](https://nodejs.org/en/about/previous-releases)
instead of relying on a status label or codename copied into this guide.

**Never run a Node version past its end-of-life date** — it stops receiving security patches. Node 18 and Node 20 are both EOL; if either shows up in a project, upgrade it.

When to move to the next LTS:
- Start migrating once the next release enters LTS according to the official schedule — don't wait for the current one to hit EOL.
- Bump these together, in the same PR: `.nvmrc`, `package.json` `engines.node`, `@types/node` (match the Node major), CI runner `node-version`, and every `FROM node:...` tag in Dockerfiles and Compose files.
- Re-run the full test suite after the bump — Node majors can change built-in behavior (`fetch`, the test runner, the permission model, V8 semantics).

Treat https://nodejs.org/en/about/previous-releases as the source of truth for
current support states and migration dates.

## Getting Started

### Prerequisites
- Docker Engine installed
- Docker Compose (usually included with Docker Desktop)
- Basic understanding of containers
- Git for version control

### Installation

```bash
# Verify Docker installation
docker --version
docker-compose --version

# Test Docker
docker run hello-world
```

## Basic Docker Concepts

### Images vs Containers
- **Image**: Blueprint for containers (read-only template)
- **Container**: Running instance of an image
- **Dockerfile**: Instructions to build an image

## Creating a Dockerfile

### Basic Dockerfile
```dockerfile
# Use an official base image
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production

# Run the application
CMD ["node", "index.js"]
```

### Multi-stage Build (Optimized)
```dockerfile
# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Best Practices

### 1. Use .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
.env
.DS_Store
dist
coverage
*.md
```

### 2. Minimize Layers
```dockerfile
# Bad - Creates multiple layers
RUN apt-get update
RUN apt-get install -y package1
RUN apt-get install -y package2

# Good - Single layer
RUN apt-get update && \
    apt-get install -y package1 package2 && \
    rm -rf /var/lib/apt/lists/*
```

### 3. Use Specific Tags
```dockerfile
# Bad - unpredictable
FROM node:latest

# Good - specific version
FROM node:24.18.0-alpine
```

### 4. Run as Non-Root User
```dockerfile
FROM node:24-alpine

# Create app user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser

WORKDIR /app
COPY --chown=appuser:appuser . .

USER appuser

CMD ["node", "index.js"]
```

## Docker Compose

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:password@db:5432/mydb
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

### Development Override
```yaml
# docker-compose.override.yml
version: '3.8'

services:
  app:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

## Common Docker Commands

### Image Management
```bash
# Build an image
docker build -t myapp:1.0 .

# List images
docker images

# Remove image
docker rmi myapp:1.0

# Pull image from registry
docker pull node:24-alpine

# Push image to registry
docker push myregistry/myapp:1.0
```

### Container Management
```bash
# Run container
docker run -d -p 3000:3000 --name myapp myapp:1.0

# List running containers
docker ps

# List all containers
docker ps -a

# Stop container
docker stop myapp

# Start container
docker start myapp

# Remove container
docker rm myapp

# View logs
docker logs myapp
docker logs -f myapp  # Follow logs

# Execute command in container
docker exec -it myapp sh
docker exec myapp npm test
```

### Docker Compose Commands
```bash
# Start services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs
docker-compose logs -f app

# Rebuild images
docker-compose build

# Scale services
docker-compose up -d --scale app=3
```

## Debugging

### Interactive Shell
```bash
# Start container with shell
docker run -it myapp:1.0 sh

# Execute shell in running container
docker exec -it myapp sh
```

### Inspect Container
```bash
# View container details
docker inspect myapp

# View container stats
docker stats myapp

# View container processes
docker top myapp
```

## Volume Management

### Named Volumes
```bash
# Create volume
docker volume create mydata

# List volumes
docker volume ls

# Inspect volume
docker volume inspect mydata

# Remove volume
docker volume rm mydata

# Remove unused volumes
docker volume prune
```

### Bind Mounts
```bash
# Mount host directory
docker run -v /host/path:/container/path myapp:1.0

# Mount current directory
docker run -v $(pwd):/app myapp:1.0
```

## Networking

### Network Commands
```bash
# Create network
docker network create mynetwork

# List networks
docker network ls

# Connect container to network
docker network connect mynetwork myapp

# Inspect network
docker network inspect mynetwork
```

## Cleaning Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove everything
docker system prune -a
```

## Health Checks

```dockerfile
FROM node:24-alpine

WORKDIR /app
COPY . .

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "index.js"]
```

## Security Best Practices

1. **Use official base images**
2. **Scan images for vulnerabilities**
   ```bash
   docker scan myapp:1.0
   ```
3. **Don't store secrets in images**
4. **Use multi-stage builds**
5. **Run as non-root user**
6. **Keep images small**

## Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices Guide](https://docs.docker.com/develop/dev-best-practices/)
