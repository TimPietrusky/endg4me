"use client"

import { Cube } from "@phosphor-icons/react"

export function CollectionView() {
  return (
    <div className="text-center py-16">
      <Cube className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
      <h3 className="text-lg font-bold mb-2">Model Collection</h3>
      <p className="text-sm text-muted-foreground">Your trained models will appear here</p>
    </div>
  )
}
