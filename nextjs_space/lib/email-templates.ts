export function generateOutreachEmail(
  businessName: string,
  category: string,
  ownerNames: string[],
  website?: string
): string {
  const ownerName = ownerNames?.[0] || 'there';
  const greeting = ownerName !== 'there' ? `Hi ${ownerName.split(' ')[0]}` : 'Hello';

  if (category.toLowerCase().includes('med spa') || category.toLowerCase().includes('medical spa')) {
    return `${greeting},

I came across ${businessName}${website ? ` (${website})` : ''} and was impressed by your approach to aesthetic treatments.

I specialize in helping med spas like yours increase client bookings and retention through targeted digital marketing strategies. Many of our clients have seen 30-40% increases in monthly appointments.

Would you be open to a brief conversation about how we could help ${businessName} grow?

Best regards,
[Your Name]
[Your Company]
[Your Contact Info]`;
  } else {
    // Pharmacy template
    return `${greeting},

I noticed ${businessName}${website ? ` (${website})` : ''} serves the local community with pharmacy services.

We work with independent pharmacies to help them compete with large chains through improved patient engagement, automated prescription reminders, and online ordering systems.

Our clients typically see improved patient retention and higher prescription fill rates within the first 90 days.

Would you be interested in learning more about how we can support ${businessName}?

Best regards,
[Your Name]
[Your Company]
[Your Contact Info]`;
  }
}
