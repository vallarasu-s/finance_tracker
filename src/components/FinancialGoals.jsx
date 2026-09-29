import React from 'react';
import { 
  Target, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Receipt,
  History
} from 'lucide-react';
import { formatCurrency } from '../services/storage';

export default function FinancialGoals({
  goals,
  settings,
  onOpenGoalDetail,
  onOpenGoalModal,
  onOpenDepositModal,
  onDeleteGoal,
}) {
  const symbol = settings.currencySymbol || '$';

  // Aggregate goal stats
  const totalTarget = goals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);
  const totalCurrent = goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
  const totalRemaining = Math.max(0, totalTarget - totalCurrent);
  const overallPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;

  // Helper for countdown and required savings rate
  const getGoalProjections = (goal) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
    const remaining = Math.max(0, (Number(goal.targetAmount) || 0) - (Number(goal.currentAmount) || 0));

    if (!targetDate || isNaN(targetDate.getTime())) {
      return { daysLeft: null, dailyNeeded: null, isOverdue: false };
    }

    const diffMs = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0 && remaining > 0;

    const dailyNeeded = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : null;
    const monthlyNeeded = dailyNeeded ? dailyNeeded * 30 : null;

    return { daysLeft, dailyNeeded, monthlyNeeded, isOverdue };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Financial Goals Top Banner */}
      <div className="daily-banner">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Financial Goals & Wealth Targets
          </span>
          <h2 className="daily-banner-title" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={26} color="var(--color-goal)" /> Active Savings Goals
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <span className="badge badge-goal">
              {goals.length} Goals Registered
            </span>
            <span className="badge badge-income amount-val">
              {overallPercent}% Total Progress
            </span>
          </div>
        </div>

        <div className="daily-banner-stats">
          <div className="daily-stat-item">
            <span className="daily-stat-label">Total Saved</span>
            <span className="daily-stat-value amount-val" style={{ color: 'var(--color-goal)' }}>
              {formatCurrency(totalCurrent, symbol)}
            </span>
          </div>

          <div className="daily-stat-item">
            <span className="daily-stat-label">Target Sum</span>
            <span className="daily-stat-value amount-val">
              {formatCurrency(totalTarget, symbol)}
            </span>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => onOpenGoalModal()}
          >
            <Plus size={18} />
            <span>Create New Goal</span>
          </button>
        </div>
      </div>

      {/* Goals Cards Grid */}
      {goals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
          <Target size={52} style={{ color: 'var(--color-goal)', opacity: 0.4, margin: '0 auto 1.25rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No Financial Goals Yet
          </h3>
          <p style={{ maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
            Set targets for an Emergency Fund, Dream Vacation, New Gadget, or Retirement. Track progress with daily projected savings and celebrate milestones!
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => onOpenGoalModal()}
          >
            <Plus size={16} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map(goal => {
            const current = Number(goal.currentAmount) || 0;
            const target = Number(goal.targetAmount) || 1;
            const percent = Math.min(100, Math.round((current / target) * 100));
            const remaining = Math.max(0, target - current);
            const isCompleted = current >= target;
            const { daysLeft, dailyNeeded, monthlyNeeded, isOverdue } = getGoalProjections(goal);
            const historyCount = Array.isArray(goal.history) ? goal.history.length : (current > 0 ? 1 : 0);

            return (
              <div 
                key={goal.id} 
                className="goal-card goal-card-clickable"
                onClick={() => onOpenGoalDetail && onOpenGoalDetail(goal)}
                title="Click to open goal details & full transaction history"
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenGoalDetail && onOpenGoalDetail(goal);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Header */}
                <div className="goal-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div className="goal-badge-icon">
                      <span>{goal.icon || '🎯'}</span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {goal.title}
                      </h4>
                      {goal.notes && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {goal.notes}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                        <span 
                          className="badge badge-goal"
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(6, 182, 212, 0.1)',
                            color: 'var(--color-goal)'
                          }}
                        >
                          <Receipt size={11} />
                          <span>{historyCount} {historyCount === 1 ? 'transaction' : 'transactions'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button 
                      className="btn btn-ghost btn-icon-only"
                      title="Edit Goal"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGoalModal(goal);
                      }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-icon-only"
                      style={{ color: 'var(--color-expense)' }}
                      title="Delete Goal"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGoal(goal.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Circular Progress Ring & Numbers */}
                <div className="goal-progress-section">
                  <div className="goal-numbers">
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Current Savings
                    </span>
                    <span className="goal-current-amount">
                      {formatCurrency(current, symbol)}
                    </span>
                    <span className="goal-target-amount">
                      Target: <strong>{formatCurrency(target, symbol)}</strong>
                    </span>
                    <span style={{ fontSize: '0.8rem', color: isCompleted ? 'var(--color-income)' : 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {isCompleted ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                          <CheckCircle2 size={15} /> Goal Completed! 🏆
                        </span>
                      ) : (
                        <span>Remaining: <strong className="amount-val">{formatCurrency(remaining, symbol)}</strong></span>
                      )}
                    </span>
                  </div>

                  {/* Circular Progress Component (from modern-web-guidance pattern) */}
                  <div className="progress-ring-container">
                    <div 
                      className="progress-ring-circle"
                      style={{
                        background: `conic-gradient(${isCompleted ? '#10B981' : '#06B6D4'} ${percent * 3.6}deg, rgba(255, 255, 255, 0.08) 0deg)`
                      }}
                    >
                      <div className="progress-ring-inner">
                        <span className="progress-ring-percent amount-val">
                          {percent}%
                        </span>
                        <span className="progress-ring-subtext">
                          {isCompleted ? 'Done' : 'Saved'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projections & Timeline */}
                <div style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> Target Date:
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {goal.targetDate || 'Flexible'}
                    </span>
                  </div>

                  {!isCompleted && daysLeft !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} /> Pace Needed:
                      </span>
                      <span style={{ fontWeight: 700, color: isOverdue ? 'var(--color-expense)' : 'var(--color-brand)' }}>
                        {isOverdue ? (
                          'Target date passed'
                        ) : (
                          `${formatCurrency(dailyNeeded, symbol)} / day`
                        )}
                      </span>
                    </div>
                  )}

                  {!isCompleted && daysLeft > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Countdown:
                      </span>
                      <span style={{ color: 'var(--color-goal)', fontWeight: 600 }}>
                        {daysLeft} days remaining
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action: History & Add/Withdraw Funds */}
                <div className="goal-card-footer">
                  <button 
                    type="button"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'var(--color-goal)',
                      borderColor: 'rgba(6, 182, 212, 0.25)',
                      borderRadius: 'var(--radius-md)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenGoalDetail && onOpenGoalDetail(goal);
                    }}
                    title="View transaction history"
                  >
                    <History size={14} />
                    <span>History ({historyCount})</span>
                  </button>

                  <button 
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDepositModal(goal);
                    }}
                  >
                    <Plus size={15} />
                    <span>Deposit Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
