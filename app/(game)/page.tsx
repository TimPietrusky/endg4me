import { redirect } from "next/navigation"

// Root of game routes redirects to /operate
export default function GameRootPage() {
  redirect("/operate")
}

