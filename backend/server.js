import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);
const app = await createApp({
  adminPin: process.env.ADMIN_PIN || "3301",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",
});
const listener = app.listen(port, "127.0.0.1", () => {
  const address = listener.address();
  if (!address) return;
  console.log(`Bytemingos running at http://127.0.0.1:${address.port}`);
  console.log("Keep this window open while using the website.");
});
listener.on("error", (error) => {
  console.error(`Cannot start Bytemingos: ${error.message}`);
  process.exitCode = 1;
});
