import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface Props {
  label: string;
  options: (string | number)[];
  value: (string | number)[];
  onChange: (v: (string | number)[]) => void;
}

export function MultiSelect({ label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = (o: string | number) => {
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  };
  const display = value.length === 0 ? "All" : value.length <= 2 ? value.join(", ") : `${value.length} selected`;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 min-w-[140px] justify-between font-normal">
            <span className="truncate text-foreground">{display}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} className="h-9" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const sel = value.includes(o);
                  return (
                    <CommandItem key={String(o)} onSelect={() => toggle(o)} className="cursor-pointer">
                      <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${sel ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                        {sel && <Check className="h-3 w-3" />}
                      </div>
                      {String(o)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}