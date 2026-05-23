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
	controller := infrastructure.NewEnvironmentController(service)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("/api/weather", controller.ServeHTTP)
	mux.HandleFunc("/api/forecast", controller.ServeForecast)
	mux.HandleFunc("/api/historical", controller.ServeHistorical)

	log.Println("ext-api-service listening on port 8080...")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
