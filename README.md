# Production Manager V2

A comprehensive React Native application for managing production operations, dispatch tracking, and administrative tasks in manufacturing environments.

## 📱 Features

### Core Functionality
- **Home Dashboard** - Central hub with quick access to all features
- **Dispatch Management** - Track and manage product dispatches
- **Requirements Management** - Add, edit, and complete production requirements
- **Administrative Controls** - Admin-only features for system management
- **Password Protection** - Secure access to sensitive features

### Specialized Screens
- **DPR (Daily Production Report)** - Track daily production metrics
- **Moisture Correction** - Calculate and apply moisture corrections
- **TM Weightment** - Handle TM (Total Moisture) weightment calculations
- **Miller Reports** - Generate and view miller-specific reports
- **History Tracking** - View dispatch and production history
- **Totals Overview** - Summary of production totals

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase Firestore
- **Authentication**: Custom password-based system
- **Navigation**: React Navigation
- **Platform**: Android (with iOS support possible)

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- React Native development environment
- Android Studio (for Android development)
- Expo CLI (optional, for Expo workflow)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/infernooo/Production_Manager.git
   cd Production_Manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Download your `serviceAccountKey.json` file
   - Place it in the project root (it's already in .gitignore)
   - Update `firebase.js` with your Firebase configuration

4. **Configure the app**
   - Update `app.json` with your app-specific configuration
   - Modify `firebase.js` with your Firebase project details

## 🏃‍♂️ Running the App

### Development Mode
```bash
# Start the Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (if configured)
npm run ios
```

### Build for Production
```bash
# Build Android APK
npm run build:android

# Build Android Bundle
npm run build:android-bundle
```

## 📁 Project Structure

```
ProductionManagerV2/
├── screens/
│   ├── HomeScreen.js              # Main dashboard
│   ├── DispatchScreen.js          # Dispatch management
│   ├── AdminScreen.js             # Administrative features
│   ├── AddRequirementScreen.js    # Add new requirements
│   ├── EditRequirementScreen.js   # Edit existing requirements
│   ├── CompletedRequirementsScreen.js # View completed items
│   ├── DprScreen.js               # Daily Production Report
│   ├── MoistureCorrectionScreen.js # Moisture calculations
│   ├── TmWeightmentScreen.js      # TM weightment handling
│   ├── MillerReportScreen.js      # Miller-specific reports
│   ├── HistoryScreen.js           # Historical data
│   ├── DispatchHistoryScreen.js   # Dispatch history
│   ├── DispatchSummaryScreen.js   # Dispatch summaries
│   ├── TotalsScreen.js            # Production totals
│   └── PasswordScreen.js          # Authentication
├── assets/                        # Images and static files
├── android/                       # Android-specific code
├── firebase.js                    # Firebase configuration
├── import.js                      # Data import utilities
├── tm_recipes.json                # TM recipes data
├── App.js                         # Main app component
└── package.json                   # Dependencies and scripts
```

## 🔧 Configuration

### Firebase Setup
1. Replace the Firebase configuration in `firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  // ... other config
};
```

### App Configuration
Update `app.json` with your app details:
```json
{
  "expo": {
    "name": "Your Production Manager",
    "slug": "your-production-manager",
    "version": "1.0.0"
  }
}
```

## 📊 Data Models

### Requirements
- ID, description, quantity, status, timestamps
- Categories: pending, completed, dispatched

### Dispatch Records
- Dispatch details, quantities, destinations
- Tracking information and timestamps

### Production Reports
- Daily metrics, moisture levels, weights
- Miller-specific data and calculations

## 🔒 Security

- **Firebase Rules**: Ensure proper Firestore security rules
- **API Keys**: Keep Firebase configuration secure
- **Password Protection**: Admin features are password-protected
- **Data Validation**: Input validation on all forms

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run linting
npm run lint
```

## 📱 Supported Platforms

- ✅ Android
- ⚠️ iOS (needs configuration)
- 🚫 Web (React Native app)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Ensure Firebase project is properly configured
- Android build requires proper signing configuration
- Some features may require specific permissions

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: sahasoham905@gmail.com

## 🏗️ Roadmap

- [ ] iOS platform support
- [ ] Real-time notifications
- [ ] Advanced reporting features
- [ ] Export functionality
- [ ] Multi-language support
- [ ] Offline mode capabilities

## 🙏 Acknowledgments

- React Native community
- Firebase team
- Expo team
- Contributors and testers

---

**Built with ❤️ for efficient production management**
