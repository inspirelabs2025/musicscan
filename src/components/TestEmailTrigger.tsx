import { Button } from "@/components/ui/button";
import { testEmailNotification } from "@/utils/testEmailNotification";
import { toast } from "sonner";
import { useState } from "react";

export const TestEmailTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestEmail = async () => {
    setIsLoading(true);
    try {
      await testEmailNotification();
      toast.success("Test email verstuurd naar rogiervisser76@gmail.com!");
    } catch (error) {
      console.error("Test email error:", error);
      toast.error("Fout bij versturen test email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">🧪 Test Email Notification</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Test de wekelijkse discussie email notificatie door een test email te versturen naar rogiervisser76@gmail.com
      </p>
      <Button 
        onClick={handleTestEmail} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Versturen..." : "📧 Verstuur Test Email"}
      </Button>
    </div>
  );
};