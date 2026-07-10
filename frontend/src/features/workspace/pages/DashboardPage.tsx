import React, { useState } from 'react'
import { 
  Plus, 
  LayoutGrid, 
  CheckSquare, 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  Check, 
  Compass, 
  Activity, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Users, 
  ChevronRight,
  MousePointerClick,
  Layers,
  Zap,
  Star
} from 'lucide-react'
import { useWorkspacesQuery } from '../api/workspace.queries'
import { WorkspaceCard } from '../components/WorkspaceCard'
import { CreateWorkspaceDialog } from '../components/CreateWorkspaceDialog'
import { ListSkeleton } from '@/components/shared/LoadingSkeleton'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useNavigate, Link } from 'react-router-dom'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: workspaces, isLoading, error } = useWorkspacesQuery()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { user } = useAuthStore()

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-bg-tertiary rounded-xl" />
        <ListSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center text-rose-500 border border-rose-500/10 rounded-2xl bg-rose-500/5 my-8 font-semibold text-xs animate-fade-in">
        Failed to load workspaces. Please try again.
      </div>
    )
  }

  const hasWorkspaces = workspaces && workspaces.length > 0
  const workspaceCount = workspaces?.length || 0

  // Onboarding Checklist state
  const step1Completed = hasWorkspaces
  const step2Completed = true
  const step3Completed = true
  const progressPercent = (step1Completed ? 25 : 0) + (step2Completed ? 25 : 0) + (step3Completed ? 25 : 0) + 25

  const getGreeting = () => {
    const hrs = new Date().getHours()
    if (hrs < 12) return 'Good morning'
    if (hrs < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Pre-seeded high fidelity activities to avoid empty feeds
  const recentActivities = [
    { id: 1, actor: 'Sophia Lopez', action: 'completed task', target: 'Upgrade Lombok to JDK 26', time: '10m ago' },
    { id: 2, actor: 'Mark Chen', action: 'moved task to', target: 'In Progress', time: '1h ago' },
    { id: 3, actor: 'System', action: 'bootstrap completed', target: 'Flyway migrations seeded', time: '3h ago' },
  ]

  // Mock list of today's priority tasks (Focus Queue)
  const priorityTasks = [
    { id: '1', title: 'Implement V2 Kanban Boards', priority: 'URGENT', workspace: 'SyncForge Dev', type: 'Design System' },
    { id: '2', title: 'Configure spring-boot surefire argline', priority: 'HIGH', workspace: 'Backend Dev', type: 'API Development' },
    { id: '3', title: 'Refactor details side drawer pane', priority: 'MEDIUM', workspace: 'SyncForge Design', type: 'UX Redesign' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 p-6 max-w-6xl mx-auto select-none text-text-primary relative z-10"
    >
      {/* Header greeting block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-default/40 pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
            {getGreeting()}, {user?.displayName || 'User'}
            <Sparkles className="h-4.5 w-4.5 text-accent-primary animate-pulse" />
          </h1>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Welcome to your command center. Check priorities, workloads, and active team updates.
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-accent-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-accent-primary-hover active:scale-[0.97] transition-all border border-accent-primary/20"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Workspace
        </button>
      </div>

      {/* Main Command Center Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Area: Focus Queue & Active Workspaces (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Focus Queue Widget */}
          <div className="border border-border-default bg-bg-secondary/40 rounded-2xl p-5 space-y-4 shadow-sm backdrop-blur-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-accent-primary rounded-t-2xl shadow-xs" />
            <div className="flex items-center justify-between border-b border-border-default/40 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4.5 w-4.5 text-accent-primary" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Personal Focus Queue
                </h3>
              </div>
              <span className="text-[9px] font-extrabold bg-accent-primary-subtle text-accent-primary border border-accent-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {priorityTasks.length} Urgent Items
              </span>
            </div>
            
            <div className="space-y-2.5">
              {priorityTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border-default/60 bg-bg-primary hover:border-accent-primary/40 hover:shadow-xs transition-all duration-200 group relative"
                >
                  <div className="flex items-center gap-3">
                    <button className="h-4.5 w-4.5 rounded-md border border-border-default hover:border-accent-primary flex items-center justify-center text-transparent hover:text-accent-primary bg-bg-secondary/35 active:scale-90 transition-all shrink-0">
                      <Check className="h-3 w-3" />
                    </button>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-text-primary group-hover:text-accent-primary transition-colors leading-tight block">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-text-tertiary">{task.workspace}</span>
                        <span className="h-1 w-1 rounded-full bg-border-default" />
                        <span className="text-[9px] font-bold text-text-secondary">{task.type}</span>
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[8px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 select-none",
                    task.priority === 'URGENT' ? 'bg-danger-subtle text-danger border-danger/25' : 
                    task.priority === 'HIGH' ? 'bg-warning-subtle text-warning border-warning/25' : 'bg-accent-primary-subtle text-accent-primary border-accent-primary/25'
                  )}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Workspaces block */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pl-1">
              <LayoutGrid className="h-4 w-4 text-accent-primary" />
              <h2 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                Active Workspaces ({workspaceCount})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {workspaces?.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} />
              ))}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-bg-secondary/40 border border-border-default rounded-2xl p-5 space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 pb-2.5 border-b border-border-default/40">
                <CalendarIcon className="h-4.5 w-4.5 text-accent-primary" />
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Sprint Timeline</h4>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Active sprint ending in <span className="font-bold text-text-primary">4 days</span>. Review open workpiece pull requests before deployment tags.
              </p>
            </div>

            <div className="bg-bg-secondary/40 border border-border-default rounded-2xl p-5 space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 pb-2.5 border-b border-border-default/40">
                <TrendingUp className="h-4.5 w-4.5 text-success" />
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Productivity Insights</h4>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Task completion rate increased by <span className="font-bold text-success">+18%</span> compared to last week. Excellent progress!
              </p>
            </div>
          </div>

        </div>

        {/* Right Area: Onboarding, Activity & Quick Actions (4 columns) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Interactive Onboarding */}
          <div className="rounded-2xl border border-border-default bg-bg-secondary/40 p-5 shadow-sm relative overflow-hidden backdrop-blur-xs">
            <div className="flex items-center gap-2 pb-3.5 border-b border-border-default/40">
              <Compass className="h-4.5 w-4.5 text-accent-primary" />
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Setup Checklist</h3>
                <p className="text-[9px] text-text-secondary mt-0.5">Let's set up your team workflow.</p>
              </div>
            </div>

            {/* Progress metric */}
            <div className="py-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-text-secondary">
                <span>Progress</span>
                <span>{progressPercent}% Completed</span>
              </div>
              <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-accent-primary rounded-full" 
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2.5 items-start p-1.5 rounded-lg select-none">
                <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-secondary line-through">Workspace setup</h4>
                </div>
              </div>

              <Link
                to={workspaces?.[0]?.id ? `/workspaces/${workspaces[0].id}` : '#'}
                className="flex gap-2.5 items-start p-1.5 rounded-lg hover:bg-bg-primary/50 transition-colors group cursor-pointer"
              >
                <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-secondary line-through group-hover:text-text-primary transition-colors">Board configuration</h4>
                </div>
              </Link>

              <Link
                to={workspaces?.[0]?.id ? `/workspaces/${workspaces[0].id}/members` : '#'}
                className="flex gap-2.5 items-start p-1.5 rounded-lg hover:bg-bg-primary/50 transition-colors group cursor-pointer"
              >
                <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-secondary line-through group-hover:text-text-primary transition-colors">Invite collaborators</h4>
                </div>
              </Link>

              <Link
                to={workspaces?.[0]?.id ? `/workspaces/${workspaces[0].id}` : '#'}
                className="flex gap-2.5 items-start p-1.5 rounded-lg hover:bg-bg-primary/50 transition-colors group cursor-pointer"
              >
                <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/30 text-[9px] font-bold group-hover:bg-accent-primary group-hover:text-white transition-all">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary group-hover:text-accent-primary transition-colors">Create workpiece issues</h4>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-bg-secondary/40 border border-border-default rounded-2xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border-default/40">
              <MousePointerClick className="h-4.5 w-4.5 text-accent-primary" />
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Quick Actions</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setDialogOpen(true)}
                className="p-2.5 rounded-xl border border-border-default bg-bg-primary hover:border-accent-primary/40 text-center text-[10px] font-bold text-text-secondary hover:text-accent-primary transition-all active:scale-95 shadow-2xs"
              >
                New Workspace
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="p-2.5 rounded-xl border border-border-default bg-bg-primary hover:border-accent-primary/40 text-center text-[10px] font-bold text-text-secondary hover:text-accent-primary transition-all active:scale-95 shadow-2xs"
              >
                App Preferences
              </button>
            </div>
          </div>

          {/* Workspace Activity Feed Widget */}
          <div className="bg-bg-secondary/40 border border-border-default rounded-2xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border-default/40">
              <Activity className="h-4.5 w-4.5 text-warning animate-pulse" />
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Workspace Activity</h4>
            </div>
            
            <div className="space-y-3.5">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex gap-2.5 items-start text-[11px] leading-snug">
                  <div className="h-5 w-5 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-[8px] text-text-secondary border border-border-default">
                    {act.actor[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary truncate">
                      <span className="font-bold text-text-primary">{act.actor}</span> {act.action}{' '}
                      <span className="font-bold text-text-primary truncate">{act.target}</span>
                    </p>
                    <span className="text-[9px] text-text-tertiary block mt-0.5">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <CreateWorkspaceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  )
}
export default DashboardPage
