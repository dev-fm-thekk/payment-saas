import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Shield, Layers, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <Zap size={20} className="fill-current" />
          </div>
          PayHub
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/dashboard/api-docs" className="hover:text-foreground transition-colors">Docs</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#blog" className="hover:text-foreground transition-colors">Blog</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Get Started <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 py-24 md:py-32 flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#242830_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
          
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-6">
            Unified Payments API
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-balance">
            One API. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Every payment provider.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl text-balance">
            Abstract away the complexity of Stripe, Razorpay, and others behind a single, elegant integration. Switch providers without changing code.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                Start Building Free
              </Button>
            </Link>
            <Link href="/dashboard/api-docs" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                View Documentation
              </Button>
            </Link>
          </div>
        </section>

        {/* Code Snippet Section */}
        <section className="px-6 py-12 flex justify-center max-w-4xl mx-auto">
          <div className="w-full rounded-xl overflow-hidden border bg-[#1E1E1E] shadow-2xl">
            <div className="flex items-center px-4 py-3 bg-[#2D2D2D] border-b border-[#3D3D3D]">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="mx-auto text-xs text-gray-400 font-mono">create-payment.ts</div>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono text-gray-300">
                <code className="language-typescript">
{`import { PayHub } from '@payhub/node';

const payhub = new PayHub('sk_live_...');

// One call routes to Stripe or Razorpay based on your rules
const payment = await payhub.payments.create({
  amount: 4900,
  currency: 'USD',
  serviceId: 'srv_123',
  description: 'Pro Plan Subscription',
});

console.log(payment.provider); // e.g., 'stripe'
`}
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-24 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-xl border flex flex-col gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Layers size={24} />
                </div>
                <h3 className="text-xl font-bold">Multi-Provider Routing</h3>
                <p className="text-muted-foreground text-sm">
                  Configure fallback rules. If Stripe goes down, automatically route payments to Razorpay.
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border flex flex-col gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Code2 size={24} />
                </div>
                <h3 className="text-xl font-bold">Unified Webhooks</h3>
                <p className="text-muted-foreground text-sm">
                  Receive a single, standardized webhook format regardless of which provider processed the payment.
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border flex flex-col gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold">Secure Vault</h3>
                <p className="text-muted-foreground text-sm">
                  Store all your provider credentials securely. Multi-tenant architecture keeps your data safe.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold">
            <Zap size={16} className="text-primary fill-current" /> PayHub
          </div>
          <p className="text-sm text-muted-foreground">© 2026 PayHub Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
