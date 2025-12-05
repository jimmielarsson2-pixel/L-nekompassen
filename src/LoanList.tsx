 import React from "react";
import { Loan } from "./mockData";

interface LoanListProps {
  loans: Loan[];
  onSelect?: (loan: Loan) => void;
}

export default function LoanList({ loans, onSelect }: LoanListProps) {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f9fafb",
              textAlign: "left",
              color: "#6b7280",
            }}
          >
            <th style={{ padding: "8px 10px" }}>Bank</th>
            <th style={{ padding: "8px 10px" }}>Typ</th>
            <th style={{ padding: "8px 10px" }}>Belopp kvar</th>
            <th style={{ padding: "8px 10px" }}>Ränta</th>
            <th style={{ padding: "8px 10px" }}>Månad</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan, index) => (
            <tr
              key={loan.id ?? index}
              onClick={() => onSelect?.(loan)}
              style={{
                borderBottom: "1px solid #e5e5e5",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f5f5f5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <td style={{ padding: "8px 10px" }}>{loan.lender}</td>
              <td style={{ padding: "8px 10px" }}>{loan.category}</td>
              <td style={{ padding: "8px 10px" }}>
                {loan.principalRemaining.toLocaleString("sv-SE")} kr
              </td>
              <td style={{ padding: "8px 10px" }}>
                {loan.interestRate.toFixed(2).replace(".", ",")}%
              </td>
              <td style={{ padding: "8px 10px" }}>
                {loan.monthlyPayment.toLocaleString("sv-SE")} kr
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
