import express from "express";
import cors from "cors";
import { randomUUID, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const menu = JSON.parse(
  await readFile(path.join(here, "data/menu.json"), "utf8"),
);
const statuses = [
  "Received",
  "Preparing",
  "Ready for pickup",
  "Collected",
];

// A single-process JSON store keeps this coursework project easy to run.
// Writes are serialized and atomically replaced to avoid partially written orders.
export async function createApp({
  dataFile = path.join(here, "data/orders.json"),
  adminPin = "3301",
  clientOrigin = "http://127.0.0.1:5173",
} = {}) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  let orders;
  try {
    orders = JSON.parse(await readFile(dataFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    orders = [];
  }
  if (!Array.isArray(orders))
    throw new Error("The order store must contain an array.");
  let queue = Promise.resolve();
  const commit = (change) => {
    const pending = queue.then(async () => {
      const next = structuredClone(orders);
      const result = change(next);
      await writeFile(`${dataFile}.tmp`, JSON.stringify(next, null, 2));
      await rename(`${dataFile}.tmp`, dataFile);
      orders = next;
      return result;
    });
    queue = pending.catch(() => {});
    return pending;
  };
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: clientOrigin, methods: ["GET", "POST", "PATCH"] }));
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/menu", (_req, res) => res.json(menu));

  // Modification 1: explainable recommendations, without an external AI service.
  app.post("/api/recommendations", (req, res) => {
    const {
      budget,
      diet = "Any",
      maxMinutes = 30,
      excludedAllergens = [],
    } = req.body ?? {};
    const diets = ["Any", "Vegetarian", "Vegan", "Non-vegetarian"];
    if (
      !Number.isInteger(budget) ||
      budget < 50 ||
      budget > 1000 ||
      !diets.includes(diet) ||
      !Number.isInteger(maxMinutes) ||
      maxMinutes < 5 ||
      maxMinutes > 30 ||
      !Array.isArray(excludedAllergens) ||
      excludedAllergens.some(
        (x) => !["Wheat", "Milk", "Egg", "Soy"].includes(x),
      )
    ) {
      return res
        .status(400)
        .json({
          message: "Choose a budget from ₹50–₹1,000 and valid preferences.",
        });
    }
    const matches = menu
      .filter(
        (item) =>
          item.price <= budget &&
          item.minutes <= maxMinutes &&
          (diet === "Any" ||
            item.diet === diet ||
            (diet === "Vegetarian" && item.diet === "Vegan")) &&
          !item.allergens.some((a) => excludedAllergens.includes(a)),
      )
      .sort(
        (a, b) => Number(b.popular) - Number(a.popular) || a.price - b.price,
      )
      .slice(0, 3)
      .map((item) => ({
        ...item,
        reason: `₹${item.price} fits your budget; ready in about ${item.minutes} min${diet !== "Any" ? `; ${item.diet.toLowerCase()}` : ""}.`,
      }));
    res.json({ matches });
  });

  app.post("/api/orders", async (req, res) => {
    const { customer, items, notes = "" } = req.body ?? {};
    if (
      !customer ||
      typeof customer.name !== "string" ||
      customer.name.trim().length < 2 ||
      customer.name.trim().length > 60 ||
      typeof customer.phone !== "string" ||
      !/^[6-9]\d{9}$/.test(customer.phone) ||
      !["Main kitchen", "Library counter", "North block"].includes(
        customer.pickup,
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Enter your name, a valid Indian mobile number and a pickup counter.",
        });
    }
    if (
      typeof notes !== "string" ||
      notes.length > 250 ||
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > menu.length
    ) {
      return res
        .status(400)
        .json({
          message:
            "Add at least one menu item. Notes must be within 250 characters.",
        });
    }
    const ids = new Set();
    const lines = [];
    for (const line of items) {
      const dish = menu.find((x) => x.id === line?.id);
      if (
        !dish ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 10 ||
        ids.has(line.id)
      )
        return res
          .status(400)
          .json({
            message:
              "Invalid menu item or quantity. Each dish can have 1–10 portions.",
          });
      ids.add(line.id);
      lines.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: line.quantity,
      });
    }
    const order = {
      id: `BY-${randomUUID().slice(0, 8).toUpperCase()}`,
      trackingToken: randomBytes(24).toString("hex"),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone,
        pickup: customer.pickup,
      },
      items: lines,
      subtotal: lines.reduce((sum, x) => sum + x.price * x.quantity, 0),
      notes: notes.trim(),
      status: statuses[0],
      createdAt: new Date().toISOString(),
      payment: "Pay at pickup",
      estimatedMinutes:
        Math.max(...items.map((x) => menu.find((m) => m.id === x.id).minutes)) +
        5,
    };
    order.total = order.subtotal; // Pickup has no delivery charge or extra fee.
    await commit((next) => next.push(order));
    res.status(201).json(order);
  });

  // The unguessable token is a receipt key; order IDs alone do not expose records.
  app.get("/api/orders/:id", (req, res) => {
    const order = orders.find(
      (x) =>
        x.id === req.params.id &&
        x.trackingToken === req.headers["x-order-token"],
    );
    if (!order)
      return res
        .status(404)
        .json({
          message: "Order not found. Open the receipt from this browser.",
        });
    res.json(order);
  });
  app.use("/api/admin", (req, res, next) => {
    const supplied = Buffer.from(req.headers["x-admin-pin"] || "");
    const expected = Buffer.from(adminPin);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    )
      return res.status(401).json({ message: "Incorrect kitchen PIN." });
    next();
  });
  app.get("/api/admin/orders", (_req, res) =>
    res.json([...orders].reverse().map(({ trackingToken, ...order }) => order)),
  );
  app.patch("/api/admin/orders/:id", async (req, res) => {
    const { status } = req.body ?? {};
    const existing = orders.find((x) => x.id === req.params.id);
    if (!existing) return res.status(404).json({ message: "Order not found." });
    if (statuses.indexOf(status) !== statuses.indexOf(existing.status) + 1)
      return res
        .status(400)
        .json({ message: "Move the order to the next stage only." });
    const updated = await commit((next) => {
      const order = next.find((x) => x.id === req.params.id);
      if (statuses.indexOf(status) !== statuses.indexOf(order.status) + 1) {
        const error = new Error(
          "The order has changed. Refresh and try again.",
        );
        error.status = 409;
        throw error;
      }
      order.status = status;
      return order;
    });
    const { trackingToken, ...publicOrder } = updated;
    res.json(publicOrder);
  });
  const frontend = path.resolve(here, "../frontend/dist");
  app.use(express.static(frontend));
  app.use("/api", (_req, res) =>
    res.status(404).json({ message: "API route not found." }),
  );
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(frontend, "index.html")),
  );
  app.use((error, _req, res, _next) => {
    if (!error.status && !error.type)
      console.error("Bytemingos API error:", error);
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ message: "Invalid JSON request." });
    if (error.type === "entity.too.large")
      return res.status(413).json({ message: "Request too large." });
    res
      .status(error.status || 500)
      .json({
        message: error.status
          ? error.message
          : "Unable to complete the request. Please try again.",
      });
  });
  return app;
}
