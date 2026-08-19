import request from "supertest";
import { it, describe, expect, beforeAll, afterAll } from "vitest";
import app from "../src/app";

// service crud apis
describe("Service CRUD unit test", () => {
  const agent = request.agent(app);

  let userId: string;
  let accessToken: string;
  let companyId: string;
  let serviceId: string;

  beforeAll(async () => {
    const res = await agent
      .post("/api/v1/auth/login")
      .type("form")
      .send({ email: "abhiramajithr@gmail.com", password: "Abhi.@1234" });

    userId = res.body.user.id as string;
    accessToken = res.body.accessToken as string;


    const companyRes = await agent
                        .post("/api/v1/company/")
                        .type('form')
                        .send({ name: 'test-company-1' })
                        .set('Authorization', `Bearer ${accessToken}`);

    if (!companyRes.ok) console.error(companyRes)
    else 
        companyId = companyRes.body.payload[0].id;
  });

  afterAll(async () => {
    await agent.post("/api1/v1/auth/logout");
    // del user
    await agent
      .delete(`/api/v1/user/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  });


  // create service unit test
  it("POST /api/v1/service/ returns 201", async () => {
    const data = {
        companyId,
        name: "Gramaphone",
        currency: "INR"
    };

    const res = await agent.post('/api/v1/service').type('form').send(data).set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(201);

    serviceId = res.body.payload[0].id;
  })

  // get services by a company
  it("GET /api/v1/service/company/:companyId returns 200", async () => {
    const res = await agent.get(`/api/v1/service/company/${companyId}`).set('Authorization', `Bearer ${accessToken}`);
    
    if (!res.ok) console.error(res.body);

    expect(res.statusCode).toBe(200);

  })

  // get service by id
  it("GET /api/v1/service/:id returns 200", async () => {
    const res = await agent.get(`/api/v1/service/${serviceId}`).set('Authorization', `Bearer ${accessToken}`);

    if (!res.ok) console.error(res.body);
    expect(res.statusCode).toBe(200);
  })
});
