import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Play, Pause, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ServiceDetail({ params }: { params: { id: string } }) {
  // Mock data
  const service = {
    id: params.id,
    name: "E-Commerce Checkout",
    status: "active",
    currency: "USD",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {service.name}
            {service.status === "active" ? (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>
            ) : (
              <Badge variant="outline">Paused</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">{service.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Pause className="w-4 h-4 mr-2" /> Pause
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Requests (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,248</div>
                <p className="text-xs text-success mt-1">+14% from yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">99.8%</div>
                <p className="text-xs text-muted-foreground mt-1">Based on last 1k reqs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stripe</span>
                    <Badge variant="outline" className="bg-success/10 text-success">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Razorpay</span>
                    <Badge variant="outline" className="bg-warning/10 text-warning">Needs Setup</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest API calls and payments processed by this service.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">pi_3M...</TableCell>
                    <TableCell>$49.00</TableCell>
                    <TableCell>Stripe</TableCell>
                    <TableCell><Badge variant="outline" className="bg-success/10 text-success border-success/20">Succeeded</Badge></TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">2 min ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">pay_L...</TableCell>
                    <TableCell>$12.50</TableCell>
                    <TableCell>Razorpay</TableCell>
                    <TableCell><Badge variant="outline" className="bg-danger/10 text-danger border-danger/20">Failed</Badge></TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">15 min ago</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Connected Providers</CardTitle>
                <CardDescription>Manage credentials and routing for payment gateways.</CardDescription>
              </div>
              <Button size="sm">Add Provider</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold">S</div>
                    <div>
                      <h4 className="font-medium">Stripe</h4>
                      <p className="text-xs text-muted-foreground font-mono">sk_live_••••4f2a</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-success">Connected</Badge>
                    <Button variant="ghost" size="icon"><Settings2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
