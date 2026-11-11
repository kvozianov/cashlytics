'use client'

import { useId, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { isValidISODate } from '@/lib/demo/dates'
import { useDemo } from '@/lib/demo/store'
import type { Goal } from '@/lib/demo/types'

export type GoalDialogMode = { kind: 'new'; preset?: Partial<Omit<Goal, 'id'>> } | { kind: 'edit'; goal: Goal }

export function GoalDialog({ mode, onClose }: { mode: GoalDialogMode | null; onClose: () => void }) {
  return (
    <Dialog open={!!mode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">{mode && <GoalForm key={mode.kind === 'edit' ? mode.goal.id : 'new'} mode={mode} onClose={onClose} />}</DialogContent>
    </Dialog>
  )
}

const NONE = '__none'
const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/[,$\s]/g, '')))

function GoalForm({ mode, onClose }: { mode: GoalDialogMode; onClose: () => void }) {
  const uid = useId()
  const { state, today, actions } = useDemo()
  const initial = mode.kind === 'edit' ? mode.goal : mode.preset ?? {}
  const [name, setName] = useState(initial.name ?? '')
  const [target, setTarget] = useState(initial.target ? String(initial.target) : '')
  const [saved, setSaved] = useState(String(initial.saved ?? 0))
  const [date, setDate] = useState(initial.targetDate ?? '')
  const [monthly, setMonthly] = useState(initial.monthlyContribution ? String(initial.monthlyContribution) : '')
  const [accountId, setAccountId] = useState(initial.accountId ?? NONE)
  const [touched, setTouched] = useState(false)
  const accounts = state.accounts.filter((a) => a.purpose === 'savings')
  const linked = accountId !== NONE

  const errors = {
    name: name.trim() ? '' : 'Give the goal a name.',
    target: num(target) > 0 ? '' : 'Enter a target above $0.',
    saved: linked || (num(saved) >= 0 && Number.isFinite(num(saved))) ? '' : 'Enter 0 or more.',
    date: date === '' ? '' : !isValidISODate(date) ? 'Enter a valid date.' : date <= today ? 'Pick a date in the future.' : '',
    monthly: monthly.trim() === '' || num(monthly) >= 0 ? '' : 'Enter 0 or more.',
  }
  const valid = !Object.values(errors).some(Boolean)
  const show = (k: keyof typeof errors) => (touched ? errors[k] : '')

  function submit() {
    setTouched(true)
    if (!valid) return
    const goal: Omit<Goal, 'id'> = {
      name: name.trim(),
      target: num(target),
      saved: mode.kind === 'edit' && linked ? mode.goal.saved : Number.isFinite(num(saved)) ? num(saved) : 0,
      targetDate: date || undefined,
      monthlyContribution: monthly.trim() === '' ? undefined : num(monthly),
      accountId: linked ? accountId : undefined,
    }
    if (mode.kind === 'edit') actions.updateGoal(mode.goal.id, goal)
    else actions.addGoal(goal)
    onClose()
  }

  const field = (id: string, label: string, input: React.ReactNode, err: string, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${uid}-${id}`}>{label}</Label>
      {input}
      <p id={`${uid}-${id}-msg`} className={err ? 'text-[12px] text-destructive' : 'text-[12px] text-muted-foreground'}>
        {err || hint}
      </p>
    </div>
  )

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="grid gap-3"
    >
      <DialogHeader>
        <DialogTitle>{mode.kind === 'edit' ? 'Edit goal' : 'New goal'}</DialogTitle>
        <DialogDescription>Saved only in this browser, like everything in the demo.</DialogDescription>
      </DialogHeader>
      {field(
        'name',
        'Name',
        <Input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!show('name')} aria-describedby={`${uid}-name-msg`} autoFocus />,
        show('name'),
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {field(
          'target',
          'Target, $',
          <Input id={`${uid}-target`} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} aria-invalid={!!show('target')} aria-describedby={`${uid}-target-msg`} className="font-mono" />,
          show('target'),
        )}
        {field(
          'saved',
          'Saved so far, $',
          <Input
            id={`${uid}-saved`}
            inputMode="decimal"
            value={saved}
            onChange={(e) => setSaved(e.target.value)}
            disabled={mode.kind === 'edit' && linked}
            aria-invalid={!!show('saved')}
            aria-describedby={`${uid}-saved-msg`}
            className="font-mono"
          />,
          show('saved'),
          mode.kind === 'edit' && linked ? 'Changes when you contribute.' : undefined,
        )}
        {field(
          'date',
          'Target date (optional)',
          <Input id={`${uid}-date`} type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} aria-invalid={!!show('date')} aria-describedby={`${uid}-date-msg`} className="font-mono" />,
          show('date'),
        )}
        {field(
          'monthly',
          'Monthly amount, $ (optional)',
          <Input id={`${uid}-monthly`} inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} aria-invalid={!!show('monthly')} aria-describedby={`${uid}-monthly-msg`} className="font-mono" />,
          show('monthly'),
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-acct`}>Keep the money in</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger id={`${uid}-acct`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No separate account</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name} ··{a.last4}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[12px] text-muted-foreground">With an account, contributing moves real (demo) money there with a transfer.</p>
      </div>
      <DialogFooter className="mt-2 sm:justify-between">
        {mode.kind === 'edit' ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
                Delete goal
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{mode.goal.name}”?</AlertDialogTitle>
                <AlertDialogDescription>The goal disappears from this demo. Money already moved stays in its account. Reset the demo to bring it back.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    actions.deleteGoal(mode.goal.id)
                    onClose()
                  }}
                >
                  Delete goal
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{mode.kind === 'edit' ? 'Save goal' : 'Add goal'}</Button>
        </div>
      </DialogFooter>
    </form>
  )
}
