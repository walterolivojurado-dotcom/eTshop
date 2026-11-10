"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // "HH:MM" in 24h format
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = ["00", "15", "30", "45"];
const PERIODS = ["AM", "PM"] as const;

function to12h(time24: string): { hour: number; minute: string; period: "AM" | "PM" } {
  const [h, m] = time24.split(":").map(Number);
  const period: "AM" | "PM" = h < 12 ? "AM" : "PM";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour, minute: String(m).padStart(2, "0"), period };
}

function to24h(hour: number, minute: string, period: "AM" | "PM"): string {
  let h = hour % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

export function TimePicker({ value, onChange, className, label }: TimePickerProps) {
  const { hour: initHour, minute: initMinute, period: initPeriod } = to12h(value || "08:00");
  const [selectedHour, setSelectedHour] = useState(initHour);
  const [selectedMinute, setSelectedMinute] = useState(initMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(initPeriod);
  const [open, setOpen] = useState(false);

  const hourRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const minuteRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleConfirm = () => {
    const rounded = MINUTES.reduce((prev, curr) => {
      return Math.abs(Number(curr) - Number(selectedMinute)) <
        Math.abs(Number(prev) - Number(selectedMinute))
        ? curr
        : prev;
    }, "00");
    onChange(to24h(selectedHour, rounded, selectedPeriod));
    setOpen(false);
  };

  const displayValue = (() => {
    const rounded = MINUTES.reduce((prev, curr) => {
      return Math.abs(Number(curr) - Number(selectedMinute)) <
        Math.abs(Number(prev) - Number(selectedMinute))
        ? curr
        : prev;
    }, "00");
    return `${selectedHour}:${rounded} ${selectedPeriod}`;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-14 border-2 border-border/50 bg-background/50 font-medium rounded-2xl w-40 transition-all flex items-center gap-2 px-4 hover:border-primary",
            open && "border-primary",
            className
          )}
        >
          <Clock className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          <span>{value ? displayValue : "Seleccionar"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-2 border-border/50"
        align="start"
      >
        <div className="bg-primary/5 px-6 py-4 border-b border-border/30">
          <p className="text-[11px] font-medium text-muted-foreground">
            {label || "Seleccionar hora"}
          </p>
          <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
            {selectedHour}:{selectedMinute} {selectedPeriod}
          </p>
        </div>

        <div className="flex gap-0 divide-x divide-border/30">
          {/* Hours Column */}
          <div className="flex flex-col h-56 overflow-y-auto no-scrollbar py-2 w-16">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-center text-muted-foreground/50 mb-2 px-2">H</p>
            {HOURS.map((h, idx) => (
              <button
                key={h}
                ref={(el) => { hourRefs.current[idx] = el; }}
                type="button"
                onClick={() => setSelectedHour(h)}
                className={cn(
                  "h-10 w-full text-sm transition-all px-2 shrink-0",
                  selectedHour === h
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted/50 text-foreground font-normal"
                )}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Minutes Column */}
          <div className="flex flex-col h-56 overflow-y-auto no-scrollbar py-2 w-16">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-center text-muted-foreground/50 mb-2 px-2">MIN</p>
            {MINUTES.map((m, idx) => (
              <button
                key={m}
                ref={(el) => { minuteRefs.current[idx] = el; }}
                type="button"
                onClick={() => setSelectedMinute(m)}
                className={cn(
                  "h-10 w-full text-sm transition-all px-2 shrink-0",
                  selectedMinute === m
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted/50 text-foreground font-normal"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* AM/PM Column */}
          <div className="flex flex-col justify-center gap-2 h-56 py-2 px-3 w-16">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-center text-muted-foreground/50 mb-2">PER</p>
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPeriod(p)}
                className={cn(
                  "h-10 w-full rounded-xl text-xs transition-all",
                  selectedPeriod === p
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted/50 text-foreground font-normal"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-border/30 bg-background">
          <Button
            type="button"
            onClick={handleConfirm}
            className="w-full h-10 rounded-xl font-semibold text-xs gap-2"
          >
            <Check className="h-4 w-4" />
            Confirmar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
