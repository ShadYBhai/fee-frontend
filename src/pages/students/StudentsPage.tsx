import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Plus, BookOpen } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useBatches } from '@/hooks/useBatches';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function StudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | ''>('ACTIVE');

  const { data: studentsData, isLoading } = useStudents({
    batch_id: batchFilter || undefined,
    status: statusFilter || undefined,
  });
  const { data: batchesData } = useBatches();

  const students = studentsData?.data ?? [];
  const batches = batchesData ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.parent_mobile.includes(q)
    );
  }, [students, search]);

  return (
    <div>
      <PageHeader
        title="Students"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/batches')}
              className="min-h-tap min-w-tap flex items-center justify-center rounded-xl border border-surface-200 hover:bg-surface-100 px-3 gap-1.5 text-sm font-semibold text-surface-700"
              aria-label="Manage batches"
            >
              <BookOpen className="h-4 w-4" />
              Batches
            </button>
            <button
              onClick={() => navigate(batchFilter ? `/students/new?batch_id=${batchFilter}` : '/students/new')}
              className="min-h-tap min-w-tap flex items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 px-3"
              aria-label="Add student"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <div className="px-4 py-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-tap rounded-xl border border-surface-200 bg-white pl-10 pr-4 text-base text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Filters row */}
        <div className="flex gap-2">
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="flex-1 min-h-tap rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="flex-1 min-h-tap rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="">All Status</option>
          </select>
        </div>
      </div>

      <div className="px-4">
        {isLoading ? (
          <div className="py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description={search ? 'Try a different search term.' : 'Add your first student to get started.'}
            action={
              !search ? (
                <Button variant="primary" size="full" onClick={() => navigate('/students/new')}>
                  + Add Student
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2 pb-4">
            <p className="text-sm text-surface-700 mb-2">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/students/${s.id}`)}
                className="w-full bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center justify-between text-left min-h-tap active:bg-surface-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-surface-900 truncate">{s.name}</p>
                  <p className="text-sm text-surface-700">
                    {s.batch?.name ?? 'No batch'} · +91 {s.parent_mobile}
                  </p>
                </div>
                {s.status === 'INACTIVE' && (
                  <span className="ml-3 text-xs font-semibold bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">
                    Inactive
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
