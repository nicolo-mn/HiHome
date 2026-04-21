# HiHome

HiHome is an application for monitoring and controlling home systems. 

## Setup
HiHome can be executed locally using Docker Compose, as follows:
```bash
docker compose up
docker compose down -v
```
`dev` versions of `Dockerfile`s and `docker-compose` are provided, to allow auto update on code changes, executable via:
```bash
docker compose -f docker-compose.dev.yml up
docker compose -f docker-compose.dev.yml down -v
```

## Testing
Tests can be run with the following commands:
```bash
pnpm run test # for MEVN application
go test -C ext-api-service -v ./... # for Go service
```
Coverage reports are generated as follows:
```bash
pnpm run test:coverage # for MEVN application
go test -C ext-api-service -coverprofile=coverage.out -v ./... # for Go service
```

## Code Formatting
[`Prettier`](https://prettier.io/) is used for formatting the code of the MEVN application (by running `pmpm run format`), while `go-fmt` is used to format Go code (by running `go fmt -C ext-api-service`).
