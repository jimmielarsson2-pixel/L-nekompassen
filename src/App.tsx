
 import React, { useMemo, useState } from "react";
import { mockLoans, Loan } from "./mockData";
import LoanList from "./LoanList";
type Tab = "overview" | "loans" | "offers";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  `${value.toFixed(2).replace(".", ",")}%`;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(mockLoans[0]);

const handleSelectLoan = (loan: Loan) => {
  setSelectedLoan(loan);
};
  const totals = useMemo(() => {
    const totalPrincipal = mockLoans.reduce(
      (sum, loan) => sum + loan.principalRemaining,
      0
    );
    const totalMonthly = mockLoans.reduce(
      (sum, loan) => sum + loan.monthlyPayment,
      0
    );
    const totalInterestWeighted = mockLoans.reduce(
      (sum, loan) => sum + loan.interestRate * loan.principalRemaining,
      0
    );
    const avgRate =
      totalPrincipal > 0 ? totalInterestWeighted / totalPrincipal : 0;

    return {
      totalPrincipal,
      totalMonthly,
      avgRate,
    };
  }, []);

  const loanHealthScore = useMemo(() => {
    const ratio =
      totals.totalMonthly > 0
        ? mockLoans.filter((l) => l.interestRate > 10).length /
          mockLoans.length
        : 0;
    const base = 80 - ratio * 25;
    return Math.max(30, Math.min(95, Math.round(base)));
  }, [totals.totalMonthly]);

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setActiveTab("loans");
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-circle">LK</div>
          <div>
            <div className="app-title">LåneKompassen</div>
            <div className="app-subtitle">
              All dina lån. En tydlig riktning.
            </div>
          </div>
        </div>
        <div className="header-right">
          <span className="user-greeting">Hej Jimmie 👋</span>
          <span className="user-pill">Demo-användare</span>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === "overview" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("overview")}
        >
          Översikt
        </button>
        <button
          className={activeTab === "loans" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("loans")}
        >
          Lån
        </button>
        <button
          className={activeTab === "offers" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("offers")}
        >
          Erbjudanden
        </button>
      </nav>

      <main className="app-main">
        <section className="main-left">
          {activeTab === "overview" && (
            <>
              <h2>Din lånebild</h2>
              <div className="kpi-grid">
                <KpiCard
                  label="Totalt lånebelopp"
                  value={formatCurrency(totals.totalPrincipal)}
                />
                <KpiCard
                  label="Total månadskostnad"
                  value={formatCurrency(totals.totalMonthly)}
                />
                <KpiCard
                  label="Genomsnittlig ränta"
                  value={formatPercent(totals.avgRate)}
                />
                <KpiCard
                  label="Lånehälsa"
                  value={`${loanHealthScore} / 100`}
                  accent
                />
              </div>

              <h3 style={{ marginTop: "2rem" }}>Fördelning per lånetyp</h3>
              <div className="category-grid">
                {["Bolån", "Privatlån", "Billån", "Kreditkort"].map(
                  (cat) => (
                    <CategoryCard
                      key={cat}
                      category={cat}
                      loans={mockLoans.filter((l) => l.category === cat)}
                    />
                  )
                )}
              </div>

              <h3 style={{ marginTop: "2rem" }}>Alla lån</h3>
              <LoanList loans={mockLoans} onSelect={handleSelectLoan} />
            </>
          )}

          {activeTab === "loans" && (
  <div
    style={{
      display: "flex",
      gap: "24px",
      alignItems: "flex-start",
      marginTop: "8px",
    }}
  >
    <div style={{ flex: 3 }}>
      <h2>Låneöversikt</h2>
      <LoanList loans={mockLoans} onSelect={handleSelectLoan} />
    </div>

    <div style={{ flex: 2 }}>
      <LoanDetailsPanel loan={selectedLoan} />
    </div>
  </div>
)}

          {activeTab === "offers" && (
            <>
              <h2>Förbättra din lånesituation</h2>
              <OffersPanel loans={mockLoans} totals={totals} />
            </>
          )}
        </section>

        <section className="main-right">
          <LoanDetailsPanel loan={selectedLoan} />
        </section>
      </main>
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <div className={accent ? "kpi-card accent" : "kpi-card"}>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
  </div>
);

