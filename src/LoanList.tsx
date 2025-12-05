import React from "react";

export type Loan = {
  bank: string;
  type: string;
  amount: number;
  rate: number;
  monthly: number;
};

interface LoanListProps {
  loans: Loan[];
  onSelect?: (loan: Loan) => void;
}

export default function LoanList({ loans, onSelect }: LoanListProps) {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <table style={{ width: "90%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ background: "#f4f4f4", textAlign: "left" }}>
            <th>Bank</th>
            <th>Typ</th>
            <th>Belopp kvar</th>
            <th>Ränta</th>
            <th>Månad</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan, index) => (
            <tr
  key={index}
  onClick={() => onSelect?.(loan)}
  style={{
    borderBottom: "1px solid #e5e5e5",
    cursor: "pointer",
    transition: "background 0.2s ease",
  }}
  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              <td>{loan.bank}</td>
              <td>{loan.type}</td>
              <td>{loan.amount.toLocaleString("sv-SE")} kr</td>
              <td>{loan.rate}%</td>
              <td>{loan.monthly.toLocaleString("sv-SE")} kr</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
