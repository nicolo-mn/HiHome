package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMockHandler(t *testing.T) {
	req, err := http.NewRequest("GET", "/api/mock", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(mockHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	var response MockResponse
	err = json.NewDecoder(rr.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	expectedMessage := "Hello from the Go mock service!"
	if response.Message != expectedMessage {
		t.Errorf("handler returned unexpected body: got %v want %v",
			response.Message, expectedMessage)
	}
}
