import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DevErrorDisplayProps {
  error: Error | any;
  componentStack?: string;
  context?: Record<string, any>;
}

export function DevErrorDisplay({ error, componentStack, context }: DevErrorDisplayProps) {
  if (!import.meta.env.DEV) return null;

  return (
    <Alert variant="destructive" className="my-4 max-w-4xl">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-lg font-bold">🔧 خطأ في التطوير (Dev Error)</AlertTitle>
      <AlertDescription className="mt-3 space-y-3">
        <div>
          <strong className="text-destructive-foreground">الرسالة:</strong>
          <pre className="mt-1 text-xs bg-destructive/10 p-3 rounded overflow-auto border border-destructive/20">
            {error?.message || String(error)}
          </pre>
        </div>
        
        {error?.code && (
          <div>
            <strong className="text-destructive-foreground">كود الخطأ:</strong>
            <pre className="mt-1 text-xs bg-destructive/10 p-3 rounded overflow-auto border border-destructive/20">
              {error.code}
            </pre>
          </div>
        )}
        
        {error?.details && (
          <div>
            <strong className="text-destructive-foreground">التفاصيل:</strong>
            <pre className="mt-1 text-xs bg-destructive/10 p-3 rounded overflow-auto border border-destructive/20">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </div>
        )}
        
        {error?.hint && (
          <div>
            <strong className="text-destructive-foreground">تلميح:</strong>
            <pre className="mt-1 text-xs bg-destructive/10 p-3 rounded overflow-auto border border-destructive/20">
              {error.hint}
            </pre>
          </div>
        )}
        
        {context && Object.keys(context).length > 0 && (
          <div>
            <strong className="text-destructive-foreground">السياق (Context):</strong>
            <pre className="mt-1 text-xs bg-destructive/10 p-3 rounded overflow-auto max-h-60 border border-destructive/20">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        )}
        
        {error?.stack && (
          <div>
            <strong className="text-destructive-foreground">Stack Trace:</strong>
            <pre className="mt-1 text-xs bg-destructive/10 p-3 rounded overflow-auto max-h-40 border border-destructive/20">
              {error.stack}
            </pre>
          </div>
        )}
        
        {componentStack && (
          <div>
            <strong className="text-destructive-foreground">Component Stack:</strong>
            <pre className="mt-1 text-xs bg-destructive/10 p-3 rounded overflow-auto max-h-40 border border-destructive/20">
              {componentStack}
            </pre>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
