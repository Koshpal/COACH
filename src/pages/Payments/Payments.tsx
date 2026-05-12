import React from 'react';
import { FileText, AlertTriangle, ShieldAlert } from 'lucide-react';

export const Payments: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">Payments</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Coach payments are not connected to a backend API yet.</p>
        </div>
        <button disabled className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] font-bold rounded-xl cursor-not-allowed">
          <FileText className="w-5 h-5" />
          Create Invoice
        </button>
      </header>

      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] shadow-sm p-8 md:p-10">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            Not connected
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-heading">No payments backend exists for the coach portal</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            The previous version of this screen showed hardcoded earnings and invoices. Those values have been removed so the UI no longer pretends to be functional. If payments are needed, a backend API and database model must be added first.
          </p>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
            <ShieldAlert className="w-5 h-5 text-[var(--color-primary)] mt-0.5" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Current coach backend only exposes consultation, availability, profile, and auth routes. There is no payments service to consume here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
