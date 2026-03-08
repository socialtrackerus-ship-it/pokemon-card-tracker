'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface AddToCollectionProps { cardId: string; cardName: string; variants: string[] }

const CONDITIONS = ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged']

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
        body: JSON.stringify({ card_id: cardId, quantity: parseInt(quantity), condition, variant, purchase_price: purchasePrice ? parseFloat(purchasePrice) : null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      toast.success(`Added ${cardName} to collection`)
      setOpen(false)
    } catch (err: any) { toast.error(err.message || 'Failed to add') }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button className="text-[12px] font-medium text-white px-4 py-2 rounded-md bg-[var(--brand)] hover:opacity-90 transition-opacity">
          + Add to collection
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[var(--surface-1)] border-[var(--border-default)] rounded-lg max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Add {cardName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1">Quantity</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
            </div>
            <div>
              <label className="text-label block mb-1">Price ($)</label>
              <input type="number" step="0.01" placeholder="0.00" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-label block mb-1">Variant</label>
            <Select value={variant} onValueChange={(v) => v && setVariant(v)}>
              <SelectTrigger className="bg-[var(--surface-2)] border-[var(--border-default)] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-label block mb-1">Condition</label>
            <Select value={condition} onValueChange={(v) => v && setCondition(v)}>
              <SelectTrigger className="bg-[var(--surface-2)] border-[var(--border-default)] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button onClick={handleAdd} disabled={loading}
            className="w-full text-[13px] font-medium text-white py-2.5 rounded-md bg-[var(--brand)] hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Adding...' : 'Add to collection'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
