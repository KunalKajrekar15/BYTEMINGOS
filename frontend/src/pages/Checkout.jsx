import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useStore } from "../Store";
import { Summary } from "./Cart";
import { MenuState } from "./Menu";

export default function Checkout() {
  const { lines, saveReceipt, loading, error: menuError } = useStore();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    pickup: "Main kitchen",
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const order = await api("/orders", {
        method: "POST",
        body: {
          customer,
          notes,
          items: lines.map(({ id, quantity }) => ({ id, quantity })),
        },
      });
      saveReceipt(order);
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  if (loading || menuError)
    return (
      <div className="container page">
        <MenuState />
      </div>
    );
  if (!lines.length)
    return (
      <div className="empty">
        <h1>Your bag is empty.</h1>
        <Link className="button" to="/">
          Choose your lunch
        </Link>
      </div>
    );
  return (
    <div className="container page">
      <span className="eyebrow">ONE LAST THING</span>
      <h1>Where should we meet?</h1>
      <p className="intro">
        Choose a campus counter. We’ll keep your receipt here.
      </p>
      <div className="two-columns">
        <form className="panel checkout-form" onSubmit={submit}>
          <h2>Pickup details</h2>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            autoComplete="name"
            required
            minLength="2"
            maxLength="60"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Name for your order"
          />
          <label htmlFor="phone">Mobile number</label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            required
            pattern="[6-9][0-9]{9}"
            maxLength="10"
            title="Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9"
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
            placeholder="10-digit Indian mobile number"
          />
          <label htmlFor="pickup">Pickup counter</label>
          <select
            id="pickup"
            value={customer.pickup}
            onChange={(e) =>
              setCustomer({ ...customer, pickup: e.target.value })
            }
          >
            <option>Main kitchen</option>
            <option>Library counter</option>
            <option>North block</option>
          </select>
          <label htmlFor="notes">
            Kitchen notes <span className="muted">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows="3"
            maxLength="250"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything we should know?"
          />
          <small className="muted">{notes.length}/250 characters</small>
          <p className="form-note">
            This is a coursework demo. Use sample details; no real food is
            ordered and no SMS is sent.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Placing your order…" : "Place pickup order"}
          </button>
        </form>
        <Summary button={false} />
      </div>
    </div>
  );
}
