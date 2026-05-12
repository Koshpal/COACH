import React from 'react';

interface ClientFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  status: 'all' | 'active' | 'inactive';
  setStatus: (val: 'all' | 'active' | 'inactive') => void;
  sort: 'recent' | 'nextSession';
  setSort: (val: 'recent' | 'nextSession') => void;
}

export const ClientFilters: React.FC<ClientFiltersProps> = ({ search, setSearch, status, setStatus, sort, setSort }) => {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center mb-4 w-full">
      <input
        type="text"
        placeholder="Search clients by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <select
        value={status}
        onChange={e => setStatus(e.target.value as 'all' | 'active' | 'inactive')}
        className="px-3 py-2 rounded-lg border border-gray-200 bg-white"
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select
        value={sort}
        onChange={e => setSort(e.target.value as 'recent' | 'nextSession')}
        className="px-8 py-2 rounded-lg border border-gray-200 bg-white"
      >
        <option value="recent">Sort: Recent Activity</option>
        <option value="nextSession">Sort: Next Session</option>
      </select>
    </div>
  );
};
