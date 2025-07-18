import { Button } from "./button";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <Button
      asChild
      variant="outline"
      className="absolute -top-10 left-4 z-50 transform -translate-y-full focus:translate-y-0 transition-transform duration-200 bg-white border-2 border-primary text-primary font-medium px-4 py-2 rounded-md shadow-lg"
    >
      <a href={href} className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        {children}
      </a>
    </Button>
  );
}