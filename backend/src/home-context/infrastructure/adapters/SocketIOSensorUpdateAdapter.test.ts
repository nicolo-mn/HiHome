import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Server } from "socket.io";
import { createServer, Server as HttpServer } from "http";
import { io as ioClient, Socket } from "socket.io-client";
import { SocketIOSensorUpdateAdapter } from "./SocketIOSensorUpdateAdapter";
import {
  Home,
  Coordinates,
  Room,
  createComponent,
  ComponentTypes,
  WeatherForecast,
} from "../../domain";

describe("SocketIOSensorUpdateAdapter", () => {
  let io: Server;
  let httpServer: HttpServer;
  let clientSocket: Socket;
  let adapter: SocketIOSensorUpdateAdapter;
  let port: number;

  const mockHome = new Home("1", { latitude: 0, longitude: 0 });

  beforeAll(async () => {
    httpServer = createServer();
    io = new Server(httpServer);
    adapter = new SocketIOSensorUpdateAdapter(io);

    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });

    clientSocket = ioClient(`http://localhost:${port}`);

    io.on("connection", (socket) => {
      socket.join(`home-1`);
    });

    await new Promise<void>((resolve) => {
      clientSocket.on("connect", resolve);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.disconnect();
    httpServer.close();
  });

  it("should broadcast external temperature update to the correct room", async () => {
    return new Promise<void>((resolve) => {
      clientSocket.once("sensor:external-temperature", (data) => {
        expect(data).toEqual({ temperature: 22.5 });
        resolve();
      });

      adapter.sendExternalTemperatureUpdate(mockHome, { temperature: 22.5 });
    });
  });

  it("should broadcast air quality update to the correct room", async () => {
    return new Promise<void>((resolve) => {
      clientSocket.once("sensor:air-quality", (data) => {
        expect(data).toEqual({ AQI: 42 });
        resolve();
      });

      adapter.sendAirQualityUpdate(mockHome, { AQI: 42 });
    });
  });

  it("should broadcast wind update to the correct room", async () => {
    return new Promise<void>((resolve) => {
      clientSocket.once("sensor:wind", (data) => {
        expect(data).toEqual({ windSpeed: 15, windDirection: 180 });
        resolve();
      });

      adapter.sendWindUpdate(mockHome, { windSpeed: 15, windDirection: 180 });
    });
  });

  it("should broadcast weather update to the correct room", async () => {
    return new Promise<void>((resolve) => {
      clientSocket.once("sensor:weather", (data) => {
        expect(data).toEqual({
          forecast: WeatherForecast.Clear,
          precipitation: 0,
        });
        resolve();
      });

      adapter.sendWeatherUpdate(mockHome, {
        forecast: WeatherForecast.Clear,
        precipitation: 0,
      });
    });
  });
});
