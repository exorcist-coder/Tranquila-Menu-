import { BRANCHES } from "@/lib/branches";

export default function BranchSelector() {
  return (
    <main className="branch-select">
      <header className="branch-select-head">
        <img src="/brand/mark.png" alt="" width={64} height={30} />
        <p>TRANQUILA HOTELS</p>
        <h1>Choose your hotel</h1>
        <span>View the menu and order from your hotel’s kitchen.</span>
      </header>
      <nav className="branch-options" aria-label="Choose a hotel">
        {BRANCHES.map((branch, index) => (
          <a className="branch-option" key={branch.id} href={`/?branch=${branch.id}`}>
            <span className="branch-index">0{index + 1}</span>
            <span className="branch-option-copy">
              <strong>{branch.name}</strong>
              <span>{branch.address}</span>
            </span>
            <span className="branch-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </nav>
      <footer className="branch-select-foot">Food, wine and drinks, brought to your room or ready for collection.</footer>
    </main>
  );
}