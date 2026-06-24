# Project Structure

## Directory Organization

```
InterChain/
├── backend/           # FastAPI backend server
│   ├── app/
│   │   ├── core/      # Core configurations and utilities
│   │   ├── db/        # Database models and connection
│   │   ├── routers/   # API route handlers
│   │   ├── schemas/   # Pydantic data models
│   │   ├── services/  # Business logic layer
│   │   ├── utils/     # Helper functions
│   │   ├── deps.py    # Dependency injection
│   │   └── main.py    # FastAPI application initialization
│   ├── data/          # Fallback data storage
│   └── requirements.txt
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── api/       # API client functions
│   │   ├── components/ # Reusable UI components
│   │   ├── context/   # React context providers
│   │   ├── data/      # Static data and constants
│   │   ├── pages/     # Page components
│   │   ├── utils/     # Frontend utilities
│   │   ├── App.jsx    # Root application component
│   │   └── main.jsx   # Application entry point
│   └── package.json
├── diagrams/          # System architecture diagrams
└── generate_diagrams.py # Diagram generation script
```

## Core Components

### Backend Architecture
- **FastAPI Framework**: RESTful API server with async support
- **MongoDB + Motor**: Async database operations with fallback to JSON storage
- **Pydantic**: Data validation and serialization
- **JWT Authentication**: Token-based user authentication
- **Blockchain Integration**: Immutable record storage

### Frontend Architecture
- **React 19**: Component-based UI framework
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management
- **Axios**: HTTP client for API communication
- **Tailwind CSS**: Utility-first styling

### Key Patterns
- **Separation of Concerns**: Clear division between routes, services, and database layers
- **API-First Design**: Backend exposes RESTful endpoints consumed by frontend
- **Role-Based Access**: Different portals for students, supervisors, and admins
- **Fallback Mechanism**: JSON file storage when MongoDB is unavailable
- **Component Modularity**: Reusable React components for consistent UI

## Architectural Flow
1. User interacts with React frontend
2. Frontend calls backend API via axios
3. FastAPI routes validate requests and delegate to services
4. Services execute business logic and interact with database
5. Blockchain transactions recorded for critical operations
6. Responses returned through the stack to user interface
