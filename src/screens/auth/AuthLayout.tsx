import { Link } from "react-router-dom";

type AuthLayoutProps = {
  heading: string;
  subheading: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export const AuthLayout = ({ heading, subheading, children, footer }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/40">
      <header className="flex items-center justify-between px-6 py-6">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Mapri
        </Link>
        <Link to="/auth/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border/80 bg-background/90 p-8 shadow-xl backdrop-blur">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h1>
            <p className="text-sm text-muted-foreground">{subheading}</p>
          </div>
          <div className="mt-6 space-y-4">{children}</div>
          <div className="mt-8 text-center text-xs text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
};

