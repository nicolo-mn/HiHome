package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type MockResponse struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

func mockHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := MockResponse{
		Message: "Hello from the Go mock service!",
		Status:  "success",
	}
	json.NewEncoder(w).Encode(response)
}

func main() {
	http.HandleFunc("/api/mock", mockHandler)
	log.Println("Go mock service listening on port 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
