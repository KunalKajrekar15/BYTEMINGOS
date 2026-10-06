import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Clock3, MapPin, RefreshCw } from "lucide-react";
import { useStore } from "../Store";
import { api, money, stages } from "../api";

function useReceipt(receipt) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!receipt) {
      setLoading(false);
      return;
    }
    let active = true;
    async function refresh() {
      try {
        const data = await api(`/orders/${receipt.id}`, {
          headers: { "x-order-token": receipt.token },
        });
        if (active) {
          setOrder(data);
          setError("");
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [receipt?.id, receipt?.token]);
  return { order, error, loading };
}
function OrderRow({ receipt }) {
  const { order, loading, error } = useReceipt(receipt);
  return (
    <Link className="order-row panel" to={`/orders/${receipt.id}`}>
      <div>
        <span className="eyebrow">{receipt.id}</span>
        <h3>
          {order
            ? `${order.items.reduce((sum, x) => sum + x.quantity, 0)} items · ${money(order.total)}`
            : loading
              ? "Loading receipt…"
              : "Receipt unavailable"}
        </h3>
        <span className="muted">
          {new Date(receipt.createdAt).toLocaleString("en-IN")}
        </span>
        {error && <p className="error">{error}</p>}
      </div>
      <span className="status-pill">{order?.status || "View receipt"}</span>
    </Link>
  );
}
export default function Orders() {
  const { receipts } = useStore();
  return (
    <div className="container page narrow">
      <span className="eyebrow">FROM THE KITCHEN TO YOUR BREAK</span>
      <h1>Your orders.</h1>
      <p className="intro">
        Receipts saved on this device. Status refreshes every 8 seconds.
      </p>
      {receipts.length ? (
        <div className="order-list">
          {receipts.map((receipt) => (
            <OrderRow key={receipt.id} receipt={receipt} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Clock3 size={36} />
          <h2>Your first lunch is a few clicks away.</h2>
          <p>Order a meal and your receipt will appear here.</p>
          <Link to="/" className="button">
            Browse the menu
          </Link>
        </div>
      )}
    </div>
  );
}
export function OrderDetails() {
  const { id } = useParams();
  const { receipts } = useStore();
  const receipt = receipts.find((x) => x.id === id);
  const { order, error, loading } = useReceipt(receipt);
  if (!receipt)
    return (
      <div className="empty">
        <h1>Receipt not found on this device.</h1>
        <p>Open the browser you used to place this order.</p>
        <Link to="/orders" className="button">
          My orders
        </Link>
      </div>
    );
  if (loading)
    return (
      <div className="empty" role="status">
        Getting your receipt…
      </div>
    );
  if (!order)
    return (
      <div className="empty" role="alert">
        <h1>Unable to load your receipt.</h1>
        <p>{error}</p>
        <Link to="/orders" className="button">
          Back to orders
        </Link>
      </div>
    );
  const current = stages.indexOf(order.status);
  return (
    <div className="container page narrow">
      <span className="eyebrow">{order.id}</span>
      <h1>
        {current === 3
          ? "Hope you enjoyed it."
          : current === 2
            ? "Lunch is ready."
            : "Good food is on its way."}
      </h1>
      <p className="intro">
        {current === 2
          ? `Collect your order at ${order.customer.pickup}.`
          : current === 3
            ? "Your order has been collected."
            : `Thanks, ${order.customer.name}. The kitchen has your order.`}
      </p>
      {error && (
        <p className="error" role="alert">
          Status update failed: {error}
        </p>
      )}
      <section className="panel receipt">
        <ol className="timeline">
          {stages.map((stage, i) => (
            <li
              key={stage}
              className={i <= current ? "complete" : ""}
              aria-current={i === current ? "step" : undefined}
            >
              <span>{i < current ? <Check size={17} /> : i + 1}</span>
              <b>{stage}</b>
            </li>
          ))}
        </ol>
        <div className="pickup-info">
          <span>
            <MapPin size={18} />
            {order.customer.pickup}
          </span>
          <span>
            <Clock3 size={18} />
            {current < 2
              ? `Initial estimate: ${order.estimatedMinutes} min`
              : order.status}
          </span>
        </div>
        <div className="receipt-items">
          {order.items.map((item) => (
            <div key={item.id}>
              <span>
                {item.quantity} × {item.name}
              </span>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="receipt-total">
            <span>Total · {order.payment}</span>
            <strong>{money(order.total)}</strong>
          </div>
        </div>
        {order.notes && (
          <p className="form-note">Kitchen note: {order.notes}</p>
        )}
        <p className="form-note">
          <RefreshCw size={13} /> Status refreshes every 8 seconds. Preparation
          time is an estimate, not a live countdown.
        </p>
      </section>
      <div className="receipt-actions">
        <Link to="/" className="button">
          Back to the menu
        </Link>
        <Link to="/orders" className="text-link">
          All my orders
        </Link>
      </div>
    </div>
  );
}
