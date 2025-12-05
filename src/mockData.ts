export type LoanCategory = "Bolån" | "Privatlån" | "Billån" | "Kreditkort";

export interface Loan {
  id: string;
  lender: string;
  category: LoanCategory;
  productName: string;
  principalRemaining: number;
  interestRate: number; // procent, t.ex. 4.25
  monthlyPayment: number;
  monthsRemaining: number;
  accountNumberMasked: string;
}

export const mockLoans: Loan[] = [
  {
    id: "1",
    lender: "Handelsbanken",
    category: "Bolån",
    productName: "Bolån villa",
    principalRemaining: 2_150_000,
    interestRate: 3.79,
    monthlyPayment: 9_850,
    monthsRemaining: 300,
    accountNumberMasked: "**** 1234",
  },
  {
    id: "2",
    lender: "SBAB",
    category: "Privatlån",
    productName: "Privatlån renovering",
    principalRemaining: 185_000,
    interestRate: 7.95,
    monthlyPayment: 2_450,
    monthsRemaining: 72,
    accountNumberMasked: "**** 9912",
  },
  {
    id: "3",
    lender: "Volvofinans",
    category: "Billån",
    productName: "Billån XC60",
    principalRemaining: 145_000,
    interestRate: 4.95,
    monthlyPayment: 2_150,
    monthsRemaining: 48,
    accountNumberMasked: "**** 4410",
  },
  {
    id: "4",
    lender: "Collector Bank",
    category: "Kreditkort",
    productName: "Kreditkort Flex",
    principalRemaining: 32_500,
    interestRate: 19.9,
    monthlyPayment: 1_200,
    monthsRemaining: 36,
    accountNumberMasked: "**** 8765",
  },
];
