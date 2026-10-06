import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { useStore } from "../Store";
import FoodCard from "../components/FoodCard";

export function MenuState() {
  const { loading, error, loadMenu } = useStore();
  if (loading)
    return (
      <div className="empty" role="status">
        Getting today’s menu…
      </div>
    );
  if (error)
    return (
      <div className="empty" role="alert">
        <h2>The menu is taking a break.</h2>
        <p>{error}</p>
        <button className="button" onClick={loadMenu}>
          Try again
        </button>
      </div>
    );
  return null;
}
export function DishGrid({ items, reasons = {} }) {
  const { cart, favourites, add, changeQuantity, toggleFavourite } = useStore();
  return (
    <div className="food-grid">
      {items.map((item) => (
        <FoodCard
          key={item.id}
          item={item}
          quantity={cart[item.id] || 0}
          saved={favourites.includes(item.id)}
          onAdd={add}
          onQuantity={changeQuantity}
          onSave={toggleFavourite}
          reason={reasons[item.id]}
        />
      ))}
    </div>
  );
}
export default function Menu() {
  const { menu, loading, error } = useStore();
  const [category, setCategory] = useState("Everything");
  const [search, setSearch] = useState("");
  const [diet, setDiet] = useState("Any");
  const [sort, setSort] = useState("featured");
  const categories = ["Everything", ...new Set(menu.map((x) => x.category))];
  const items = useMemo(
    () =>
      menu
        .filter(
          (item) =>
            (category === "Everything" || item.category === category) &&
            (diet === "Any" ||
              item.diet === diet ||
              (diet === "Vegetarian" && item.diet === "Vegan")) &&
            `${item.name} ${item.description}`
              .toLowerCase()
              .includes(search.trim().toLowerCase()),
        )
        .sort((a, b) =>
          sort === "price"
            ? a.price - b.price
            : sort === "quick"
              ? a.minutes - b.minutes
              : Number(b.popular) - Number(a.popular),
        ),
    [menu, category, diet, search, sort],
  );
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">THE CAMPUS LUNCH CLUB</span>
          <h1>
            Something good.
            <br />
            Just around
            <br />
            {" "}<em>the corner.</em>
          </h1>
          <p>
            Fresh bowls, warm rolls and little treats.
            <br />
            Pick your favourites. We’ll handle lunch.
          </p>
          <a href="#menu" className="button">
            Explore the menu
          </a>
          <div className="hero-note">
            <span className="note-line" />
            Made to order. Ready for your next break.
          </div>
        </div>
        <div className="hero-photo">
          <img
            src="/images/food_1.png"
            alt="A fresh Greek salad with vegetables and feta"
            width="700"
            height="560"
          />
          <div className="photo-caption">
            <span>TODAY’S GOOD MOOD</span>
            <strong>A fresh start, in a bowl.</strong>
            <small>Greek salad · ₹149</small>
          </div>
          <span className="hero-sticker">
            Fresh
            <br />
            <em>thinking.</em>
          </span>
        </div>
      </section>
      <section className="menu-section" id="menu">
        <div className="section-top">
          <div>
            <span className="eyebrow">SOMETHING FOR EVERY APPETITE</span>
            <h2>What sounds good?</h2>
          </div>
          <Link to="/meal-finder" className="text-link">
            Help me choose <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="menu-toolbar">
          <div className="categories" aria-label="Food categories">
            {categories.map((name) => (
              <button
                key={name}
                className={category === name ? "selected" : ""}
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={18} />
            <input
              aria-label="Search the menu"
              placeholder="Find your favourite"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="filter-row">
          <span>{items.length} dishes on the menu</span>
          <div>
            <SlidersHorizontal size={16} />
            <label className="sr-only" htmlFor="diet">
              Diet
            </label>
            <select
              id="diet"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
            >
              <option value="Any">All diets</option>
              <option>Vegetarian</option>
              <option>Vegan</option>
              <option>Non-vegetarian</option>
            </select>
            <label className="sr-only" htmlFor="sort">
              Sort dishes
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Kitchen favourites</option>
              <option value="price">Price: low to high</option>
              <option value="quick">Quickest first</option>
            </select>
          </div>
        </div>
        <MenuState />
        {!loading &&
          !error &&
          (items.length ? (
            <DishGrid items={items} />
          ) : (
            <div className="empty">
              <h3>No dishes match that search.</h3>
              <button
                className="button secondary"
                onClick={() => {
                  setSearch("");
                  setCategory("Everything");
                  setDiet("Any");
                }}
              >
                Reset filters
              </button>
            </div>
          ))}
      </section>
      <aside className="finder-banner">
        <div>
          <span className="eyebrow">A LITTLE HELP WITH LUNCH</span>
          <h2>Your budget. Your taste.</h2>
          <p>Tell us what works for you. Find a meal that fits.</p>
        </div>
        <Link to="/meal-finder" className="button">
          Try the meal finder
        </Link>
      </aside>
    </div>
  );
}
