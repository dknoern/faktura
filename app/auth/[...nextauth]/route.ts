import { handlers } from "@/auth"
import { NextRequest } from "next/server"

// Wrap handlers with error logging
const wrappedGET = async (req: NextRequest) => {
  try {
    return await handlers.GET(req)
  } catch (error) {
    console.error('NextAuth GET error:', error)
    return new Response(
      JSON.stringify({ error: 'Authentication error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

const wrappedPOST = async (req: NextRequest) => {
  try {
    return await handlers.POST(req)
  } catch (error) {
    console.error('NextAuth POST error:', error)
    return new Response(
      JSON.stringify({ error: 'Authentication error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export { wrappedGET as GET, wrappedPOST as POST }
