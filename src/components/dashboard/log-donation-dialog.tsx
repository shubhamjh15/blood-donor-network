"use client";
import * as React from "react";
import { Building2, Calendar, Syringe } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import confettiBurst from "./confetti";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function LogDonationDialog() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [hospital, setHospital] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/donations", { method: "POST", json: { date: new Date(date + "T12:00:00").toISOString(), hospital, units: 1 } });
      await Promise.all([mutate("/api/me"), mutate("/api/donations")]);
      confettiBurst();
      toast.success("Donation logged — you're a lifesaver! ❤️");
      setOpen(false);
      setHospital("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary"><Syringe /> Log a donation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a donation</DialogTitle>
          <DialogDescription>Donated at a camp or blood bank? Add it to keep your eligibility and impact up to date.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Date"><Input icon={<Calendar />} type="date" required max={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Hospital / blood bank"><Input icon={<Building2 />} required minLength={2} value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="e.g. Red Cross Blood Bank" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Save donation</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
