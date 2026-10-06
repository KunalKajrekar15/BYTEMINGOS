import { useState } from "react";
import { api } from "../api";
import { DishGrid } from "./Menu";

export default function MealFinder() {
  const [budget, setBudget] = useState(180);
  const [diet, setDiet] = useState("Any");
  const [maxMinutes, setMaxMinutes] = useState(20);
  const [excludedAllergens, setExcluded] = useState([]);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function find(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/recommendations", {
        method: "POST",
        body: {
          budget: Number(budget),
          diet,
          maxMinutes: Number(maxMinutes),
          excludedAllergens,
        },
      });
      setMatches(result.matches);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <span className="eyebrow">LESS SCROLLING. MORE LUNCH.</span>
      <h1>What’s your kind of meal?</h1>
      <p className="intro">A few preferences. Up to three dishes that fit.</p>
      <div className="finder-layout">
        <form className="panel finder-form" onSubmit={find}>
          <h2>Make it your own</h2>
          <label htmlFor="budget">
            Budget per dish <b>₹{budget}</b>
          </label>
          <input
            id="budget"
            type="range"
            min="50"
            max="500"
            step="10"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <div className="range-labels">
            <span>₹50</span>
            <span>₹500</span>
          </div>
          <label htmlFor="finder-diet">Diet preference</label>
          <select
            id="finder-diet"
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
          >
            <option value="Any">I eat everything</option>
            <option>Vegetarian</option>
            <option>Vegan</option>
            <option>Non-vegetarian</option>
          </select>
          <label htmlFor="minutes">How much time do you have?</label>
          <select
            id="minutes"
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(e.target.value)}
          >
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
          </select>
          <fieldset>
            <legend>Ingredients to leave out</legend>
            {["Wheat", "Milk", "Egg", "Soy"].map((a) => (
              <label className="check-label" key={a}>
                <input
                  type="checkbox"
                  checked={excludedAllergens.includes(a)}
                  onChange={(e) =>
                    setExcluded((old) =>
                      e.target.checked
                        ? [...old, a]
                        : old.filter((x) => x !== a),
                    )
                  }
                />
                {a}
              </label>
            ))}
          </fieldset>
          <p className="form-note">
            Matches use the listed ingredients. For an allergy, check with the
            kitchen about cross-contact before ordering.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Finding your lunch…" : "Find my meal"}
          </button>
        </form>
        <section className="finder-results" aria-live="polite">
          {matches === null ? (
            <div className="finder-placeholder">
              <span className="large-number">01 / 02 / 03</span>
              <h2>
                A shortlist,
                <br />
                made for you.
              </h2>
              <p>
                Choose what matters to you. We’ll shortlist meals that fit your
                budget, taste and time, with a reason for every pick.
              </p>
            </div>
          ) : matches.length ? (
            <>
              <h2>Your lunch shortlist</h2>
              <p className="muted">
                Each pick includes a reason. Prices are per portion.
              </p>
              <DishGrid
                items={matches}
                reasons={Object.fromEntries(
                  matches.map((x) => [x.id, x.reason]),
                )}
              />
            </>
          ) : (
            <div className="empty">
              <h2>No exact match this time.</h2>
              <p>Try a higher budget, more time or different preferences.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
