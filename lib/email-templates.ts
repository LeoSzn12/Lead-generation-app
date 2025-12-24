interface EmailTemplateData {
  subject?: string;
  body?: string;
}

export function generateOutreachEmail(
  businessName: string,
  category: string,
  ownerNames: string[],
  website?: string,
  city?: string,
  customTemplate?: EmailTemplateData
): string {
  const ownerName = ownerNames?.[0] || 'there';
  const firstName = ownerName !== 'there' ? ownerName.split(' ')[0] : 'there';
  
  // If custom template provided, use it with variable substitution
  if (customTemplate?.body) {
    return substituteVariables(customTemplate.body, {
      businessName,
      category,
      ownerName,
      firstName,
      website: website || '',
      city: city || '',
    });
  }
  
  // Default templates
  const greeting = ownerName !== 'there' ? `Hi ${firstName}` : 'Hello';

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
    // Generic business template
    return `${greeting},

I noticed ${businessName}${website ? ` (${website})` : ''} and wanted to reach out.

We specialize in helping ${category} businesses like yours grow through [your service/product]. Many of our clients in the ${category} industry have seen significant improvements.

Would you be interested in learning more about how we can support ${businessName}?

Best regards,
[Your Name]
[Your Company]
[Your Contact Info]`;
  }
}

function substituteVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  
  // Replace all template variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
}
