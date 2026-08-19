  import app from "../src/app";
  import request from "supertest";
  import {
    it,
    expect,
    beforeEach,
    afterEach,
    describe,
    beforeAll,
    afterAll,
  } from "vitest";
  import { performance } from "perf_hooks";

  const cleanUpUsers = async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .type("form")
      .send({
        email: "abhiananthu2005.1988@gmail.com",
        password: "Abhi.@2005",
      });

    let accessToken: string = loginRes.body.accessToken;
    let userId: string = loginRes.body.user.id;

    const res = await request(app)
      .delete(`/api/v1/user/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    if (!res.ok || res.statusCode === 500) {
      throw new Error("clean up failed");
    }
  };

  // auth unit tests
  describe("auth unit tests", () => {
    let start: number;

    beforeEach(() => {
      start = performance.now();
    });

    afterEach((ctx) => {
      const duration = performance.now() - start;
      console.log(`[${ctx.task.name}] ${duration.toFixed(2)}ms`);
    });

    afterAll(() => {
      cleanUpUsers()
        .then(() => console.log("clean up success !\n"))
        .catch((err) => {
          let message = err instanceof Error ? err.message : "clean up failed";
          console.error(message);
        });
    });

    // create account happy path
    it("POST /api/v1/user/register", async () => {
      const data = {
        email: "abhiananthu2005.1988@gmail.com",
        passwordHash: "Abhi.@2005",
        name: "Abhiram-admin",
        role: "user",
      };
      const res = await request(app)
        .post("/api/v1/user/register")
        .type("form")
        .send(data);

      expect(res.statusCode).toBe(201);

      if (!res.ok) {
        console.error(res.body);
      }
    });

    // create account returns 400 path
    it("POST /api/v1/user/register", async () => {
      const data = {
        email: "abhiananthu2005.1988@gmail.com",
        password: "Abhi.@2005",
        name: "Abhiram-admin",
      };

      const res = await request(app)
        .post("/api/v1/user/register")
        .send(data)
        .set("content-type", "application/json");

      expect(res.statusCode).toBe(400);
    });

    // login happy path
    it("POST /api/v1/auth/login returns 200", async () => {
      const data = {
        email: "abhiananthu2005.1988@gmail.com",
        password: "Abhi.@2005",
      };

      const res = await request(app)
        .post("/api/v1/auth/login")
        .type("form")
        .send(data);

      expect(res.statusCode).toBe(200);
      // check if access token in response body

      expect(res.body.accessToken).toBeDefined();
      // check if refresh token is saved in cookie
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    // login incorrect credentials
    it("POST /api/v1/auth/login returns 400", async () => {
      const data = {
        email: "abhiananthu2005.1988@gmail.com",
        password: "Abi.@2005",
      };

      const res = await request(app)
        .post("/api/v1/auth/login")
        .type("form")
        .send(data);

      expect(res.statusCode).toBe(401);
    });
  });

  // auth integration test: authenticate workflow
  describe("Authenticated flows", () => {
    const agent = request.agent(app); // persists cookies across calls

    let userId: string;
    let accessToken: string;

    beforeAll(async () => {
      const res = await agent
        .post("/api/v1/auth/login")
        .type("form")
        .send({ email: "abhiramajithr@gmail.com", password: "Abhi.@1234" });
      // agent now stores the Set-Cookie from this response automatically

      // setting global userId
      userId = res.body.user.id as string;
      accessToken = res.body.accessToken as string;
    });

    // access user data, using bearer token
    it("GET /api/v1/user/:id returns 200", async () => {
      const res = await agent
        .get(`/api/v1/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
    });

    // logging out
    it("POST /api/v1/auth/logout returns 200", async () => {});
  });

  //auth integration test: /refresh token
  describe("Refresh token workflows", async () => {
    const agent = request.agent(app);

    let userId: string;
    let accessToken: string;

    beforeAll(async () => {
      const res = await agent
        .post("/api/v1/auth/login")
        .type("form")
        .send({ email: "abhiramajithr@gmail.com", password: "Abhi.@1234" });

      userId = res.body.user.id as string;
      accessToken = res.body.accessToken as string;
    });

    afterAll(async () => {
      const res = await agent.post("/api/v1/auth/logout");
      if (!res.ok) console.error('clean up failed: unable to logout')

      console.log('clean up: user session logged out')
    });

    // access user data, using bearer token
    it("GET /api/v1/user/:id returns 200", async () => {
      const res = await agent
        .get(`/api/v1/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
    });

    it("POST /api/v1/auth/refresh", async () => {
      const res = await agent.post("/api/v1/auth/refresh");
      
      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();

      accessToken = res.body.accessToken;
    }, 130_000);

    // retrying accessToken
    it("GET /api/v1/user/:id returns 200 retry", async () => {
      const res = await agent
        .get(`/api/v1/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
    });
  });
