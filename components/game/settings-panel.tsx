"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Gear, SignOut, User, Buildings } from "@phosphor-icons/react"

interface TeamMember {
  name: string
  role: string
  type: string // "founder" | "employee" | "co-founder" (future)
}

interface SettingsPanelProps {
  labName: string
  founderName: string
  founderType: string
  team?: TeamMember[]
}

export function SettingsPanel({
  labName,
  founderName,
  founderType,
  team = [],
}: SettingsPanelProps) {
  const getFounderBadge = (type: string) => {
    switch (type) {
      case "technical":
        return "TF"
      case "business":
        return "BF"
      case "research":
        return "RF"
      default:
        return "TF"
    }
  }

  const getFounderLabel = (type: string) => {
    switch (type) {
      case "technical":
        return "Technical Founder"
      case "business":
        return "Business Founder"
      case "research":
        return "Research Founder"
      default:
        return "Founder"
    }
  }

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
      >
        <Gear className="w-4 h-4" />
      </SheetTrigger>
      <SheetContent side="right" className="border-border">
        <SheetHeader>
          <SheetTitle className="lowercase">settings</SheetTitle>
          <SheetDescription className="lowercase">
            manage your lab and profile
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Profile Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium lowercase">profile</h3>
            </div>
            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground lowercase">name</span>
                <span className="text-sm">{founderName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground lowercase">role</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm lowercase">{getFounderLabel(founderType)}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                    {getFounderBadge(founderType)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Organization Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Buildings className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium lowercase">organization</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground lowercase">lab name</span>
                <span className="text-sm">{labName}</span>
              </div>

              {/* Team */}
              <div>
                <span className="text-xs text-muted-foreground lowercase block mb-2">team</span>
                <div className="space-y-2">
                  {/* Founder always shows first */}
                  <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                    <span className="text-sm">{founderName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground lowercase">founder</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                        {getFounderBadge(founderType)}
                      </span>
                    </div>
                  </div>

                  {/* Other team members */}
                  {team.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30"
                    >
                      <span className="text-sm">{member.name}</span>
                      <span className="text-xs text-muted-foreground lowercase">{member.role}</span>
                    </div>
                  ))}

                  {team.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      no employees hired yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <SheetFooter className="border-t border-border">
          <a href="/api/auth/signout" className="w-full">
            <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
              <SignOut className="w-4 h-4" />
              <span className="lowercase">sign out</span>
            </Button>
          </a>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

