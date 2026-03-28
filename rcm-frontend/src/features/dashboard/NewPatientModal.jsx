import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, User } from 'lucide-react';

const NewPatientModal = ({ isOpen, onOpenChange, formData, onChange, onSubmit }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold text-xs uppercase tracking-widest rounded-sm border-2">
          <Plus className="w-4 h-4 mr-2" /> Registry Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b bg-muted/10 shrink-0">
          <DialogTitle className="uppercase tracking-widest text-sm font-bold">New Registry Entry</DialogTitle>
          <DialogDescription className="text-xs">Populate the schema carefully. Name is exclusively required.</DialogDescription>
        </DialogHeader>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-background">
          <form id="registry-form" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-2"><User className="w-3 h-3" /> Full Legal Name *</Label>
              <Input id="name" value={formData.name} onChange={onChange} required className="rounded-sm bg-muted/10 border-foreground/20" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dob" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date of Birth</Label>
              <Input id="dob" type="date" value={formData.dob} onChange={onChange} className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Age</Label>
              <Input id="age" type="number" value={formData.age} onChange={onChange} className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Gender</Label>
              <Input id="gender" value={formData.gender} onChange={onChange} placeholder="Male / Female / Other" className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Contact Info</Label>
              <Input id="contact" value={formData.contact} onChange={onChange} placeholder="Phone or Email" className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="policy_number" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Policy Number</Label>
              <Input id="policy_number" value={formData.policy_number} onChange={onChange} placeholder="ABC12345" className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="insurer_id" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Insurer ID</Label>
              <Input id="insurer_id" value={formData.insurer_id} onChange={onChange} className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="employee_id" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Employee ID</Label>
              <Input id="employee_id" value={formData.employee_id} onChange={onChange} className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="occupation" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Occupation</Label>
              <Input id="occupation" value={formData.occupation} onChange={onChange} className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Address</Label>
              <Input id="address" value={formData.address} onChange={onChange} className="rounded-sm bg-muted/10" />
            </div>

            <div className="grid gap-2 md:col-span-2 pt-2 pb-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-sm bg-muted/5 hover:bg-muted/10 transition-colors">
                <input id="medical_claim" type="checkbox" checked={formData.medical_claim} onChange={onChange} className="w-4 h-4 accent-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-widest">Medical Claim Associated</span>
                  <span className="text-xs text-muted-foreground">Flag this patient if an external claim process exists.</span>
                </div>
              </label>
            </div>
          </form>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
          <Button form="registry-form" type="submit" className="w-full font-bold uppercase tracking-widest rounded-sm">Commit Registry Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewPatientModal;
