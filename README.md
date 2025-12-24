# Lead Generation Web App

🚀 A comprehensive lead generation tool for discovering and enriching business leads across California and beyond.

## Features

### 🎯 Core Functionality
- **Multi-Source Data Collection**: Google Maps API, Google Search scraping, Yelp scraping, Yellow Pages scraping
- **Smart Duplicate Detection**: Automatically removes duplicate businesses across data sources
- **Rich Data Enrichment**: Extracts emails, phone numbers, owner names, social media handles, ratings, and reviews
- **Flexible Business Types**: Search for any business type (med spas, pharmacies, restaurants, retail, services, etc.)

### 📧 AI-Powered Outreach
- **Custom Email Templates**: Create and manage email templates with variable substitution
- **AI-Generated Emails**: Optionally generate personalized outreach emails using AI
- **Template Variables**: {businessName}, {ownerName}, {category}, {city}, {website}
- **3 Default Templates**: General Outreach, Service Provider, Partnership Proposal

### 🔍 Advanced Scraping
- **Enhanced Email Extraction**: ~70% email discovery rate (up to 8 emails per business)
- **Social Media Detection**: Extracts Facebook, LinkedIn, Instagram, and Twitter handles
- **Multi-Page Scraping**: Scans 12+ page types (About, Team, Contact, Leadership, etc.)
- **Improved Owner Name Extraction**: Finds 2-3 owner names per business on average

### 💾 Export Options
- **CSV Export**: Download leads with all data fields
- **Excel Export**: Enhanced formatting with 17 columns including social media
- **Copy to Clipboard**: Quick copy functionality for individual fields

### 🎨 User Experience
- **Real-Time Progress**: Live updates during lead generation
- **Dark Mode**: Toggle between light and dark themes
- **Mobile Responsive**: Optimized for all screen sizes
- **Search & Filter**: Filter leads by category and search by name
- **Pagination**: Easy navigation through large result sets

## Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- PostgreSQL database
- Google Maps API key (recommended for best results)
- Abacus AI API key (for AI-powered outreach emails)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd lead_gen_webapp/nextjs_space
```

2. **Install dependencies**
```bash
yarn install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- `GOOGLE_MAPS_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
- `DATABASE_URL`: Your PostgreSQL connection string
- `ABACUSAI_API_KEY`: Your Abacus AI API key

4. **Set up the database**
```bash
yarn prisma generate
yarn prisma db push
```

5. **Run the development server**
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Lead Generation

1. **Select Data Source**: Choose between Google Maps API (recommended), Google Search, Yelp, Yellow Pages, or Multi-Source
2. **Enter Cities**: Add California cities (e.g., Los Angeles, San Francisco, San Diego)
3. **Select Business Types**: Choose from 27 suggestions or enter custom types
4. **Configure Outreach** (Optional):
   - Enable "Generate AI Outreach Emails"
   - Select or create a custom email template
5. **Generate Leads**: Click "Generate Leads" and monitor real-time progress
6. **Review Results**: View, filter, search, and export your leads

### Creating Custom Templates

1. Click "Manage Templates" in the form
2. Click "+ New Template"
3. Enter template name and body with variables:
   - `{businessName}`: Business name
   - `{ownerName}`: Owner's name
   - `{category}`: Business category
   - `{city}`: City location
   - `{website}`: Business website
4. Save and select the template for lead generation

### Exporting Data

- **CSV**: Click "Download CSV" for standard CSV format
- **Excel**: Click "Export to Excel" for formatted XLSX with all columns
- **Copy**: Use copy buttons on individual lead cards

## Data Fields

Each lead includes up to 17 fields:
- Business Name
- Category
- Address
- City
- State
- Phone
- Website
- Emails (up to 8)
- Owner Names (up to 3)
- Rating
- Review Count
- Facebook URL
- LinkedIn URL
- Instagram URL
- Twitter URL
- Source (which data source found the lead)
- AI Outreach Email (if enabled)

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Abacus AI API for email generation
- **APIs**: Google Maps Places API
- **Export**: xlsx library for Excel, native CSV

## Project Structure

```
nextjs_space/
├── app/
│   ├── api/              # API routes
│   │   ├── generate-leads/
│   │   ├── jobs/
│   │   └── export-csv/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/
│   ├── lead-generation-form.tsx
│   ├── results-display-enhanced.tsx
│   ├── template-manager.tsx
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── db.ts             # Database client
│   ├── scraper.ts        # Web scraping utilities
│   ├── google-maps.ts    # Google Maps API
│   ├── google-search-scraper.ts
│   ├── yelp-scraper.ts
│   ├── yellowpages-scraper.ts
│   ├── email-templates.ts
│   └── types.ts          # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Performance & Rate Limiting

- **Scraping Delay**: 2.5 seconds between requests
- **Robots.txt**: Respects website scraping policies
- **Google Maps API**: Rate-limited to avoid quota exhaustion
- **Async Processing**: Background job processing for large batches

## Best Practices

1. **Use Google Maps API**: Provides the most reliable and comprehensive data
2. **Start Small**: Test with 2-3 cities before scaling up
3. **Disable AI Outreach**: If you don't need custom emails, disable to save credits
4. **Multi-Source Mode**: Use for maximum coverage and duplicate detection
5. **Custom Templates**: Create templates for different outreach scenarios

## Troubleshooting

### No Results from Free Scrapers
- Google, Yelp, and Yellow Pages have anti-bot protections
- Use Google Maps API for reliable results
- Multi-Source mode provides best coverage

### Email Discovery Rate Low
- Some businesses don't list emails publicly
- Try different data sources
- Check website scraping is working properly

### Slow Performance
- Scraping is intentionally polite (2.5s delay)
- Use Google Maps API for faster results
- Consider smaller batches for initial testing

## License

MIT License - feel free to use and modify for your projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, TypeScript, and Abacus AI**