import * as React from "react";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const DialogCtx = React.createContext<Ctx | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogCtx.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogCtx.Provider>
  );
}

export function DialogContent({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(DialogCtx);
  if (!ctx) throw new Error("DialogContent must be used within Dialog");
  if (!ctx.open) return null;
  return (
    <div className="modal-overlay" onMouseDown={() => ctx.setOpen(false)}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-3">{children}</div>;
}
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}
export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className ?? "mt-4 flex justify-end gap-2"}>{children}</div>;
}
