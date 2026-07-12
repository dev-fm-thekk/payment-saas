import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Search, Users, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function CompaniesPage() {
  const companies = [
    {
      id: "comp_1",
      name: "Acme Corp",
      slug: "acme-corp",
      plan: "Pro",
      members: 12,
      services: 4,
      role: "Owner",
    },
    {
      id: "comp_2",
      name: "Globex Inc",
      slug: "globex-inc",
      plan: "Startup",
      members: 3,
      services: 1,
      role: "Admin",
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Select a company to manage its payments or create a new one.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Company</DialogTitle>
              <DialogDescription>
                Create a new workspace for your team to manage payments.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" placeholder="Acme Corp" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">Slug</Label>
                <Input id="slug" placeholder="acme-corp" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search companies..." className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Link key={company.id} href="dashboard">
            <Card className="hover:border-primary/50 transition-colors h-full flex flex-col cursor-pointer group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border bg-background">
                    <AvatarFallback className="font-semibold text-primary">
                      {company.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {company.name}
                    </CardTitle>
                    <CardDescription className="text-xs">{company.slug}</CardDescription>
                  </div>
                </div>
                <Badge variant={company.plan === "Pro" ? "default" : "secondary"}>
                  {company.plan}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 mt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> {company.members}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" /> {company.services}
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4" /> {company.role}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
