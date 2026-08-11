// company crud unit tests

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("CRUD API testing for company", () => {
  const agent = request.agent(app);

  // constants
  const temp_user = {
    email: "abhiananthu2005.1988@gmail.com",
    name: "Abhiram-admin",
    password: "Abhi.@2005",
    role: "user",
  };

  let accessToken: string;
  let userId: string;
  let companyId: string;

  beforeAll(async () => {
    // create temp user
    const user_create_res = await agent
      .post("/api/v1/user/register")
      .type("form")
      .send({
        ...temp_user,
        passwordHash: temp_user.password,
      });

    if (!user_create_res.ok) {
      console.error(user_create_res.body);
      throw new Error("Temp user creation failed !");
    }

    // logging in
    const login_res = await agent
      .post("/api/v1/auth/login")
      .type("form")
      .send({ email: temp_user.email, password: temp_user.password });

    if (!login_res.ok) {
      console.error(login_res.body);
      throw new Error("Temp user login failed !");
    }

    accessToken = login_res.body.accessToken as string;
    userId = login_res.body.user.id as string;

    console.log(
      `created and logged in temp user ${temp_user.name}: ${temp_user.email}`,
    );
  });

  //clean up logging out and deleting user
  afterAll(async () => {
    //logout
    await agent.post("/api1/v1/auth/logout");
    // del user
    await agent
      .post(`/api/v1/user/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  });

  // create company happy path
  it("POST /api/v1/company/ returns 201", async () => {
    let data = {
      name: "Temp-company-1",
    };

    let response = await agent
      .post("/api/v1/company/")
      .type("form")
      .send(data)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(201);
    companyId = response.body.payload[0].id;
  });

  // create company no name in body
  it("POST /api/v1/company/ returns 400", async () => {
    let data = {
      naMe: "Temp-company-1",
    };

    let response = await agent
      .post("/api/v1/company/")
      .type("form")
      .send(data)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });

  // create company with no accessToken
  it("POST /api/v1/company/ returns 400", async () => {
    let data = {
      naMe: "Temp-company-1",
    };

    let response = await agent
      .post("/api/v1/company/")
      .type("form")
      .send(data)
    
    if (!response.ok) {
        console.error(response.body);
    }

    expect(response.statusCode).toBe(401);
  });

  // get company by company unit test
  it("GET /api/v1/company/ returns 200", async () => {
    let response = await agent.get("/api/v1/company").set("Authorization", `Bearer ${accessToken}`);
    if (!response.ok) {
        console.error(response.body);
    }

    expect(response.statusCode).toBe(200);
  })

  // get company by company without access token
  it("GET /api/v1/company/ returns 401", async () => {
    let response = await agent.get("/api/v1/company")
    if (!response.ok) {
        console.error(response.body);
    }

    expect(response.statusCode).toBe(401);
  })
  
  // get company by id 
  it("GET /api/v1/company/ returns 200", async () => {
    let response = await agent.get(`/api/v1/company/${companyId}`).set("Authorization", `Bearer ${accessToken}`);
    if (!response.ok) {
        console.error(response.body);
    }

    expect(response.statusCode).toBe(200);
  })

  // without acceessToken
  it("GET /api/v1/company/ returns 401", async () => {
    let response = await agent.get(`/api/v1/company/${companyId}`)
    if (!response.ok) {
        console.error(response.body);
    }

    expect(response.statusCode).toBe(401);
  })
});
