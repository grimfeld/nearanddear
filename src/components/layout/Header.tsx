import { Link, useLocation, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";

export const Header = () => {
  const { profile, user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initials = profile?.display_name
    ?.split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("") ?? user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-6">
          <Link to="/app/dashboard" className="text-lg font-semibold tracking-tight">
            Near & Dear
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link
              to="/app/dashboard"
              className={location.pathname.includes("dashboard") ? "text-foreground" : ""}
            >
              Dashboard
            </Link>
          <Link
            to="/app/discover"
            className={location.pathname.includes("discover") ? "text-foreground" : ""}
          >
            Discover
          </Link>
            <Link
              to="/app/profile"
              className={location.pathname.includes("profile") ? "text-foreground" : ""}
            >
              Profile
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/app/profile")}> 
            My Profile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name ?? "User"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{profile?.display_name ?? "Member"}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/app/dashboard")}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/app/discover")}>Discover</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/app/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => {
                  void signOut();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

