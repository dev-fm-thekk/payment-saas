import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiDocsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground">Integrate PayHub into your application using our unified API.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="hidden md:block col-span-1 space-y-6">
          <div>
            <h4 className="font-semibold text-sm mb-2 text-foreground">Getting Started</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#authentication" className="hover:text-primary transition-colors">Authentication</a></li>
              <li><a href="#environments" className="hover:text-primary transition-colors">Environments</a></li>
              <li><a href="#errors" className="hover:text-primary transition-colors">Errors</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2 text-foreground">Payments</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#create-payment" className="hover:text-primary transition-colors">Create Payment</a></li>
              <li><a href="#refund-payment" className="hover:text-primary transition-colors">Refund Payment</a></li>
              <li><a href="#list-transactions" className="hover:text-primary transition-colors">List Transactions</a></li>
            </ul>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-3 space-y-12">
          {/* Section: Authentication */}
          <section id="authentication" className="space-y-4 pt-4 scroll-mt-20">
            <h2 className="text-xl font-bold border-b pb-2">Authentication</h2>
            <p className="text-muted-foreground">
              The PayHub Payment API uses API keys to authenticate requests. You can view and manage your API keys in the <a href="/dashboard/api-keys" className="text-primary hover:underline">API Keys</a> section.
            </p>
            <p className="text-muted-foreground">
              All API requests must be made over HTTPS. Calls made over plain HTTP will fail. API requests without authentication will also fail.
            </p>
            
            <Card className="bg-[#1E1E1E] text-white border-0 mt-4 overflow-hidden">
              <CardHeader className="bg-[#2D2D2D] py-3 px-4 border-b border-[#3D3D3D]">
                <CardTitle className="text-xs font-mono text-gray-400">cURL - Authentication</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-4">
                <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                  <code className="language-bash">
{`curl https://api.payhub.com/v1/payment/list-transactions \\
  -H "x-api-key: sk_test_YOUR_API_KEY" \\
  -d "serviceId=srv_123456789"`}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </section>

          {/* Section: Create Payment */}
          <section id="create-payment" className="space-y-4 pt-4 scroll-mt-20">
            <div className="flex items-center gap-3 border-b pb-2">
              <h2 className="text-xl font-bold">Create Payment</h2>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">POST</Badge>
              <span className="font-mono text-sm text-muted-foreground">/payment/pay</span>
            </div>
            <p className="text-muted-foreground">
              Processes a new payment using the configured active providers for the specified service.
              PayHub automatically routes the request according to your service's configuration.
            </p>
            
            <h4 className="font-semibold text-sm mt-6 mb-2">Request Body</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium">Parameter</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">serviceId<span className="text-danger ml-1">*</span></td>
                    <td className="px-4 py-3 font-mono text-xs">string</td>
                    <td className="px-4 py-3 text-muted-foreground">UUID of the service processing the payment.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">amount<span className="text-danger ml-1">*</span></td>
                    <td className="px-4 py-3 font-mono text-xs">number</td>
                    <td className="px-4 py-3 text-muted-foreground">Positive integer representing the smallest currency unit (e.g. cents).</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">currency<span className="text-danger ml-1">*</span></td>
                    <td className="px-4 py-3 font-mono text-xs">string</td>
                    <td className="px-4 py-3 text-muted-foreground">Three-letter ISO currency code (e.g. "USD").</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">description</td>
                    <td className="px-4 py-3 font-mono text-xs">string</td>
                    <td className="px-4 py-3 text-muted-foreground">Arbitrary string describing the payment.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Card className="bg-[#1E1E1E] text-white border-0 mt-6 overflow-hidden">
              <CardHeader className="bg-[#2D2D2D] py-3 px-4 border-b border-[#3D3D3D] flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-mono text-gray-400">Node.js - Create Payment</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-[#3D3D3D]">
                  <Copy className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-4">
                <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                  <code className="language-typescript">
{`const response = await fetch('https://api.payhub.com/v1/payment/pay', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sk_live_...'
  },
  body: JSON.stringify({
    serviceId: 'srv_a1b2c3d4',
    amount: 2999, // $29.99
    currency: 'USD',
    description: 'Monthly Pro Subscription'
  })
});

const data = await response.json();
console.log(data.paymentId);`}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
