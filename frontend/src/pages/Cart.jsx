import { Link } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "../Store";
import { money } from "../api";
import { Quantity } from "../components/FoodCard";
import { MenuState } from "./Menu";

export function Summary({ button = true }) {
  const { subtotal, count } = useStore();
  return (
    <aside className="panel summary">
      <span className="eyebrow">A LITTLE RECAP</span>
      <h2>Your order</h2>
      <div>
        <span>
          Subtotal ({count} {count === 1 ? "item" : "items"})
        </span>
        <strong>{money(subtotal)}</strong>
      </div>
      <div>
        <span>Campus pickup</span>
        <span>Free</span>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{money(subtotal)}</strong>
      </div>
      <p>
        Pay at the counter when you collect your order. No online payment
        required.
      </p>
      {button && (
        <Link to="/checkout" className="button">
          Continue to checkout
        </Link>
      )}
    </aside>
  );
}
export default function Cart() {
  const { lines, changeQuantity, loading, error } = useStore();
  return (
    <div className="container page">
      <span className="eyebrow">GOOD CHOICES, ALL TOGETHER</span>
      <h1>Your lunch bag.</h1>
      <MenuState />
      {!loading &&
        !error &&
        (lines.length ? (
          <div className="two-columns">
            <div className="cart-lines">
              {lines.map((item) => (
                <article className="cart-item" key={item.id}>
                  <img
                    src={item.image}
                    alt={item.name}
                    width="100"
                    height="80"
                  />
                  <div>
                    <span className="muted">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{money(item.price)} each</p>
                  </div>
                  <Quantity
                    name={item.name}
                    value={item.quantity}
                    onChange={(value) => changeQuantity(item.id, value)}
                  />
                  <strong>{money(item.price * item.quantity)}</strong>
                  <button
                    className="icon-link"
                    aria-label={`Remove ${item.name} from bag`}
                    onClick={() => changeQuantity(item.id, -item.quantity)}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))}
              <Link to="/" className="text-link">
                Add something else
              </Link>
            </div>
            <Summary />
          </div>
        ) : (
          <div className="empty">
            <ShoppingBag size={40} />
            <h2>Your bag’s waiting for something good.</h2>
            <p>Start with a bowl, a roll, or your usual.</p>
            <Link to="/" className="button">
              Explore the menu
            </Link>
          </div>
        ))}
    </div>
  );
}
