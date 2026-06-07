import { Link } from "wouter";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-footer-home">
            <div className="bg-primary p-1 rounded-md">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">GreenAI</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            The intelligent way to manage and maintain your outdoor spaces. Instant quotes, perfect lawns.
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">Services</h3>
          <ul className="space-y-2">
            <li><Link href="/services" className="text-sm text-muted-foreground hover:text-primary">Lawn Mowing</Link></li>
            <li><Link href="/services" className="text-sm text-muted-foreground hover:text-primary">Fertilization</Link></li>
            <li><Link href="/services" className="text-sm text-muted-foreground hover:text-primary">Weed Control</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Company</h3>
          <ul className="space-y-2">
            <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary">About Us</Link></li>
            <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary">Contact</Link></li>
            <li><Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">Contractor Portal</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Legal</h3>
          <ul className="space-y-2">
            <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link></li>
            <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} GreenAI Lawn Care. All rights reserved.
      </div>
    </footer>
  );
}
