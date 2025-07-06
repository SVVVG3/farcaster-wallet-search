# Farcaster Wallet Search

A powerful Next.js application for searching Farcaster profiles by wallet addresses or usernames, with integrated Bankr wallet data. Built as a mobile-first mini app for the Farcaster ecosystem.

## 🚀 Features

- **Flexible Search**: Search by Ethereum addresses, Solana addresses, or Farcaster usernames
- **Batch Processing**: Search multiple addresses/usernames simultaneously
- **Comprehensive Profile Data**: Display complete Farcaster profiles with:
  - Profile information (avatar, bio, follower counts)
  - Verified wallet addresses (Ethereum & Solana)
  - Connected social accounts
  - Power badge status
  - Bankr Club membership
- **Bankr Integration**: Enhanced wallet data from both Farcaster and Twitter platforms
- **Mobile-Optimized**: Responsive design optimized for mobile mini app usage
- **Real-time Validation**: Instant input validation with visual feedback
- **Copy-to-Clipboard**: Easy copying of wallet addresses with toast notifications
- **Dark Mode Support**: Full dark/light mode theming

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **APIs**: 
  - Neynar API (Farcaster data)
  - Bankr API (wallet data)
- **Validation**: Custom address and username validation
- **UI Components**: Custom responsive components

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/farcaster-wallet-search.git
cd farcaster-wallet-search
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```bash
NEYNAR_API_KEY=your_neynar_api_key_here
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEYNAR_API_KEY` | Your Neynar API key for Farcaster data | Yes |

## 🎯 Usage

### Search by Wallet Address
```
0x1234567890abcdef1234567890abcdef12345678
```

### Search by Farcaster Username
```
dwr.eth
vitalik.eth
```

### Mixed Search
You can search multiple items of different types:
```
0x1234567890abcdef1234567890abcdef12345678
dwr.eth
vitalik.eth
```

## 🔗 API Endpoints

### POST /api/search
Search for Farcaster profiles by addresses or usernames.

**Request Body:**
```json
{
  "inputs": ["0x...", "username.eth", "another-username"]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "users": [...],
    "searchedAddresses": [...],
    "notFoundAddresses": [...]
  }
}
```

### GET /api/search
Get API documentation and usage information.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/search/route.ts     # API endpoints
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── components/
│   ├── AddressInput.tsx        # Input component with validation
│   └── ProfileDisplay.tsx      # Profile display component
└── lib/
    ├── bankr.ts                # Bankr API integration
    ├── neynar.ts               # Neynar API integration
    └── validation.ts           # Input validation utilities
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add your environment variables
   - Deploy!

3. **Set Environment Variables**
   - Go to your Vercel project settings
   - Add `NEYNAR_API_KEY` in the Environment Variables section

### Deploy to Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Adding New Features

1. **API Integration**: Add new API integrations in `src/lib/`
2. **Components**: Create reusable components in `src/components/`
3. **Validation**: Extend validation logic in `src/lib/validation.ts`
4. **Styling**: Use Tailwind CSS classes for consistent styling

## 📱 Mobile App Usage

This application is optimized for use as a Farcaster mini app:
- Touch-friendly interface with proper tap targets
- Responsive design that works on all screen sizes
- Fast loading and efficient API calls
- Copy-to-clipboard functionality with visual feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Neynar](https://neynar.com) for the Farcaster API
- [Bankr](https://bankr.bot) for wallet data integration
- [Farcaster](https://farcaster.xyz) for the decentralized social protocol
- [Next.js](https://nextjs.org) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com) for the styling system

## 🐛 Bug Reports & Feature Requests

Please use the [GitHub Issues](https://github.com/yourusername/farcaster-wallet-search/issues) page to report bugs or request features.

---

**Built with ❤️ for the Farcaster community**
