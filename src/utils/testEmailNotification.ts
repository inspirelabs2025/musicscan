import { supabase } from "@/integrations/supabase/client";

export const testEmailNotification = async () => {
  try {
    console.log('🧪 Triggering test email notification...');
    
    const { data, error } = await supabase.functions.invoke('send-weekly-discussion-notification', {
      body: {
        topicId: '371231b8-e925-4e9f-aec3-2d20a36d6593',
        topicTitle: 'De Magie van \'Taxi\': Een Reis door Bryan Ferry\'s Klanken',
        topicDescription: 'Bryan Ferry\'s \'Taxi\' is een album dat vaak onderbelicht blijft in zijn indrukwekkende discografie. Uitgebracht in 1993, markeert het een interessante fase in Ferry\'s carrière...',
        artistName: 'Bryan Ferry',
        albumTitle: 'Taxi',
        testEmail: 'rogiervisser76@gmail.com'
      }
    });

    if (error) {
      console.error('❌ Error sending test email:', error);
      throw error;
    }

    console.log('✅ Test email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    throw error;
  }
};