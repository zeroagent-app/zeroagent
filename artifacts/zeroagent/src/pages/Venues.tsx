import { useState } from "react";
import { useListVenues } from "@workspace/api-client-react";
import VenueCard from "@/components/VenueCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

const EVENT_TYPES = ["Wedding", "Mehndi", "Valima", "Engagement", "Birthday Party", "Corporate Event", "Conference", "Gala Dinner"];
const AREAS = [
  "Korangi No. 2½",
  "Korangi No. 4",
  "Korangi No. 5",
  "Korangi No. 6",
  "Sector 32",
  "Sector 33",
  "Sector 36",
  "Sector 37",
  "Sector 38",
  "Sector 39",
  "Sector 40",
  "Sector 41",
  "Sector 42",
  "Sector 43",
  "Sector 44",
  "Sector 45",
  "Sector 46",
  "Sector 47",
  "Sector 48",
  "Sector 49",
  "Sector 50",
  "Sector 51",
  "Landhi No. 01",
  "Landhi No. 02",
  "Landhi No. 03",
  "Landhi No. 04",
  "Landhi No. 05",
  "Landhi No. 06",
];

export default function Venues() {
  const [area, setArea] = useState("");
  const [eventType, setEventType] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListVenues({
    city: "Karachi",
    area: area || undefined,
    eventType: eventType || undefined,
    minCapacity: minCapacity ? parseInt(minCapacity) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    page,
    limit: 12,
  });
  const result = data as any;
  const venues = result?.venues ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  const clearFilters = () => { setArea(""); setEventType(""); setMinCapacity(""); setMaxPrice(""); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Korangi Event Spaces</h1>
        <p className="text-muted-foreground">Browse venues in Korangi, Landhi, and nearby Karachi sub-divisions</p>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4 mb-8 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <Label className="text-xs text-muted-foreground mb-1 block">Area / Sub-division</Label>
            <Select value={area} onValueChange={v => { setArea(v === "__all__" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All Korangi areas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Korangi areas</SelectItem>
                {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-48">
            <Label className="text-xs text-muted-foreground mb-1 block">Event Type</Label>
            <Select value={eventType} onValueChange={v => { setEventType(v === "__all__" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-36">
            <Label className="text-xs text-muted-foreground mb-1 block">Min Capacity</Label>
            <Input className="h-9" placeholder="e.g. 500" value={minCapacity} onChange={e => { setMinCapacity(e.target.value); setPage(1); }} type="number" />
          </div>
          <div className="flex-1 min-w-36">
            <Label className="text-xs text-muted-foreground mb-1 block">Max Price (PKR)</Label>
            <Input className="h-9" placeholder="e.g. 300000" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }} type="number" />
          </div>
          {(area || eventType || minCapacity || maxPrice) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground hover:text-destructive">
              <X size={14} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {isLoading ? "Loading..." : `${total} venue${total !== 1 ? "s" : ""} found`}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No venues found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue: any) => <VenueCard key={venue.id} venue={venue} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Previous</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
