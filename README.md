# MemoCare

MemoCare is a caregiving application designed to assist families, caregivers, and patients in managing memory care and cognitive health. This project is built using [Expo](https://expo.dev) and leverages file-based routing for a modular and scalable architecture.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Folder Structure](#folder-structure)
3. [Getting Started](#getting-started)
4. [Development Workflow](#development-workflow)
5. [Scripts](#scripts)
6. [Learn More](#learn-more)
7. [Contributing](#contributing)

---

## Project Overview

MemoCare is designed to provide tools and resources for:

- **Caregivers**: Manage patient care plans and track progress.
- **Families**: Stay informed about the patient’s cognitive health.
- **Patients**: Memory vault for reminders, Access memory exercises and cognitive tools.

This project uses [Expo](https://expo.dev) for cross-platform development, enabling seamless deployment on Android, iOS, and the web.

---

## Folder Structure

The project is organized into the following directories:

### **Root Directory**
- **`README.md`**: Documentation for the project.
- **`package.json`**: Contains project dependencies and scripts.
- **`node_modules/`**: Installed dependencies.

### **`src/`**
Contains reusable components, hooks, services, and utilities.

```
src/
├── components/       # Reusable UI components
│   └── readme.md
├── hooks/            # Custom React hooks
│   └── readme.md
├── services/         # API calls and backend integrations
│   └── readme.md
├── utils/            # Helper functions and utilities
│   └── readme.md
```

### **`app/`**
Contains the main application logic and file-based routing.

```
app/
├── _layout.tsx       # Root layout for the app
├── index.tsx         # Entry point for the app
├── auth/             # Authentication screens
│   └── login.tsx
├── caregiver/        # Caregiver-specific screens
│   └── readme.md
├── family/           # Family-specific screens
│   └── readme.md
├── onboarding/       # Onboarding screens for new users
│   └── readme.md
├── patient/          # Patient-specific screens
│   ├── cognitive/    # Cognitive health tools
│   │   └── readme.md
│   ├── memory/       # Memory exercises and tools
│   │   └── readme.md
```

---

## Getting Started

Follow these steps to set up the project locally:

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MemoCare
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the App
```bash
npx expo start
```

You can then choose to open the app in:

- A **development build**
- An **Android emulator**
- An **iOS simulator**
- [Expo Go](https://expo.dev/go)

---

## Development Workflow

### File-Based Routing
This project uses [file-based routing](https://docs.expo.dev/router/introduction). Each file in the `app/` directory corresponds to a route in the app. For example:

- `app/index.tsx` → `/`
- `app/auth/login.tsx` → `/auth/login`

### Adding New Features
1. Create a new file in the appropriate directory under `app/`.
2. Define the component and export it.
3. The new route will automatically be available in the app.

### Resetting the Project
To start fresh, run:
```bash
npm run reset-project
```
This will move the starter code to the `app-example` directory and create a blank `app/` directory.

---

## Scripts

Here are the available scripts for development:

- **`npm install`**: Installs dependencies.
- **`npx expo start`**: Starts the development server.
- **`npm run reset-project`**: Resets the project to a blank state.

---

## Learn More

To learn more about the tools and frameworks used in this project, check out the following resources:

- [Expo Documentation](https://docs.expo.dev/): Learn about Expo and its features.
- [React Documentation](https://reactjs.org/): Understand the fundamentals of React.
- [File-Based Routing](https://docs.expo.dev/router/introduction): Learn how routing works in this project.

---

## Contributing

We welcome contributions from the team! To contribute:

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and commit them:
   ```bash
   git commit -m "Add your message here"
   ```
3. Push your branch and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Always use frontend/backend in the branch name according to your changes to ensure that the changes are identifiable



---


Happy coding! 🚀