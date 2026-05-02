package main

import (
	"log"
	"net/http"

	"ext-api-service/application"
	"ext-api-service/infrastructure"
)

func main() {
	client := infrastructure.NewOpenMeteoClient(nil)
	service := application.NewEnvironmentService(client)
	controller := infrastructure.NewEnvironmentController(service, "resources")

	mux := http.NewServeMux()
	mux.HandleFunc("/api/weather", controller.ServeHTTP)

	log.Println("ext-api-service listening on port 8080...")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
