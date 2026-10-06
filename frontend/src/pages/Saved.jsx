import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useStore } from "../Store";
import { DishGrid, MenuState } from "./Menu";

export default function Saved() {
  const { menu, favourites, loading, error } = useStore();
  const items = menu.filter((x) => favourites.includes(x.id));
  return (
    <div className="container page">
      <span className="eyebrow">THE USUALS, ALL IN ONE PLACE</span>
      <h1>Saved for later.</h1>
      <p className="intro">Your favourite dishes, saved on this device.</p>
      <MenuState />
      {!loading &&
        !error &&
        (items.length ? (
          <DishGrid items={items} />
        ) : (
          <div className="empty">
            <Heart size={35} />
            <h2>Make room for your favourites.</h2>
            <p>Tap the heart on any dish to save it here.</p>
            <Link to="/" className="button">
              Browse the menu
            </Link>
          </div>
        ))}
    </div>
  );
}
