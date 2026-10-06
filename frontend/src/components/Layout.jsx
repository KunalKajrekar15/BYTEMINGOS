import { NavLink, Link, Outlet } from "react-router-dom";
import { ShoppingBag, Heart, MapPin, UtensilsCrossed } from "lucide-react";
import { useStore } from "../Store";

export default function Layout() {
  const { count } = useStore();
  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <div className="topline">
        A good lunch. A better break.{" "}
        <span>Freshly made for campus pickup</span>
      </div>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Bytemingos home">
            <span className="brand-icon">
              <UtensilsCrossed size={23} />
            </span>
            bytemingos<span className="brand-period">.</span>
          </Link>
          <div className="location">
            <MapPin size={17} />
            <div>
              <small>YOUR NEIGHBOURHOOD</small>
              <span>Campus kitchen</span>
            </div>
          </div>
          <nav aria-label="Main navigation">
            <NavLink end to="/">
              Menu
            </NavLink>
            <NavLink to="/meal-finder">Meal finder</NavLink>
            <NavLink to="/orders">My orders</NavLink>
          </nav>
          <div className="header-actions">
            <NavLink to="/saved" className="icon-link" aria-label="Saved meals">
              <Heart size={20} />
            </NavLink>
            <NavLink to="/cart" className="bag-link">
              <ShoppingBag size={18} />
              <span>My bag</span>
              <b>{count}</b>
            </NavLink>
          </div>
        </div>
      </header>
      <main id="content">
        <Outlet />
      </main>
      <footer className="footer">
        <div>
          <Link to="/" className="brand">
            bytemingos<span className="brand-period">.</span>
          </Link>
          <p>Good food, between everything else.</p>
        </div>
        <div className="footer-right">
          <span>Campus pickup · Pay at the counter</span>
          <Link to="/kitchen">Kitchen dashboard</Link>
          <small>
            Coursework demo · Menu, prices and counters are sample data.
          </small>
        </div>
      </footer>
    </>
  );
}
