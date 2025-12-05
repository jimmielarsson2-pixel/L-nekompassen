 import React, { useMemo, useState } from "react";
import { mockLoans, Loan } from "./mockData";
import LoanList from "./LoanList";

type Tab = "overview" | "loans" | "offers";

// Formatters -----------------------------------------------------

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  `${value.toFixed(2).replace(".", ",")}%`;

// ----------------------------------------------------------------

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("loans");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(
    mockLoans[0] ?? null
  );

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
  };

  // Summeringar / totals för översikt -----------------------------

  const totals = useMemo(() => {
    const totalAmount = mockLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalMonthly = mockLoans.reduce(
      (sum, loan) => sum + loan.monthly,
      0
    );
    const totalInterestWeighted = mockLoans.reduce(
      (sum, loan) => sum + loan.rate * loan.amount,
      0
    );

    const avgRate =
      totalAmount > 0 ? totalInterestWeighted / totalAmount : 0;

    return {
      totalAmount,
      totalMonthly,
      avgRate,
    };
  }, []);

  // ----------------------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "24px 16px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Header --------------------------------------------------- */}
        <header
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: -0.5,
              }}
            >
              Lånekompassen
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              Samlad bild av dina lån, räntor och månadskostnader.
            </p>
          </div>
        </header>

        {/* Flik-navigering ----------------------------------------- */}
        <nav
          style={{
            display: "inline-flex",
            background: "#e5e7eb",
            borderRadius: 999,
            padding: 3,
            marginBottom: 16,
          }}
        >
          {(["overview", "loans", "offers"] as Tab[]).map((tab) => {
            const isActive = tab === activeTab;

            const label =
              tab === "overview"
                ? "Översikt"
                : tab === "loans"
                ? "Lån"
                : "Erbjudanden";

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  background: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#111827" : "#4b5563",
                  boxShadow: isActive
                    ? "0 1px 3px rgba(15,23,42,0.15)"
                    : "none",
                  transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* INNEHÅLL ------------------------------------------------- */}

        {/* Översikt */
        activeTab === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 16,
            }}
          >
            <SummaryCard
              title="Total skuld"
              value={formatCurrency(totals.totalAmount)}
              subtitle="Summering av alla lån"
            />
            <SummaryCard
              title="Total månadskostnad"
              value={formatCurrency(totals.totalMonthly)}
              subtitle="Summa amortering + ränta / månad"
            />
            <SummaryCard
              title="Genomsnittlig ränta"
              value={formatPercent(totals.avgRate)}
              subtitle="Viktad ränta över alla lån"
            />
          </div>
        )}

        {/* Låneöversikt */
        activeTab === "loans" && (
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
              marginTop: 4,
            }}
          >
            {/* Vänster: tabell */}
            <div style={{ flex: 3 }}>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Låneöversikt
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
                  padding: "12px 12px 16px",
                }}
              >
                <LoanList loans={mockLoans} onSelect={handleSelectLoan} />
              </div>
            </div>

            {/* Höger: detaljer */}
            <div style={{ flex: 2 }}>
              <LoanDetailsPanel loan={selectedLoan} />
            </div>
          </div>
        )}

        {/* Erbjudanden / placeholder */
        activeTab === "offers" && (
          <div
            style={{
              marginTop: 8,
              padding: 16,
              borderRadius: 12,
              background: "#ffffff",
              boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
              fontSize: 14,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Erbjudanden</h2>
            <p style={{ color: "#6b7280", marginTop: 0 }}>
              Här kan du i nästa steg visa personliga refinansierings-
              erbjudanden baserat på användarens lån.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// Små komponenter
// ----------------------------------------------------------------

const SummaryCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
}> = ({ title, value, subtitle }) => (
  <div
    style={{
      background: "#ffffff",
      borderRadius: 12,
      padding: 14,
      boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
    }}
  >
    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
      {title}
    </div>
    <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    {subtitle && (
      <div
        style={{
          marginTop: 4,
          fontSize: 12,
          color: "#9ca3af",
        }}
      >
        {subtitle}
      </div>
    )}
  </div>
);

// ----------------------------------------------------------------
// Panel med detaljer om valt lån
// ----------------------------------------------------------------

const LoanDetailsPanel: React.FC<{ loan: Loan | null }> = ({ loan }) => {
  if (!loan) {
    return (
      <div
        style={{
          marginTop: 28,
          padding: 16,
          borderRadius: 12,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          fontSize: 14,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Lånedetaljer</h3>
        <p style={{ margin: 0, color: "#6b7280" }}>
          Klicka på ett lån i tabellen till vänster för att se detaljer.
        </p>
      </div>
    );
  }

  // Enkel uppskattning
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
        marginTop: 28,
        padding: 16,
        borderRadius: 12,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
        fontSize: 14,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Lånedetaljer</h3>
      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
        Markerat lån från låneöversikten.
      </p>

      <div
        style={{
          marginTop: 12,
          padding: 10,
          borderRadius: 8,
          background: "#f9fafb",
        }}
      >
        <div style={{ fontSize: 12, color: "#6b7280" }}>Bank & typ</div>
        <div style={{ fontWeight: 600 }}>
          {loan.bank} – {loan.type}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Belopp kvar</div>
          <div style={{ fontWeight: 600 }}>
            {formatCurrency(loan.amount)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Ränta</div>
          <div style={{ fontWeight: 600 }}>{formatPercent(loan.rate)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Månadskostnad</div>
          <div style={{ fontWeight: 600 }}>
            {formatCurrency(loan.monthly)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Total kostnad / år
          </div>
          <div style={{ fontWeight: 600 }}>
            {formatCurrency(yearlyTotalPayment)}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 10,
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
              {formatCurrency(Math.round(monthlyAmortizationApprox))}
            </div>
          </div>
          <div>
            <div style={{ color: "#6b7280" }}>Ränta</div>
            <div style={{ fontWeight: 600 }}>
              {formatCurrency(Math.round(monthlyInterestApprox))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 10,
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
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
            marginTop: 6,
          }}
        >
          Detta är ingen formell kreditbedömning utan en förenklad indikation
          baserad på din ränta. I en skarp version kan Lånekompassen hjälpa dig
          att hitta banker med bättre villkor.
        </div>
      </div>
    </div>
  );
};

export default App;
