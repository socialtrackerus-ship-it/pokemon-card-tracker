'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface AddToCollectionProps {
  cardId: string
  cardName: string
  variants: string[]
}

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
        body: JSON.stringify({
          card_id: cardId,
          quantity: parseInt(quantity),
          condition,
          variant,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add')
      }

      toast.success(`Added ${cardName} to collection!`)
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to collection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white border-0 shadow-[0_0_20px_oklch(0.6_0.2_280_/_15%)] hover:shadow-[0_0_30px_oklch(0.6_0.2_280_/_25%)] transition-all rounded-xl">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add to Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[oklch(0.1_0.015_270)] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add {cardName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1.5 bg-white/5 border-white/10 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Price ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="mt-1.5 bg-white/5 border-white/10 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Variant</label>
            <Select value={variant} onValueChange={(v) => v && setVariant(v)}>
              <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Condition</label>
            <Select value={condition} onValueChange={(v) => v && setCondition(v)}>
              <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAdd}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white border-0 rounded-xl h-11 shadow-[0_0_20px_oklch(0.6_0.2_280_/_15%)]"
          >
            {loading ? 'Adding...' : 'Add to Collection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
