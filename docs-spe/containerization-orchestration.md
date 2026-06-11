---
layout: default
title: Containerization & Orchestration
nav_order: 8
---

# Containerization & Orchestration

## Containers Architecture
The application is containerized using *Docker*. There are four containers that were built:
- *Backend Container*: this container runs the backend of the MEVN application.
- *Frontend Container*: this container runs the frontend of the MEVN application, which is served through a Nginx server, which serves the static files and acts as a reverse proxy, forwarding api calls to the backend.
- *Mongo Database*: To store persistent data, we used a NoSQL solution through a MongoDB database.
- *Environment Service*: this container runs the Go Service, which interacts with the MEVN backend, providing information taken from Open Meteo public APIs.

# Orchestration
To orchestrate the aforementioned Docker containers, Docker Compose was used. We added a volume that contains data for the MongoDB container, and handled launching taking into consideration the dependencies of the containers. To handle startup correctly, we implemented ad-hoc routes in containers to perform an healthcheck. Dependencies are listed below:
- The MEVN Frontend depends on the MEVN Backend
- The MEVN Backend depends on the database and the Weather service

Moreover, we also implemented a development version of both the Docker Compose file and all the Dockerfiles, to ease development. This was used to obtain hot-reloading in the containers, to allow containers to automatically reload on code changes, useful to avoid restarting everything in case of on-the-fly changes. To obtain it, `air` was used in the Go Service, `vite` in the frontend and `nodemon` in the backend. Local code folders were mapped in the containers using volumes.

As explained in the repo README, the containers can be started with either `docker compose up` or `docker compose -f docker-compose.dev.yml up`.

Since containers are released on GHCR, we also included a third compose file that uses them (`docker-compose.ghcr.yml`), which requires to set a JWT secret for authentication and a DeepSeek API key to run the chatbot.
