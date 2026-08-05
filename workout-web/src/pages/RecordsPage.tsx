import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getLogsForHeatmap } from '../services/workoutService';
import { computePRs, getPRLabel, sortPRsByRecency, PersonalRecord } from '../services/prService';
import { WorkoutLog } from '../types/workout';
import { CATEGORY_LABELS } from '../constants/exercises';
import ExerciseIcon from '../components/ExerciseIcon';

function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function RecordsPage() {
  const navigate = useNavigate();
  const { firebaseUser } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    // Full-history source (same as StatsPage's `logs`) so no PR is missed —
    // getRecentLogs(uid, N) would cap at N most recent sessions instead.
    getLogsForHeatmap(uid, '2000-01-01')
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  const allPRs = useMemo(() => sortPRsByRecency(computePRs(logs)), [logs]);

  const categories = useMemo(() => {
    const present = new Set(allPRs.map((pr) => pr.category));
    return Array.from(present);
  }, [allPRs]);

  const filteredPRs = useMemo(() => {
    return allPRs.filter((pr) => {
      if (category !== 'all' && pr.category !== category) return false;
      if (search.trim() && !pr.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [allPRs, category, search]);

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-card-2 transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-black text-text-main">Kỷ lục cá nhân 🏆</h1>
          <p className="text-xs text-text-secondary">{allPRs.length} bài tập đã có kỷ lục</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allPRs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-text-secondary text-sm">Chưa có kỷ lục nào — tập vài buổi rồi quay lại xem nhé</p>
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm bài tập..."
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-main focus:border-primary outline-none transition-colors"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
              <button
                onClick={() => setCategory('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${category === 'all' ? 'bg-primary text-white' : 'bg-card-2 text-text-secondary'}`}
              >
                Tất cả
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${category === c ? 'bg-primary text-white' : 'bg-card-2 text-text-secondary'}`}
                >
                  {CATEGORY_LABELS[c] || c}
                </button>
              ))}
            </div>
          )}

          {filteredPRs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-text-secondary text-sm">Không tìm thấy bài tập nào</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {filteredPRs.map((pr: PersonalRecord) => (
                <button
                  key={pr.presetId}
                  onClick={() => navigate(`/stats/exercise/${pr.presetId}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card-2 transition-colors text-left"
                >
                  <ExerciseIcon presetId={pr.presetId} category={pr.category} size={20} className="text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">{pr.name}</p>
                    <p className="text-xs text-text-secondary">{formatDateVi(pr.achievedDate)}</p>
                  </div>
                  <p className="font-black text-text-main text-sm flex-shrink-0">{getPRLabel(pr)}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