const CategoryCard: React.FC<{ category: string; loans: Loan[] }> = ({
  category,
  loans,
}) => {
  const total = loans.reduce((sum, l) => sum + l.principalRemaining, 0);
  const monthly = loans.reduce((sum, l) => sum + l.monthlyPayment, 0);

  return (
    <div className="category-card">
      <div className="category-header">
        <span className="category-dot" />
        <span className="category-title">{category}</span>
      </div>
      {loans.length === 0 ? (
        <div className="category-empty">Inga aktiva lån i denna kategori.</div>
      ) : (
        <>
          <div className="category-row">
            <span>Totalt belopp</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="category-row">
            <span>Månadskostnad</span>
            <span>{formatCurrency(monthly)}</span>
          </div>
          <div className="category-row category-count">
            <span>Antal lån</span>
            <span>{loans.length}</span>
          </div>
        </>
      )}
    </div>
  );
};

const LoanList: React.FC<{ loans: Loan[]; onSelect: (loan: Loan) => void }> = ({
  loans,
  onSelect,
}) => (
  <div className="loan-list">
    <div className="loan-list-header">
      <span>Bank</span>
      <span>Typ</span>
      <span>Belopp kvar</span>
      <span>Ränta</span>
      <span>Månad</span>
    </div>
    {loans.map((loan) => (
      <button
        key={loan.id}
        className="loan-row"
        onClick={() => onSelect(loan)}
      >
        <span>{loan.lender}</span>
        <span>{loan.category}</span>
        <span>{formatCurrency(loan.principalRemaining)}</span>
        <span>{formatPercent(loan.interestRate)}</span>
        <span>{formatCurrency(loan.monthlyPayment)}</span>
      </button>
    ))}
  </div>
);

const OffersPanel: React.FC<{
  loans: Loan[];
  totals: { totalPrincipal: number; totalMonthly: number; avgRate: number };
}> = ({ loans, totals }) => {
  const expensiveLoans = loans.filter((l) => l.interestRate > 8);
  const expensiveMonthly = expensiveLoans.reduce(
    (sum, l) => sum + l.monthlyPayment,
    0
  );

  return (
    <div className="offers-panel">
      <div className="offers-badge">Analys baserad på dina nuvarande lån</div>
      {expensiveLoans.length === 0 ? (
        <p>
          Just nu ser din lånebild relativt sund ut. Vi kommer att visa
          förbättringsförslag här om dina villkor förändras.
        </p>
      ) : (
        <>
          <h3>Samlingslån – uppskattad besparing</h3>
          <p>
            Du har {expensiveLoans.length} lån med ränta över{" "}
            <strong>8%</strong>. Genom att samla dessa till ett nytt lån med
            lägre ränta kan du i många fall sänka din månadskostnad.
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            Dagens månadskostnad för dessa lån:{" "}
            <strong>{formatCurrency(expensiveMonthly)}</strong>
          </p>
          <p>
            Om räntan sänks med t.ex. 3 procentenheter kan din uppskattade
            besparing bli{" "}
            <strong>{formatCurrency(Math.round(expensiveMonthly * 0.15))}</strong>{" "}
            per månad.
          </p>

          <button
            className="primary-btn"
            onClick={() =>
              alert(
                "I en riktig version skulle du nu kunna skicka en intresseförfrågan till anslutna banker."
              )
            }
          >
            Skicka intresseförfrågan
          </button>
        </>
      )}

      <div className="offers-footnote">
        Detta är en förenklad demo-beräkning. I skarp version används
        detaljerad kreditdata och individuella bankerbjudanden.
      </div>
    </div>
  );
};

