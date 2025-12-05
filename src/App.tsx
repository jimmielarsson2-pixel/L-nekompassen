 import React, { useMemo, useState } from "react";
import { mockLoans, Loan, LoanCategory } from "./mockData";
import LoanList from "./LoanList";

type Tab = "dashboard" | "loans" | "analysis" | "actions";
type SortKey =
  | "principalRemaining"
  | "interestRate"
  | "monthlyPayment"
  | "monthsRemaining";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  `${value.toFixed(2).replace(".", ",")}%`;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(
    mockLoans[0] ?? null
  );
  const [categoryFilter, setCategoryFilter] = useState<LoanCategory | "alla">(
    "alla"
  );
  const [highInterestOnly, setHighInterestOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("interestRate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Anta en inkomst för att kunna visa skuldkvot / belåningsgrad
  const userMonthlyIncome = 42000;

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
  };

  // ------------------- Aggregerad data ------------------------

  const {
    totalPrincipal,
    totalMonthly,
    avgRate,
    highInterestCount,
    categoryStats,
    soonestEnd,
  } = useMemo(() => {
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

    const highInterestCount = mockLoans.filter(
      (loan) => loan.interestRate >= 10
    ).length;

    const categoryStats = mockLoans.reduce(
      (acc, loan) => {
        const key = loan.category;
        acc[key] = acc[key] || {
          principal: 0,
          monthly: 0,
          count: 0,
        };
        acc[key].principal += loan.principalRemaining;
        acc[key].monthly += loan.monthlyPayment;
        acc[key].count += 1;
        return acc;
      },
      {} as Record<LoanCategory, { principal: number; monthly: number; count: number }>
    );

    const sortedByMonths = [...mockLoans].sort(
      (a, b) => a.monthsRemaining - b.monthsRemaining
    );
    const soonestEnd = sortedByMonths[0] ?? null;

    return {
      totalPrincipal,
      totalMonthly,
      avgRate,
      highInterestCount,
      categoryStats,
      soonestEnd,
    };
  }, []);

  // Hälsopoäng 0–100 baserat på ränta och hur mycket som är hög-ränte-lån
  const healthScore = useMemo(() => {
    const interestScore = Math.max(0, 100 - avgRate * 7); // högre ränta → sämre
    const highShare =
      mockLoans.length > 0 ? highInterestCount / mockLoans.length : 0;
    const highScore = Math.max(0, 100 - highShare * 80);
    return Math.round((interestScore * 0.6 + highScore * 0.4) / 1);
  }, [avgRate, highInterestCount]);

  // ------------------- Filter + sortering ------------------------

  const filteredAndSortedLoans = useMemo(() => {
    let loans = [...mockLoans];

    if (categoryFilter !== "alla") {
      loans = loans.filter((loan) => loan.category === categoryFilter);
    }

    if (highInterestOnly) {
      loans = loans.filter((loan) => loan.interestRate >= 10);
    }

    loans.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;

      switch (sortKey) {
        case "principalRemaining":
          return (a.principalRemaining - b.principalRemaining) * dir;
        case "interestRate":
          return (a.interestRate - b.interestRate) * dir;
        case "monthlyPayment":
          return (a.monthlyPayment - b.monthlyPayment) * dir;
        case "monthsRemaining":
          return (a.monthsRemaining - b.monthsRemaining) * dir;
        default:
          return 0;
      }
    });

    return loans;
  }, [categoryFilter, highInterestOnly, sortKey, sortDirection]);

  // ------------------- Scenarier för analys ------------------------

  // Scenario 1: Sänk alla lån med ränta >= 10% med 2 procentenheter
  const scenarioHighInterestSavings = useMemo(() => {
    const impacted = mockLoans.filter((loan) => loan.interestRate >= 10);
    if (impacted.length === 0) return null;

    let currentMonthlyInterest = 0;
    let newMonthlyInterest = 0;

    impacted.forEach((loan) => {
      const currentYearly = loan.principalRemaining * (loan.interestRate / 100);
      const newYearly =
        loan.principalRemaining * Math.max(loan.interestRate - 2, 0) * 0.01;

      currentMonthlyInterest += currentYearly / 12;
      newMonthlyInterest += newYearly / 12;
    });

    const monthlySaving = currentMonthlyInterest - newMonthlyInterest;
    const yearlySaving = monthlySaving * 12;

    return {
      loanCount: impacted.length,
      monthlySaving,
      yearlySaving,
    };
  }, []);

  // Scenario 2: Samla alla Privatlån + Kreditkort till 8% ränta
  const scenarioConsolidation = useMemo(() => {
    const targetCategories: LoanCategory[] = ["Privatlån", "Kreditkort"];
    const impacted = mockLoans.filter((loan) =>
      targetCategories.includes(loan.category)
    );
    if (impacted.length === 0) return null;

    let currentMonthlyInterest = 0;
    let newMonthlyInterest = 0;
    const targetRate = 8;

    impacted.forEach((loan) => {
      const currentYearly = loan.principalRemaining * (loan.interestRate / 100);
      const newYearly =
        loan.principalRemaining * Math.max(targetRate, 0) * 0.01;

      currentMonthlyInterest += currentYearly / 12;
      newMonthlyInterest += newYearly / 12;
    });

    return {
      principal: impacted.reduce(
        (sum, loan) => sum + loan.principalRemaining,
        0
      ),
      monthlySaving: currentMonthlyInterest - newMonthlyInterest,
      targetRate,
    };
  }, []);

  // ----------------------------------------------------

  const debtToIncome = totalMonthly / userMonthlyIncome; // andel av inkomsten

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
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
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
              Proffsig överblick av dina lån, risker och förbättringsmöjligheter.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
            }}
          >
            <div
              style={{
                textAlign: "right",
              }}
            >
              <div style={{ color: "#6b7280", fontSize: 12 }}>Lånehälsa</div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {healthScore}/100
              </div>
            </div>
            <HealthBar score={healthScore} />
          </div>
        </header>

        {/* NAVIGATION / FLIKAR */}
        <nav
          style={{
            display: "inline-flex",
            background: "#e5e7eb",
            borderRadius: 999,
            padding: 3,
            marginBottom: 16,
          }}
        >
          {(["dashboard", "loans", "analysis", "actions"] as Tab[]).map(
            (tab) => {
              const isActive = tab === activeTab;

              const label =
                tab === "dashboard"
                  ? "Dashboard"
                  : tab === "loans"
                  ? "Lån"
                  : tab === "analysis"
                  ? "Analys"
                  : "Åtgärder";

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
                    transition:
                      "background 0.15s, color 0.15s, box-shadow 0.15s",
                  }}
                >
                  {label}
                </button>
              );
            }
          )}
        </nav>

        {/* ---------------- INNEHÅLL PER FLIK ---------------- */}

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <SummaryCard
                  title="Total skuld"
                  value={formatCurrency(totalPrincipal)}
                  subtitle="Summering av alla lån"
                />
                <SummaryCard
                  title="Månadskostnad lån"
                  value={formatCurrency(totalMonthly)}
                  subtitle="Inklusive ränta & amortering"
                />
                <SummaryCard
                  title="Genomsnittlig ränta"
                  value={formatPercent(avgRate)}
                  subtitle="Viktad ränta över alla lån"
                />
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
                  fontSize: 13,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: 15,
                  }}
                >
                  Skuldfördelning per kategori
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 10,
                    color: "#6b7280",
                    fontSize: 12,
                  }}
                >
                  Se vilka typer av lån som dominerar din totala skuld.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(Object.keys(categoryStats) as LoanCategory[]).map(
                    (cat) => {
                      const stats = categoryStats[cat];
                      if (!stats) return null;
                      const share =
                        totalPrincipal > 0
                          ? stats.principal / totalPrincipal
                          : 0;
                      return (
                        <CategoryRow
                          key={cat}
                          category={cat}
                          principal={stats.principal}
                          monthly={stats.monthly}
                          share={share}
                        />
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
                  fontSize: 13,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: 15,
                  }}
                >
                  Hur tung är din lånebild?
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "#6b7280",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  Skuldkvot mot inkomst baserat på rapporterade månadskostnader.
                </p>
                <div style={{ marginBottom: 6, fontSize: 13 }}>
                  Lånekvot:{" "}
                  <strong>{Math.round(debtToIncome * 100).toString()}%</strong>{" "}
                  av disponibel inkomst går till lån varje månad.
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  Under 30% anses ofta sunt, 30–50% kräver uppsikt, över 50%
                  innebär ökad sårbarhet vid räntehöjningar.
                </p>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
                  fontSize: 13,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: 15,
                  }}
                >
                  När ligger nästa stora milstolpe?
                </h3>
                {soonestEnd ? (
                  <>
                    <p
                      style={{
                        margin: 0,
                        marginBottom: 6,
                        color: "#6b7280",
                        fontSize: 12,
                      }}
                    >
                      Lån med kortast återstående tid.
                    </p>
                    <div style={{ fontSize: 13 }}>
                      <strong>{soonestEnd.lender}</strong> –{" "}
                      {soonestEnd.productName}
                      <br />
                      <span style={{ color: "#6b7280", fontSize: 12 }}>
                        {soonestEnd.monthsRemaining} månader kvar, belopp{" "}
                        {formatCurrency(soonestEnd.principalRemaining)}.
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>
                    Inga registrerade lån med återstående tid.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LÅN */}
        {activeTab === "loans" && (
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
              marginTop: 4,
            }}
          >
            {/* Vänster: filter + tabell */}
            <div style={{ flex: 3 }}>
              <div
                style={{
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Låneöversikt
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    fontSize: 12,
                    alignItems: "center",
                  }}
                >
                  <select
                    value={categoryFilter}
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target.value as LoanCategory | "alla"
                      )
                    }
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                    }}
                  >
                    <option value="alla">Alla typer</option>
                    <option value="Bolån">Bolån</option>
                    <option value="Privatlån">Privatlån</option>
                    <option value="Billån">Billån</option>
                    <option value="Kreditkort">Kreditkort</option>
                  </select>

                  <select
                    value={sortKey}
                    onChange={(e) =>
                      setSortKey(e.target.value as SortKey)
                    }
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                    }}
                  >
                    <option value="interestRate">Sortera på ränta</option>
                    <option value="principalRemaining">
                      Sortera på belopp kvar
                    </option>
                    <option value="monthlyPayment">
                      Sortera på månadskostnad
                    </option>
                    <option value="monthsRemaining">
                      Sortera på tid kvar
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                    }
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    {sortDirection === "asc" ? "Stigande" : "Fallande"}
                  </button>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#6b7280",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={highInterestOnly}
                      onChange={(e) => setHighInterestOnly(e.target.checked)}
                    />
                    Visa endast högränte-lån (&gt;= 10%)
                  </label>
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
                  padding: "8px 12px 12px",
                }}
              >
                <LoanList
                  loans={filteredAndSortedLoans}
                  onSelect={handleSelectLoan}
                />
              </div>
            </div>

            {/* Höger: detaljer */}
            <div style={{ flex: 2 }}>
              <LoanDetailsPanel loan={selectedLoan} />
            </div>
          </div>
        )}

        {/* ANALYS */}
        {activeTab === "analysis" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.7fr 1.3fr",
              gap: 18,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
                fontSize: 13,
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 6,
                  fontSize: 16,
                }}
              >
                Sparpotential
              </h2>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 12,
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                Simulera vad som händer om du förbättrar din ränta eller samlar
                olika typer av lån.
              </p>

              {scenarioHighInterestSavings ? (
                <ScenarioCard
                  title="Förhandla ner högränte-lån"
                  description={`Om du sänker räntan med 2 procentenheter på dina ${scenarioHighInterestSavings.loanCount} högränte-lån:`}
                  monthlySaving={scenarioHighInterestSavings.monthlySaving}
                  yearlySaving={scenarioHighInterestSavings.yearlySaving}
                />
              ) : (
                <p style={{ fontSize: 12, color: "#6b7280" }}>
                  Inga lån med ränta ≥ 10% – bra jobbat!
                </p>
              )}

              {scenarioConsolidation && (
                <ScenarioCard
                  title="Samla konsumtionslån"
                  description={`Privatlån + kreditkort på totalt ${formatCurrency(
                    scenarioConsolidation.principal
                  )} samlas till ca ${scenarioConsolidation.targetRate}% ränta:`}
                  monthlySaving={scenarioConsolidation.monthlySaving}
                />
              )}
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
                fontSize: 13,
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 6,
                  fontSize: 16,
                }}
              >
                Risk- & fokusområden
              </h2>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 13,
                  color: "#4b5563",
                }}
              >
                <li>
                  <strong>{highInterestCount}</strong> av dina lån har räntor
                  på 10% eller högre.
                </li>
                <li>
                  Genomsnittlig ränta är{" "}
                  <strong>{formatPercent(avgRate)}</strong>. Att pressa ned den
                  med bara 1 procentenhet kan ge tusentals kronor i årlig
                  besparing.
                </li>
                <li>
                  Lån som löper ut inom 3–5 år kan vara bra utgångspunkt för
                  omförhandling.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ÅTGÄRDER */}
        {activeTab === "actions" && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
              fontSize: 13,
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 6,
                fontSize: 16,
              }}
            >
              Åtgärdslista – nästa steg
            </h2>
            <p
              style={{
                marginTop: 0,
                marginBottom: 12,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              En enkel checklista på vad du kan göra härnäst. I en skarp version
              kan dessa uppgifter kopplas till riktiga banker, ansökningar och
              notifieringar.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <ActionItem
                title="Samla underlag"
                description="Exportera din låneöversikt och skicka till 2–3 banker för offert."
              />
              <ActionItem
                title="Ring nuvarande bank"
                description="Boka ett möte och be om en konkret räntegenomgång utifrån din totala skuldbild."
              />
              <ActionItem
                title="Planera amorteringsstrategi"
                description="Bestäm vilka lån som ska prioriteras först (oftast kreditkort & privatlån med hög ränta)."
              />
              <ActionItem
                title="Sätt upp bevakning"
                description="I en framtida version kan Lånekompassen påminna dig när ränteläget ändras eller bindningstider löper ut."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------- UI-komponenter ------------------------

const HealthBar: React.FC<{ score: number }> = ({ score }) => {
  const clamped = Math.max(0, Math.min(100, score));
  let color = "#22c55e";
  if (clamped < 40) color = "#ef4444";
  else if (clamped < 70) color = "#eab308";

  return (
    <div
      style={{
        width: 120,
        height: 10,
        borderRadius: 999,
        background: "#e5e7eb",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: color,
          transition: "width 0.25s ease",
        }}
      />
    </div>
  );
};

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

const CategoryRow: React.FC<{
  category: LoanCategory;
  principal: number;
  monthly: number;
  share: number;
}> = ({ category, principal, monthly, share }) => {
  const label =
    category === "Bolån"
      ? "Bolån"
      : category === "Privatlån"
      ? "Privatlån"
      : category === "Billån"
      ? "Billån"
      : "Kreditkort";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>
          {formatCurrency(principal)} • {formatCurrency(monthly)}/mån
        </div>
      </div>
      <div
        style={{
          flex: 1.5,
          height: 8,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.round(share * 100)}%`,
            height: "100%",
            background: "#3b82f6",
          }}
        />
      </div>
      <div
        style={{
          width: 40,
          textAlign: "right",
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        {Math.round(share * 100)}%
      </div>
    </div>
  );
};

const ScenarioCard: React.FC<{
  title: string;
  description: string;
  monthlySaving: number;
  yearlySaving?: number;
}> = ({ title, description, monthlySaving, yearlySaving }) => (
  <div
    style={{
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      padding: 12,
      marginBottom: 10,
      background: "#f9fafb",
    }}
  >
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 4,
      }}
    >
      {title}
    </div>
    <p
      style={{
        margin: 0,
        marginBottom: 6,
        fontSize: 12,
        color: "#6b7280",
      }}
    >
      {description}
    </p>
    <div
      style={{
        fontSize: 13,
      }}
    >
      Möjlig besparing:{" "}
      <strong>{formatCurrency(Math.round(monthlySaving))}/mån</strong>
      {yearlySaving !== undefined && (
        <>
          {" "}
          (<strong>{formatCurrency(Math.round(yearlySaving))}/år</strong>)
        </>
      )}
    </div>
  </div>
);

const ActionItem: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => {
  const [done, setDone] = useState(false);

  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: 8,
        borderRadius: 8,
        background: done ? "#ecfdf5" : "#f9fafb",
        border: done ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => setDone(e.target.checked)}
        style={{ marginTop: 2 }}
      />
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          {description}
        </div>
      </div>
    </label>
  );
};

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

  const yearlyInterestApprox =
    loan.principalRemaining * (loan.interestRate / 100);
  const monthlyInterestApprox = yearlyInterestApprox / 12;
  const monthlyAmortizationApprox = Math.max(
    0,
    loan.monthlyPayment - monthlyInterestApprox
  );
  const yearlyTotalPayment = loan.monthlyPayment * 12;

  let riskLabel = "Låg till medelhög räntenivå";
  let riskColor = "#16a34a";
  if (loan.interestRate >= 8 && loan.interestRate < 15) {
    riskLabel = "Hög räntenivå – kan ofta sänkas";
    riskColor = "#f59e0b";
  } else if (loan.interestRate >= 15) {
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
        <div style={{ fontSize: 12, color: "#6b7280" }}>Bank & produkt</div>
        <div style={{ fontWeight: 600 }}>
          {loan.lender} – {loan.productName}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {loan.category} • {loan.accountNumberMasked}
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
            {formatCurrency(loan.principalRemaining)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Ränta</div>
          <div style={{ fontWeight: 600 }}>
            {formatPercent(loan.interestRate)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Månadskostnad</div>
          <div style={{ fontWeight: 600 }}>
            {formatCurrency(loan.monthlyPayment)}
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
          att hitta banker med bättre villkor och automatiskt skicka dina
          uppgifter till banker du väljer.
        </div>
      </div>
    </div>
  );
};

export default App;
