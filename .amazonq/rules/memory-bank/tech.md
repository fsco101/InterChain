# Technology Stack

## Programming Languages
- **Python 3.x**: Backend API and blockchain scripts
- **JavaScript (ES6+)**: Frontend application
- **JSX**: React component templates

## Backend Technologies

### Core Framework
- **FastAPI 0.138.0**: Modern async web framework
- **Uvicorn 0.49.0**: ASGI server
- **Pydantic 2.13.4**: Data validation and settings

### Database
- **MongoDB**: Primary NoSQL database
- **Motor 3.7.1**: Async MongoDB driver
- **PyMongo 4.17.0**: Sync MongoDB driver (fallback)

### Authentication & Security
- **Python-Jose 3.5.0**: JWT token handling
- **Bcrypt 5.0.0**: Password hashing
- **PyTokens 0.4.1**: Token management

### Additional Libraries
- **Cloudinary 1.44.2**: Media storage
- **AIOSMTPLIB**: Async email functionality
- **Python-dotenv 1.2.2**: Environment configuration

## Frontend Technologies

### Core Framework
- **React 19.2.7**: UI library
- **React-DOM 19.2.7**: DOM rendering
- **Vite 8.0.16**: Build tool and dev server

### Routing & State
- **React Router DOM 7.18.0**: Client-side routing
- **Zustand 5.0.14**: State management
- **JWT-Decode 4.0.0**: Token decoding

### UI & Styling
- **Tailwind CSS 4.3.1**: Utility-first CSS
- **Framer Motion 12.40.0**: Animation library
- **React Icons 5.6.0**: Icon library

### Utilities
- **Axios 1.18.0**: HTTP client
- **React-Toastify 11.1.0**: Toast notifications
- **Sonner 2.0.7**: Alternative toast library
- **SweetAlert2 11.26.25**: Modal dialogs
- **jsPDF 4.2.1**: PDF generation
- **html2canvas 1.4.1**: HTML to canvas conversion

## Development Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

## Environment Configuration
- **Backend**: `.env` file in `backend/` directory
- **Frontend**: `.env` file in `frontend/` directory
- Configuration includes database URLs, API keys, JWT secrets

## Build Tools
- **Python Package Manager**: pip
- **Node Package Manager**: npm
- **Module Bundler**: Vite (frontend)
- **Code Quality**: Black, isort (Python formatting)
