'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface AddToCollectionProps {
  cardId: string
  cardName: string
  variants: string[]
}

const CONDITIONS = [
  'Mint',
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
]

export function AddToCollection({ cardId, cardName, variants }: AddToCollectionProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState('1')
  const [condition, setCondition] = useState('Near Mint')
  const [variant, setVariant] = useState(variants[0] || 'normal')
  const [purchasePrice, setPurchasePrice] = useState('')

  async function handleAdd() {
    setLoading(true)
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          quantity: parseInt(quantity),
          condition,
          variant,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add card')
      }
      toast.success(`Added ${cardName} to your collection`)
      setOpen(false)
      // Reset form
      setQuantity('1')
      setPurchasePrice('')
      setCondition('Near Mint')
      setVariant(variants[0] || 'normal')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add card'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button type="button" className="btn-primary flex items-center gap-2 text-[13px] px-5 py-2.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add to Collection
        </button>
      </DialogTrigger>
      <DialogContent className="surface-2 border-[var(--border-default)] rounded-xl max-w-[400px] p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-display-sm font-display">
              Add to Collection
            </DialogTitle>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{cardName}</p>
          </DialogHeader>
        </div>

        <div className="section-divider" />

        <div className="px-6 py-5 space-y-4">
          {/* Quantity & Price Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-premium w-full"
              />
            </div>
            <div>
              <label className="text-label block mb-1.5">Purchase Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--text-tertiary)] font-medium">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="input-premium w-full pl-7"
                />
              </div>
            </div>
          </div>

          {/* Variant */}
          <div>
            <label className="text-label block mb-1.5">Variant</label>
            <Select value={variant} onValueChange={(v) => v && setVariant(v)}>
              <SelectTrigger className="input-premium w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="surface-3 border-[var(--border-default)]">
                {variants.map((v) => (
                  <SelectItem key={v} value={v} className="capitalize text-[13px]">
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div>
            <label className="text-label block mb-1.5">Condition</label>
            <Select value={condition} onValueChange={(v) => v && setCondition(v)}>
              <SelectTrigger className="input-premium w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="surface-3 border-[var(--border-default)]">
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c} className="text-[13px]">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="section-divider" />

        <div className="px-6 py-4">
          <button
            onClick={handleAdd}
            disabled={loading || parseInt(quantity) < 1}
            className="btn-primary w-full py-3 text-[13px] font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="animate-spin"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="28"
                    strokeDashoffset="20"
                  />
                </svg>
                Adding...
              </span>
            ) : (
              'Add to Collection'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
