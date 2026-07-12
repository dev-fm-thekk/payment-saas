"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Copy, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const [showKey, setShowKey] = useState(false);
  
  const apiKeys = [
    {
      id: "key_1",
      name: "Production App Key",
      key: "sk_live_••••••••••••4f2a",
      scope: "Full Access",
      created: "Oct 12, 2026",
      lastUsed: "2 mins ago",
      status: "Active",
      environment: "Live",
    },
    {
      id: "key_2",
      name: "Staging Tests",
      key: "sk_test_••••••••••••8b9c",
      scope: "Read Only",
      created: "Sep 05, 2026",
      lastUsed: "1 day ago",
      status: "Active",
      environment: "Test",
    },
    {
      id: "key_3",
      name: "Legacy Webhook",
      key: "sk_live_••••••••••••1a2b",
      scope: "Webhook Only",
      created: "Jan 10, 2026",
      lastUsed: "Never",
      status: "Revoked",
      environment: "Live",
    }
  ];

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">Manage your secret keys for authentication with PayHub API.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generate API Key</DialogTitle>
              <DialogDescription>
                Create a new key for this company. Keys cannot be viewed again after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key-name" className="text-right">Name</Label>
                <Input id="key-name" placeholder="e.g., Mobile App Production" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="env" className="text-right">Environment</Label>
                <select id="env" className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="test">Test</option>
                  <option value="live">Live</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secret Keys</CardTitle>
          <CardDescription>
            These keys grant access to your PayHub company data. Keep them secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((item) => (
                <TableRow key={item.id} className={item.status === "Revoked" ? "opacity-60 bg-muted/30" : ""}>
                  <TableCell className="font-medium">
                    {item.name}
                    <div className="text-xs text-muted-foreground mt-1">{item.scope}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="bg-secondary px-2 py-1 rounded-md text-secondary-foreground border">
                        {item.key}
                      </span>
                      {item.status === "Active" && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => handleCopy(item.key)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.environment === "Live" ? "default" : "secondary"}>
                      {item.environment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{item.created}</TableCell>
                  <TableCell className="text-sm">{item.lastUsed}</TableCell>
                  <TableCell>
                    {item.status === "Active" ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Revoked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem>Rotate Key</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive font-medium">Revoke Key</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