const LoanDetailsPanel: React.FC<{ loan: Loan | null }> = ({ loan }) => {
  if (!loan) {
    return (
      <div className="details-panel">
        <h2>Lånedetaljer</h2>
        <p>Välj ett lån i listan till vänster för att se detaljer.</p>
      </div>
    );
  }

  const totalCost = loan.monthlyPayment * loan.monthsRemaining;
  const approxInterestCost = totalCost - loan.principalRemaining;
  const monthlyInterestShare = (approxInterestCost / loan.monthsRemaining) || 0;
  const monthlyAmortization = loan.monthlyPayment - monthlyInterestShare;

  return (
    <div className="details-panel">
      <h2>Lånedetaljer</h2>
      <div className="details-header">
        <div className="details-bank">{loan.lender}</div>
        <div className="details-product">{loan.productName}</div>
        <div className="details-account">{loan.accountNumberMasked}</div>
      </div>

      <div className="details-grid">
        <div className="details-item">
          <span className="details-label">Kategori</span>
          <span className="details-value">{loan.category}</span>
        </div>
        <div className="details-item">
          <span className="details-label">Kvarvarande skuld</span>
          <span className="details-value">
            {formatCurrency(loan.principalRemaining)}
          </span>
        </div>
        <div className="details-item">
          <span className="details-label">Ränta</span>
          <span className="details-value">
            {formatPercent(loan.interestRate)}
          </span>
        </div>
        <div className="details-item">
          <span className="details-label">Månadskostnad</span>
          <span className="details-value">
            {formatCurrency(loan.monthlyPayment)}
          </span>
        </div>
        <div className="details-item">
          <span className="details-label">Månader kvar</span>
          <span className="details-value">{loan.monthsRemaining}</span>
        </div>
        <div className="details-item">
          <span className="details-label">Total kvarvarande kostnad</span>
          <span className="details-value">
            {formatCurrency(Math.round(totalCost))}
          </span>
        </div>
      </div>

      <h3 style={{ marginTop: "1.5rem" }}>Månadens fördelning (ungefär)</h3>
      <div className="details-split">
        <div className="split-row">
          <span>Amortering</span>
          <span>{formatCurrency(Math.round(monthlyAmortization))}</span>
        </div>
        <div className="split-row">
          <span>Räntekostnad</span>
          <span>{formatCurrency(Math.round(monthlyInterestShare))}</span>
        </div>
      </div>

      <div className="details-advice">
        <h4>Rådgivande notis</h4>
        <p>
          Om du kan sänka räntan på detta lån med{" "}
          <strong>1 procentenhet</strong> minskar din totala kostnad med cirka{" "}
          <strong>
            {formatCurrency(
              Math.round(
                (loan.principalRemaining * 0.01 * loan.monthsRemaining) / 12
              )
            )}
          </strong>{" "}
          över återstående löptid.
        </p>
        <p>
          I en skarp version hjälper LåneKompassen dig att hitta banker som kan
          ge bättre villkor baserat på just din låneprofil.
        </p>
      </div>
    </div>
  );
};
const LoanDetailsPanel: React.FC<{ loan: Loan | null }> = ({ loan }) => {
  if (!loan) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Lånedetaljer</h3>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Välj ett lån i listan till vänster för att se mer detaljerad
          information.
        </p>
      </div>
    );
  }

  // Enkel, ungefärlig uppskattning av ränte/ amorteringsfördelning
  const yearlyInterestApprox = loan.amount * (loan.rate / 100);
  const monthlyInterestApprox = yearlyInterestApprox / 12;
  const monthlyAmortizationApprox = Math.max(
    0,
    loan.monthly - monthlyInterestApprox
  );
  const yearlyTotalPayment = loan.monthly * 12;

  let riskLabel = "Låg till medelhög räntenivå";
  let riskColor = "#16a34a";

  if (loan.rate >= 8 && loan.rate < 15) {
    riskLabel = "Hög räntenivå – kan ofta sänkas";
    riskColor = "#f59e0b";
  } else if (loan.rate >= 15) {
    riskLabel = "Mycket hög räntenivå – bör ses över";
    riskColor = "#dc2626";
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        background: "white",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Lånedetaljer</h3>
      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
        Markerat lån från tabellen.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: "#f9fafb",
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7280" }}>Bank & typ</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          {loan.bank} – {loan.type}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          Belopp, ränta och månadskostnad nedan är en förenklad översikt.
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          fontSize: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Belopp kvar</div>
          <div style={{ fontWeight: 600 }}>
            {loan.amount.toLocaleString("sv-SE")} kr
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Ränta</div>
          <div style={{ fontWeight: 600 }}>{loan.rate}%</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Månadskostnad</div>
          <div style={{ fontWeight: 600 }}>
            {loan.monthly.toLocaleString("sv-SE")} kr
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Total kostnad / år
          </div>
          <div style={{ fontWeight: 600 }}>
            {yearlyTotalPayment.toLocaleString("sv-SE")} kr
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: "#f9fafb",
        }}
      >
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
          Ungefärlig fördelning per månad
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ color: "#6b7280" }}>Amortering</div>
            <div style={{ fontWeight: 600 }}>
              {Math.round(monthlyAmortizationApprox).toLocaleString("sv-SE")} kr
            </div>
          </div>
          <div>
            <div style={{ color: "#6b7280" }}>Ränta</div>
            <div style={{ fontWeight: 600 }}>
              {Math.round(monthlyInterestApprox).toLocaleString("sv-SE")} kr
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: "#fff7ed",
          border: "1px solid #fed7aa",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: riskColor,
            marginBottom: 4,
          }}
        >
          Indikativ bedömning av räntenivå
        </div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>{riskLabel}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
          Detta är ingen formell kreditbedömning utan en förenklad indikation
          baserad på din ränta. I en skarp version kan Lånekompassen hjälpa dig
          att hitta banker med bättre villkor.
        </div>
      </div>
    </div>
  );
};

export default App;
