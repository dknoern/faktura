import { Button } from '@/components/ui/button';
import { signIn } from "@/auth"

export const dynamic = 'force-dynamic';

const features = [
  {
    title: 'Inventory Management',
    description: 'Track every item across your entire catalog — quantities, costs, locations, and status — all in one place.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4" />
      </svg>
    ),
  },
  {
    title: 'Invoicing',
    description: 'Generate professional invoices in seconds. Send, track, and manage payments without leaving your dashboard.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6-8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
      </svg>
    ),
  },
  {
    title: 'Bids & Proposals',
    description: 'Create and send itemized bids to prospective customers. Convert accepted bids to invoices with one click.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    title: 'Item Tracking',
    description: 'Follow every item through its lifecycle — from acquisition to sale — with a full audit trail and history.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-13l6 3m0 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 10m0 10V10" />
      </svg>
    ),
  },
]

export default async function PublicPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <span className="text-xl font-bold tracking-tight text-indigo-600">Fakturian</span>
          <form
            action={async () => {
              "use server"
              await signIn('auth0', { redirectTo: "/home" })
            }}
          >
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-9 text-sm font-semibold">
              Sign In
            </Button>
          </form>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: 'url(/background-watches.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Built for retail businesses
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6 text-gray-900">
            The smarter way to run<br />
            <span className="text-indigo-600">your inventory business</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Fakturian gives retail businesses everything they need to manage inventory, issue invoices, create bids, and track items — all in one clean, fast platform.
          </p>
          <form
            action={async () => {
              "use server"
              await signIn('auth0', { redirectTo: "/home" })
            }}
          >
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-3 text-base font-semibold h-auto shadow-lg shadow-indigo-200">
              Get Started →
            </Button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Everything your business needs
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              From the stockroom to the sale, Fakturian covers the full workflow of a modern retail operation.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / stat strip */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center text-white">
          {[
            { stat: 'All-in-one', label: 'Inventory, invoices, and bids in a single platform' },
            { stat: 'Real-time', label: 'Live item tracking and status updates as things move' },
            { stat: 'No spreadsheets', label: 'Replace your manual workflows with a purpose-built tool' },
          ].map((item) => (
            <div key={item.stat}>
              <div className="text-3xl font-extrabold mb-1">{item.stat}</div>
              <div className="text-indigo-200 text-sm leading-snug">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Ready to take control of your inventory?
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            Sign in to your Fakturian account and get back to running your business.
          </p>
          <form
            action={async () => {
              "use server"
              await signIn('auth0', { redirectTo: "/home" })
            }}
          >
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-3 text-base font-semibold h-auto shadow-lg shadow-indigo-200">
              Sign In to Fakturian →
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span className="font-semibold text-indigo-600">Fakturian</span>
          <span>© {new Date().getFullYear()} Fakturian. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
