import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { createApp } from "../app.js";

test("full order lifecycle, persistence, validation and recommendation constraints", async (t) => {
  const directory = await mkdtemp(path.resolve("data/bytemingos-test-"));
  const dataFile = path.join(directory, "orders.json");
  let server;
  let base;
  async function start() {
    const app = await createApp({ dataFile });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}/api`;
  }
  async function stop() {
    await new Promise((resolve) => server.close(resolve));
  }
  async function request(route, method = "GET", body, headers = {}) {
    const response = await fetch(base + route, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      body: await response.json(),
      headers: response.headers,
    };
  }
  try {
    await start();
    const menu = await request("/menu");
    assert.equal(menu.status, 200);
    assert.equal(menu.body.length, 12);
    const cors = await request("/menu", "GET", undefined, {
      Origin: "http://127.0.0.1:5173",
    });
    assert.equal(
      cors.headers.get("access-control-allow-origin"),
      "http://127.0.0.1:5173",
    );
    const payload = {
      customer: {
        name: "Demo Student",
        phone: "9876543210",
        pickup: "Library counter",
      },
      items: [{ id: "greek-salad", quantity: 2 }],
      total: 1,
    };
    await t.test(
      "invalid checkout and tampered quantities are rejected",
      async () => {
        assert.equal(
          (
            await request("/orders", "POST", {
              ...payload,
              customer: { ...payload.customer, phone: "123" },
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/orders", "POST", {
              ...payload,
              items: [{ id: "missing", quantity: 1 }],
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/orders", "POST", {
              ...payload,
              items: [{ id: "greek-salad", quantity: 0 }],
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/orders", "POST", {
              ...payload,
              items: [{ id: "greek-salad", quantity: 11 }],
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/orders", "POST", {
              ...payload,
              items: [...payload.items, ...payload.items],
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/orders", "POST", {
              ...payload,
              notes: "x".repeat(251),
            })
          ).status,
          400,
        );
      },
    );
    const result = await request("/orders", "POST", payload);
    const order = result.body;
    await t.test(
      "prices are calculated on the server and receipt needs its token",
      async () => {
        assert.equal(result.status, 201);
        assert.equal(order.total, 298);
        assert.equal(order.status, "Received");
        assert.equal((await request(`/orders/${order.id}`)).status, 404);
        assert.equal(
          (
            await request(`/orders/${order.id}`, "GET", undefined, {
              "x-order-token": "wrong",
            })
          ).status,
          404,
        );
        assert.equal(
          (
            await request(`/orders/${order.id}`, "GET", undefined, {
              "x-order-token": order.trackingToken,
            })
          ).status,
          200,
        );
      },
    );
    const auth = { "x-admin-pin": "3301" };
    await t.test(
      "kitchen requires PIN and transitions must follow order",
      async () => {
        assert.equal((await request("/admin/orders")).status, 401);
        assert.equal(
          (
            await request("/admin/orders", "GET", undefined, {
              "x-admin-pin": "bad",
            })
          ).status,
          401,
        );
        const admin = await request("/admin/orders", "GET", undefined, auth);
        assert.equal(admin.status, 200);
        assert.equal("trackingToken" in admin.body[0], false);
        assert.equal(
          (
            await request(
              `/admin/orders/${order.id}`,
              "PATCH",
              { status: "Collected" },
              auth,
            )
          ).status,
          400,
        );
        for (const status of ["Preparing", "Ready for pickup", "Collected"]) {
          assert.equal(
            (
              await request(
                `/admin/orders/${order.id}`,
                "PATCH",
                { status },
                auth,
              )
            ).body.status,
            status,
          );
        }
        assert.equal(
          (
            await request(
              `/admin/orders/${order.id}`,
              "PATCH",
              { status: "Received" },
              auth,
            )
          ).status,
          400,
        );
      },
    );
    await t.test(
      "recommendations respect budget, diet, time and excluded ingredients",
      async () => {
        const result = await request("/recommendations", "POST", {
          budget: 150,
          diet: "Vegan",
          maxMinutes: 15,
          excludedAllergens: ["Wheat"],
        });
        assert.equal(result.status, 200);
        assert.ok(result.body.matches.length > 0);
        assert.ok(
          result.body.matches.every(
            (x) =>
              x.price <= 150 &&
              x.minutes <= 15 &&
              x.diet === "Vegan" &&
              !x.allergens.includes("Wheat") &&
              x.reason,
          ),
        );
        assert.equal(
          (await request("/recommendations", "POST", { budget: 1 })).status,
          400,
        );
        assert.equal(
          (
            await request("/recommendations", "POST", {
              budget: 50,
              diet: "Vegan",
              maxMinutes: 5,
            })
          ).body.matches.length,
          0,
        );
      },
    );
    await stop();
    await start();
    await t.test("orders survive a server restart", async () => {
      const saved = await request(`/orders/${order.id}`, "GET", undefined, {
        "x-order-token": order.trackingToken,
      });
      assert.equal(saved.body.status, "Collected");
      assert.equal(saved.body.total, 298);
    });
    await t.test(
      "parallel orders persist without overwriting each other",
      async () => {
        const results = await Promise.all(
          Array.from({ length: 5 }, () => request("/orders", "POST", payload)),
        );
        assert.ok(results.every((x) => x.status === 201));
        assert.equal(
          (await request("/admin/orders", "GET", undefined, auth)).body.length,
          6,
        );
      },
    );
  } finally {
    if (server?.listening) await stop();
    await rm(directory, { recursive: true, force: true });
  }
});
