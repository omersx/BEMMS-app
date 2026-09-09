import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">404</h1>
          <h2 className="text-lg font-semibold">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The requested page does not exist or has been moved.
          </p>
          <div className="pt-2">
            <Button asChild className="min-h-[44px]">
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
