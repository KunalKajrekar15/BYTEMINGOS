import { useEffect, useState } from "react";
import { api, money, stages } from "../api";

export default function Kitchen() {
  const [pin, setPin] = useState("");
  const [activePin, setActivePin] = useState("");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState("Active");
  useEffect(() => {
    if (!activePin) return;
    let active = true;
    async function refresh() {
      try {
        const data = await api("/admin/orders", {
          headers: { "x-admin-pin": activePin },
        });
        if (active) {
          setOrders(data);
          setError("");
        }
      } catch (e) {
        if (active) setError(e.message);
      }
    }
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [activePin]);
  async function login(e) {
    e.preventDefault();
    setError("");
    setBusy("login");
    try {
      const data = await api("/admin/orders", {
        headers: { "x-admin-pin": pin },
      });
      setOrders(data);
      setActivePin(pin);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function advance(order) {
    setBusy(order.id);
    try {
      await api(`/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "x-admin-pin": activePin },
        body: { status: stages[stages.indexOf(order.status) + 1] },
      });
      setOrders(
        await api("/admin/orders", { headers: { "x-admin-pin": activePin } }),
      );
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  const displayed = orders.filter(
    (x) =>
      filter === "All" ||
      (filter === "Active"
        ? x.status !== "Collected"
        : x.status === "Collected"),
  );
  return (
    <div className="container page">
      <span className="eyebrow">BEHIND THE COUNTER</span>
      <h1>The kitchen board.</h1>
      <p className="intro">Move each order from received to collected.</p>
      {!activePin ? (
        <form className="panel kitchen-login" onSubmit={login}>
          <h2>Kitchen access</h2>
          <label htmlFor="pin">Demo kitchen PIN</label>
          <input
            id="pin"
            type="password"
            autoComplete="off"
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <p className="form-note">
            For the local classroom demo, use PIN 3301. This is a demonstration
            gate, not production staff authentication.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={!!busy}>
            {busy ? "Opening…" : "Open kitchen board"}
          </button>
        </form>
      ) : (
        <>
          <div className="kitchen-stats">
            <div>
              <b>{orders.filter((x) => x.status !== "Collected").length}</b>
              <span>Active orders</span>
            </div>
            <div>
              <b>
                {orders.filter((x) => x.status === "Ready for pickup").length}
              </b>
              <span>Ready for pickup</span>
            </div>
            <div>
              <b>{orders.filter((x) => x.status === "Collected").length}</b>
              <span>Collected orders</span>
            </div>
            <button
              className="button secondary"
              onClick={() => {
                setActivePin("");
                setPin("");
                setOrders([]);
              }}
            >
              Lock board
            </button>
          </div>
          <div className="categories kitchen-filters">
            {["Active", "Collected", "All"].map((x) => (
              <button
                key={x}
                aria-pressed={filter === x}
                className={filter === x ? "selected" : ""}
                onClick={() => setFilter(x)}
              >
                {x}
              </button>
            ))}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {displayed.length ? (
            <div className="kitchen-grid">
              {displayed.map((order) => (
                <article className="panel kitchen-card" key={order.id}>
                  <div className="kitchen-card-top">
                    <strong>{order.id}</strong>
                    <span className="status-pill">{order.status}</span>
                  </div>
                  <h3>{order.customer.name}</h3>
                  <p className="muted">
                    {order.customer.pickup} ·{" "}
                    {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity} × {item.name}
                      </li>
                    ))}
                  </ul>
                  {order.notes && (
                    <p className="form-note">Note: {order.notes}</p>
                  )}
                  <div className="card-bottom">
                    <strong>{money(order.total)}</strong>
                    {order.status !== "Collected" && (
                      <button
                        className="button small"
                        disabled={!!busy}
                        onClick={() => advance(order)}
                      >
                        {busy === order.id
                          ? "Updating…"
                          : `Mark ${stages[stages.indexOf(order.status) + 1].toLowerCase()}`}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <h2>A quiet moment in the kitchen.</h2>
              <p>No {filter.toLowerCase()} orders to show.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
