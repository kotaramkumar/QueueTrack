# Queue Track 📋

A React Native mobile app built with Expo for digital queue management at **restaurants** and **hospitals**. Receptionists can add customers to a live queue and send them an SMS with their queue details. Customers can track their position in real time.

---

## Screenshots

| Welcome | Role Select | Dashboard | Queue List |
|---|---|---|---|
| Select business type | Choose your role | Live queue stats | Manage all entries |

---

## Features

### 🍽 Restaurant Mode
- Auto-assign queue numbers (R001, R002…)
- Track available seats
- Send SMS confirmation to customers
- Call next / mark served
- Live customer tracking by queue number or phone

### 🏥 Hospital Mode
- Auto-assign patient queue numbers (H001, H002…)
- Assign patients to specific doctors
- Toggle doctor availability in real time
- Send SMS with doctor assignment details
- Live patient tracking by queue number or phone

### 👩‍💼 Receptionist Features
- Dashboard with live stats (waiting, served, avg wait)
- Add customers/patients with one form
- Call next or call a specific customer
- Mark as served
- Delete entries directly from queue list
- Filter queue by status (All / Waiting / Called / Served)
- Settings: business name, avg wait time, seat count, doctor availability

### 🙋 Customer / Patient Features
- Search by queue number or registered phone number
- Live position, estimated wait time, and availability stats
- Status updates automatically (no need to refresh)
- See who is ahead in the queue

---

## Tech Stack

| Technology | Details |
|---|---|
| Framework | React Native |
| Platform | Expo SDK 54 |
| Navigation | React Navigation v7 (Native Stack + Bottom Tabs) |
| State Management | React Context + useReducer |
| Persistence | AsyncStorage |
| SMS | expo-sms |
| Testing | Expo Go |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Expo Go](https://expo.dev/client) app on your phone

### Installation

```bash
# Clone the repo
git clone https://github.com/kotaramkumar/QueueTrack.git
cd QueueTrack

# Install dependencies
npm install

# Start the dev server
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

---

## Project Structure

```
QueueTrack/
├── App.js                          # Entry point
├── app.json                        # Expo config
├── src/
│   ├── context/
│   │   └── QueueContext.js         # Global state (useReducer + AsyncStorage)
│   ├── navigation/
│   │   └── index.js                # Stack + Tab navigation
│   ├── screens/
│   │   ├── WelcomeScreen.js        # Select Restaurant or Hospital
│   │   ├── RoleSelectScreen.js     # Select Receptionist or Customer
│   │   ├── receptionist/
│   │   │   ├── DashboardScreen.js  # Stats, Call Next, queue preview
│   │   │   ├── AddToQueueScreen.js # Add customer + send SMS
│   │   │   ├── QueueListScreen.js  # Full queue list with filters
│   │   │   └── SettingsScreen.js   # Business settings & doctor toggles
│   │   └── customer/
│   │       └── TrackingScreen.js   # Live queue status tracker
│   └── utils/
│       └── helpers.js              # Formatters, SMS body builder
```

---

## App Flow

```
Welcome
  ├── Restaurant → Role Select
  │     ├── Receptionist → Dashboard (tabs: Dashboard / Queue / Settings)
  │     │                      └── Add to Queue
  │     └── Customer → Tracking Screen
  └── Hospital → Role Select
        ├── Receptionist → Dashboard (tabs: Dashboard / Queue / Settings)
        │                      └── Add to Queue (with doctor selection)
        └── Customer → Tracking Screen
```

---

## Queue Number Format

| Mode | Format | Example |
|---|---|---|
| Restaurant | `R` + 3-digit number | R001, R002… |
| Hospital | `H` + 3-digit number | H001, H002… |

---

## License

MIT
