/** Client-side form descriptions for each calculator. Server validation is authoritative. */
export type FieldType = 'number' | 'select';
export interface ToolField { key: string; label: string; type: FieldType; hint?: string; options?: { value: string; label: string }[]; optional?: boolean; def?: string }
export interface ToolRows { key: string; label: string; cols: ToolField[]; min?: number }
export interface ToolForm { title: string; blurb: string; fields: ToolField[]; rows?: ToolRows[] }

const n = (key: string, label: string, hint?: string, optional = false, def?: string): ToolField => ({ key, label, type: 'number', hint, optional, def });
const name = (key: string, label: string): ToolField => ({ key, label, type: 'select' }); // placeholder, rendered as text

export const TOOL_FORMS: Record<string, ToolForm> = {
  EMERGENCY_FUND: { title: 'Emergency fund', blurb: 'How much cushion is needed, and how long to build it.', fields: [n('monthlyEssentialExpenses', 'Monthly essential expenses (₹)'), n('targetMonths', 'Target months of cover', '3–6 is common', false, '6'), n('currentSavings', 'Current savings (₹)', undefined, false, '0'), n('monthlySaving', 'Monthly amount they can set aside (₹)', undefined, true)] },
  DEBT_PAYOFF: { title: 'Debt payoff plan', blurb: 'Avalanche (highest rate first) or snowball (smallest balance first).', fields: [{ key: 'strategy', label: 'Strategy', type: 'select', options: [{ value: 'AVALANCHE', label: 'Avalanche — least interest' }, { value: 'SNOWBALL', label: 'Snowball — quick wins' }], def: 'AVALANCHE' }, n('extraMonthly', 'Extra amount per month (₹)', undefined, true, '0')],
    rows: [{ key: 'debts', label: 'Debts', min: 1, cols: [name('name', 'Name'), n('balance', 'Balance (₹)'), n('aprPct', 'Interest % / year'), n('minPayment', 'Minimum / month (₹)')] }] },
  EMI: { title: 'Loan EMI', blurb: 'Monthly instalment, total interest and total cost.', fields: [n('principal', 'Loan amount (₹)'), n('annualRatePct', 'Interest % / year'), n('months', 'Tenure (months)')] },
  SIP: { title: 'SIP growth', blurb: 'What a regular monthly investment may grow to (illustrative, not a promise).', fields: [n('monthlyAmount', 'Monthly investment (₹)'), n('annualReturnPct', 'Assumed return % / year', 'An assumption — never a guarantee'), n('years', 'Years')] },
  GOAL_SAVING: { title: 'Goal saving', blurb: 'The monthly amount needed to reach a target.', fields: [n('targetAmount', 'Target amount (₹)'), n('years', 'Years to goal'), n('annualReturnPct', 'Assumed return % / year', undefined, false, '0'), n('currentSavings', 'Already saved (₹)', undefined, true, '0')] },
  NET_WORTH: { title: 'Net worth', blurb: 'Assets minus liabilities.', fields: [], rows: [{ key: 'assets', label: 'Assets', min: 0, cols: [name('name', 'Asset'), n('value', 'Value (₹)')] }, { key: 'liabilities', label: 'Liabilities', min: 0, cols: [name('name', 'Liability'), n('value', 'Amount (₹)')] }] },
  BUDGET_SPLIT: { title: 'Budget split', blurb: 'Needs / wants / savings (default 50 / 30 / 20).', fields: [n('monthlyIncome', 'Monthly income (₹)'), n('needsPct', 'Needs %', undefined, true, '50'), n('wantsPct', 'Wants %', undefined, true, '30'), n('savingsPct', 'Savings %', undefined, true, '20')] },
  INSURANCE_COVER: { title: 'Life cover estimate', blurb: 'Uses the income multiples an administrator has configured.', fields: [n('age', 'Age'), n('annualIncome', 'Annual income (₹)'), n('liabilities', 'Total liabilities (₹)', undefined, false, '0'), n('existingCover', 'Existing life cover (₹)', undefined, false, '0'), n('liquidAssets', 'Liquid assets (₹)', undefined, false, '0')] },
  TAX_COMPARE: { title: 'Tax regime comparison', blurb: 'Compares regimes using the slabs an administrator has configured for the tax year.', fields: [n('grossAnnualIncome', 'Gross annual income (₹)'), n('deductions', 'Eligible deductions (₹)', undefined, true, '0')] },
};
