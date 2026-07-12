import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Activity, Zap } from "lucide-react";

export default function DashboardHome() {
  // Mock data for services
  const services = [
    {
      id: "srv_1",
      name: "E-Commerce Checkout",
      status: "active",
      providers: ["stripe", "razorpay"],
      lastTx: "2 mins ago",
      requests: "1.2k",
    },
    {
      id: "srv_2",
      name: "SaaS Subscriptions",
      status: "degraded",
      providers: ["stripe"],
      lastTx: "5 hrs ago",
      requests: "450",
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground">Manage payment services for Acme Corp.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Link key={service.id} href={`/dashboard/services/${service.id}`}>
            <Card className="hover:border-primary/50 transition-colors h-full flex flex-col cursor-pointer group">
              <CardHeader className="pb-3 flex flex-row justify-between items-start space-y-0">
                <div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors">{service.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">ID: <span className="font-mono">{service.id}</span></CardDescription>
                </div>
                <div className="flex gap-1">
                  {service.status === "active" && <span className="flex h-2 w-2 rounded-full bg-success"></span>}
                  {service.status === "degraded" && <span className="flex h-2 w-2 rounded-full bg-warning"></span>}
                  {service.status === "inactive" && <span className="flex h-2 w-2 rounded-full bg-muted"></span>}
                </div>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                <div className="flex items-center gap-2 mt-2">
                  {service.providers.includes("stripe") && (
                    <Badge variant="outline" className="bg-[#635BFF]/10 text-[#635BFF] border-[#635BFF]/20">Stripe</Badge>
                  )}
                  {service.providers.includes("razorpay") && (
                    <Badge variant="outline" className="bg-[#02042B]/10 text-[#02042B] border-[#02042B]/20 dark:bg-blue-900/30 dark:text-blue-300">Razorpay</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t text-xs text-muted-foreground flex justify-between">
                <div className="flex items-center gap-1">
                  <Activity size={12} /> {service.requests} today
                </div>
                <div>Last: {service.lastTx}</div>
              </CardFooter>
            </Card>
          </Link>
        ))}

        <Card className="border-dashed flex flex-col items-center justify-center h-[180px] hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors mb-3">
            <Plus size={20} />
          </div>
          <p className="font-medium">New Service</p>
          <p className="text-xs text-muted-foreground mt-1">Create a new integration</p>
        </Card>
      </div>
    </div>
  );
}
