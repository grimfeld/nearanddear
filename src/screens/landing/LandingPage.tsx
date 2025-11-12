import { Link } from "react-router-dom";
import { MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Collaborative maps",
    description:
      "Invite teammates and friends to curate shared guides with permissions tailored to each member.",
  },
  {
    title: "Rich location profiles",
    description:
      "Save addresses, categories, opening hours and direct Google Maps links to keep context together.",
  },
  {
    title: "Social feedback",
    description:
      "Collect reviews and ratings, surface the best spots, and filter easily by distance or availability.",
  },
];

export const LandingPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/60">
      <header className="border-b border-border/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPinned className="h-5 w-5" /> Near & Dear
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link to="/auth/sign-in" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Button size="sm" asChild>
              <Link to="/auth/sign-up">Create free account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Inspired by nearanddear.grimfeld.tech
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Collaborative maps built for teams discovering places they love.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Near & Dear helps groups create curated guides, leave contextual reviews, and plan outings together. Build shared knowledge, surface trusted recommendations, and keep everything in sync across map and list views.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth/sign-up">Get started</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/auth/sign-in">I already have an account</Link>
              </Button>
            </div>
          </section>

          <section className="space-y-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/60 bg-background/80 shadow-soft">
                <CardContent className="space-y-2 p-6">
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};

