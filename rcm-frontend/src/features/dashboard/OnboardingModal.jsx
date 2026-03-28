import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const OnboardingModal = ({ isOpen, formData, onChange, onSubmit }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent 
        className="sm:max-w-xl p-0 overflow-hidden border-2 border-foreground" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-foreground text-background">
          <DialogTitle className="uppercase tracking-[0.2em] font-black text-lg">Institutional Onboarding</DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
            Please define your hospital profile to enable RCM workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 bg-background">
          <form id="onboarding-form" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest">Full Hospital Name *</Label>
              <Input id="name" value={formData.name} onChange={onChange} required className="rounded-none border-foreground focus-visible:ring-0" placeholder="e.g. St. Marys Speciality" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest">Physical Address *</Label>
              <Input id="location" value={formData.location} onChange={onChange} required className="rounded-none border-foreground focus-visible:ring-0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_id" className="text-[10px] font-black uppercase tracking-widest">Official Email</Label>
              <Input id="email_id" type="email" value={formData.email_id} onChange={onChange} className="rounded-none border-foreground focus-visible:ring-0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rohini_id" className="text-[10px] font-black uppercase tracking-widest">ROHINI Id</Label>
              <Input id="rohini_id" value={formData.rohini_id} onChange={onChange} className="rounded-none border-foreground focus-visible:ring-0" />
            </div>
          </form>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/20">
          <Button form="onboarding-form" type="submit" className="w-full rounded-none font-black uppercase tracking-[0.2em] h-12">
            Initialize Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
