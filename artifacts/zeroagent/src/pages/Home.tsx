import { useState } from "react";
import { useLocation } from "wouter";
import { useGetFeaturedVenues, useGetVenueStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VenueCard from "@/components/VenueCard";
import { MapPin, Shield, MessageSquare, Star, ChevronRight, Search } from "lucide-react";
import heroBg from "@assets/hero-bg_1775614512861.png";

export default function Home() {
  const [city, setCity] = useState("");
  const [, navigate] = useLocation();
  const { data: featuredData } = useGetFeaturedVenues();
  const { data: statsData } = useGetVenueStats();
  const featured = (featuredData as any[]) ?? [];
  const stats = statsData as any;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/venues${city ? `?city=${encodeURIComponent(city)}` : ""}`);
  };

  return (
    <div>
      <section className="relative min-h-[600px] bg-secondary flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-secondary/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Shield size={14} className="text-primary" />
            <span className="text-secondary-foreground/90 text-sm">Trusted by 10,000+ Verified Users</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-4">
            Find Your Perfect<br />
            <span className="text-primary">Space in Pakistan</span>
          </h1>
          <p className="text-secondary-foreground/70 text-lg max-w-xl mb-10 leading-relaxed">
            ZeroAgent removes the noise. Connect directly with verified owners for premium event venues. Serious inquiries only.
          </p>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Where do you want to go? (e.g. Lahore)"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="pl-9 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15"
              />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-semibold px-8">
              <Search size={16} className="mr-2" /> Search
            </Button>
          </form>
        </div>
      </section>

      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield size={32} className="text-primary mb-1" />
              <h3 className="font-semibold text-foreground">Verified Owners</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Every listing is posted by a verified owner, completely eliminating fake agents and scams.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star size={32} className="text-primary mb-1" />
              <h3 className="font-semibold text-foreground">Quality Guarantee</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Small application fees (PKR 99) filter out non-serious buyers, ensuring high-quality matches.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MessageSquare size={32} className="text-primary mb-1" />
              <h3 className="font-semibold text-foreground">Direct Contact</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Once approved, chat directly with owners through our secure platform to finalize details.</p>
            </div>
          </div>
          {stats && (
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-t border-border pt-10">
              {[
                { label: "Venues Listed", value: stats.totalVenues?.toLocaleString() ?? "0" },
                { label: "Bookings Made", value: stats.totalBookings?.toLocaleString() ?? "0" },
                { label: "Cities Covered", value: stats.totalCities?.toLocaleString() ?? "0" },
                { label: "Registered Users", value: stats.totalUsers?.toLocaleString() ?? "0" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-3xl font-bold text-primary mb-1">{s.value}+</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Featured Event Spaces</h2>
            <p className="text-muted-foreground text-sm mt-1">Discover premium venues for weddings, functions & gatherings</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/venues")} className="text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            View All <ChevronRight size={16} />
          </Button>
        </div>
        {featured.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-72 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((venue: any) => <VenueCard key={venue.id} venue={venue} />)}
          </div>
        )}
      </section>

      <section className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Own a Premium Event Space?</h2>
          <p className="text-white/80 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            List your venue on ZeroAgent and connect only with verified, serious clients. Easy setup, full control.
          </p>
          <Button
            onClick={() => navigate("/register")}
            className="bg-white text-primary hover:bg-white/90 font-semibold px-10 py-3 rounded-full text-base shadow-lg"
          >
            Post a Listing Now
          </Button>
        </div>
      </section>
    </div>
  );
}
