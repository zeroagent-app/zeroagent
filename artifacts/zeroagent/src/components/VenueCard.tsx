import { Link } from "wouter";
import { MapPin, Users, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Venue {
  id: number;
  name: string;
  description: string;
  city: string;
  area?: string;
  capacity: number;
  pricePerDay: number;
  eventTypes: string[];
  images: string[];
  videos?: string[];
  status: string;
}

export default function VenueCard({ venue }: { venue: Venue }) {
  const image = venue.images[0] || "https://images.unsplash.com/photo-1519167758452-f4d76ab8d6f8?w=800";
  return (
    <Link href={`/venues/${venue.id}`}>
      <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
        <div className="relative h-52 overflow-hidden">
          <img
            src={image}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1519167758452-f4d76ab8d6f8?w=800"; }}
          />
          <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
            {venue.eventTypes.slice(0, 2).map(type => (
              <Badge key={type} className="bg-primary/90 text-white text-xs border-none">{type}</Badge>
            ))}
          </div>
          {venue.videos?.length ? (
            <div className="absolute top-3 right-3 rounded-full bg-black/60 text-white px-2 py-1 text-xs flex items-center gap-1">
              <PlayCircle size={12} /> Video
            </div>
          ) : null}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-base text-card-foreground mb-1 truncate group-hover:text-primary transition-colors">{venue.name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{venue.description}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin size={13} className="text-primary" />{venue.city}{venue.area ? ` · ${venue.area}` : ""}</span>
            <span className="flex items-center gap-1"><Users size={13} className="text-primary" />up to {venue.capacity.toLocaleString()}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Starting from</span>
            <span className="font-bold text-primary">PKR {(venue.pricePerDay).toLocaleString()}/day</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
