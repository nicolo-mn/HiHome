import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { io as ioClient, Socket } from "socket.io-client";
import { default as app, server, io } from "../../index";

describe("Notification Context Integration Tests", () => {
  let token: string;
  let port: number;
  beforeAll(async () => {
    const loginRes = await request(app).post("/api/login").send({
      username: "mockuser",
      houseId: "1",
      password: "mockpassword",
    });
    token = loginRes.body.token;

    await new Promise<void>((resolve) => {
      server.listen(() => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(() => {
    io.close();
  });

  it("should receive an action notification when an action is triggered", async () => {
    return new Promise<void>((resolve, reject) => {
      const socket: Socket = ioClient(`http://localhost:${port}`, {
        auth: { token },
        query: { homeId: "1" },
      });

      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error("Socket.io notification test timeout"));
      }, 5000);

      socket.once("connect", () => {
        request(app)
          .post("/home/1/components/light-1/turnOn")
          .set("Authorization", `Bearer ${token}`)
          .then((res) => {
            if (res.status !== 200) {
              clearTimeout(timeout);
              socket.close();
              reject(
                new Error(
                  `Unexpected status: ${res.status} for action trigger`,
                ),
              );
            }
          })
          .catch((e) => {
            clearTimeout(timeout);
            socket.close();
            reject(e);
          });
      });

      socket.once("notification", (data) => {
        try {
          expect(data.homeId).toBe("1");
          expect(data.type).toBe("ComponentAction");
          expect(typeof data.message).toBe("string");
          clearTimeout(timeout);
          socket.close();
          resolve();
        } catch (e) {
          clearTimeout(timeout);
          socket.close();
          reject(e);
        }
      });

      socket.once("connect_error", (e) => {
        clearTimeout(timeout);
        socket.close();
        reject(e);
      });
    });
  });
});
