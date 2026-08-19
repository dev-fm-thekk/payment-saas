import app from "../src/app";
import request from 'supertest';
import {it, expect} from 'vitest';

// server health checking
it("GET / returns 200", async () => {
    const res = await request(app).get("/")
    expect(res.status).toBe(200);
})

//backend v1 health checking
it("GET /api/v1/health", async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200);
})


