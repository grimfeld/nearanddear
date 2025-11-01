import { NavLink } from "react-router-dom";
import { Compass, Home, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  {
    to: "/app/dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    to: "/app/profile",
    label: "Profile",
    icon: User,
  },
];

export const Sidebar = () => {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-border/80 bg-background/95 px-4 py-6 lg:block">
      <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <Compass className="h-5 w-5" />
        Mapri Collaborative
      </div>
      <div className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn("block", isActive && "text-foreground") }>
            {({ isActive }) => (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

