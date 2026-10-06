import { Heart, Plus, Minus, Clock3 } from "lucide-react";
import { money } from "../api";

export function Quantity({ name, value, onChange }) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label={`Remove one ${name}`}
        onClick={() => onChange(-1)}
      >
        <Minus size={15} />
      </button>
      <span aria-label={`${value} portions`}>{value}</span>
      <button
        type="button"
        aria-label={`Add one ${name}`}
        disabled={value >= 10}
        onClick={() => onChange(1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

// Parent Menu and Saved pages pass data and event callbacks through props.
export default function FoodCard({
  item,
  quantity,
  saved,
  onAdd,
  onQuantity,
  onSave,
  reason,
}) {
  return (
    <article className="food-card">
      <div className="food-photo">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width="360"
          height="280"
        />
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${item.name}`}
          aria-pressed={saved}
          onClick={() => onSave(item.id)}
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
        {item.popular && <span className="popular">Kitchen favourite</span>}
      </div>
      <div className="food-info">
        <div className="dish-meta">
          <span
            className={`diet-dot ${item.diet === "Non-vegetarian" ? "nonveg" : ""}`}
          />
          {item.diet}
          <span className="prep">
            <Clock3 size={13} />
            {item.minutes} min
          </span>
        </div>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        {reason && <p className="reason">{reason}</p>}
        <div className="card-bottom">
          <strong>{money(item.price)}</strong>
          {quantity ? (
            <Quantity
              name={item.name}
              value={quantity}
              onChange={(value) => onQuantity(item.id, value)}
            />
          ) : (
            <button className="add-button" onClick={() => onAdd(item)}>
              <Plus size={16} /> Add
            </button>
          )}
        </div>
        <small className="allergens">
          {item.allergens.length
            ? `Contains ${item.allergens.join(", ").toLowerCase()}`
            : "No listed allergens"}
        </small>
      </div>
    </article>
  );
}
