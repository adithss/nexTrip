![image](https://github.com/user-attachments/assets/b1aa53cd-bb85-4345-867b-fc05773d4282)
![WhatsApp Image 2025-06-14 at 16 18 07_ee95448e](https://github.com/user-attachments/assets/af7667d8-2995-487e-918f-2787be2165e3)
![image](https://github.com/user-attachments/assets/df6a91ac-368b-4331-a9fe-3168792699f1)




# 🌍 nexTrip - Smart Travel Planning Platform

nexTrip is a comprehensive web-based travel planning application that helps users create detailed itineraries, manage travel documents, track expenses, and collaborate with travel companions in group trips.

## ✨ Features

### 🗺️ **Smart Itinerary Planning**
- **Interactive Trip Builder**: Create detailed day-by-day itineraries with hotels, restaurants, attractions, and activities
- **Google Maps Integration**: Location-based recommendations and visual mapping
- **Photo-Rich Planning**: Visual itineraries with photos for each recommendation
- **Multi-Day Support**: Plan trips spanning multiple days with organized daily schedules

### 👥 **Group Travel Management**
- **Trip Groups**: Create and manage travel groups with multiple participants
- **Collaborative Planning**: Share itineraries and coordinate with travel companions
- **Member Management**: Easy invitation system for adding travel buddies

### 💰 **Expense Tracking & Splitting**
- **Smart Expense Management**: Track all trip-related expenses with categories
- **Automatic Bill Splitting**: Split expenses among group members with customizable ratios
- **Settlement Calculator**: Automated calculation of who owes whom and how much
- **Real-time Balance Tracking**: Live updates of individual balances and group finances
- **Settlement Recording**: Mark payments as settled with timestamps

### 📄 **Document Management**
- **Cloud Storage Integration**: Secure document upload via Cloudinary
- **Multi-format Support**: Handle images (JPG, PNG) and PDFs
- **Travel Document Organization**: Store passports, tickets, reservations, and other travel documents
- **User-specific Access**: Private document storage with user authentication

### 🔐 **Security & Authentication**
- **Secure User Registration**: BCrypt password hashing
- **Session Management**: Express-session with secure cookie handling
- **Protected Routes**: Authentication middleware for all sensitive operations
- **User Isolation**: Complete data separation between different users

## 🛠️ Technical Stack

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: BCrypt + Express Session
- **File Upload**: Multer + Cloudinary Storage
- **Security**: CORS enabled, HTTP-only cookies

### **Frontend**
- **Languages**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Responsive design with modern CSS
- **APIs**: Google Maps JavaScript API
- **File Handling**: Native File API integration

### **External Services**
- **Cloud Storage**: Cloudinary for document and image management
- **Maps & Places**: Google Maps API with Places library
- **Email**: PostgreSQL-based user management

## 🗄️ Database Schema

### Core Tables
```sql
-- User Management
login (id, userid, mailid, password)

-- Trip Planning
itineraries (id, user_id, itinerary_name, location, travel_date, number_of_days, created_at)
daily_activities (id, itinerary_id, day_number, hotel_name, hotel_photo, restaurant_name, restaurant_photo, attraction_name, attraction_photo, activity_name, activity_photo)

-- Group Management
trip_groups (id, name, created_by, created_at)
group_members (id, group_id, userid)

-- Expense Tracking
expenses (id, group_id, description, amount, paid_by, expense_date, category, created_at)
expense_shares (id, expense_id, userid, amount)
settlements (id, group_id, from_user, to_user, amount, settled_at)

-- Document Storage
documents (id, user_id, file_name, file_url, file_type, uploaded_at)
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Cloudinary account
- Google Maps API key

### 1. Clone the Repository
```bash
git clone https://github.com/adithss/nextrip.git
cd nextrip
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nextrip_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb nextrip_db

# Tables will be created automatically when the server starts
```
![image](https://github.com/user-attachments/assets/1fda6ca1-8015-4127-9f38-9e5bed6588ae)
![image](https://github.com/user-attachments/assets/ec005342-af2f-4ddc-8241-80d1bfcf96c2)

### 5. Start the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
nextrip/
├── server.js                 # Main Express server
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── landing.html             # Authentication page
├── home.html               # Main dashboard
├── results.html            # Itinerary results
├── budget_tracker.html     # Expense management
├── file.html              # Document management
├── manage-itineraries.html # Itinerary management
└── README.md              # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `GET /logout` - User logout
- `GET /check-session` - Session validation

### Itinerary Management
- `POST /save-itinerary` - Save new itinerary
- `GET /user-itineraries` - Get user's itineraries
- `DELETE /delete-itinerary/:id` - Delete itinerary

### Group Management
- `POST /create-group` - Create trip group
- `GET /user-groups` - Get user's groups
- `GET /group/:id` - Get group details
- `POST /add-member` - Add group member
- `DELETE /delete-group/:id` - Delete group

### Expense Management
- `POST /add-expense` - Add new expense
- `GET /settlement-summary/:groupId` - Get settlement calculations
- `POST /record-settlement` - Record payment settlement
- `DELETE /delete-expense/:id` - Delete expense

### Document Management
- `POST /upload` - Upload document
- `GET /documents` - Get user documents
- `DELETE /document/:id` - Delete document

## 🌟 Key Features Highlight

### Smart Expense Splitting Algorithm
The application implements an intelligent expense splitting system that:
- Automatically calculates individual shares based on group participation
- Generates optimal settlement paths to minimize transactions
- Provides real-time balance updates across all group members

### Secure File Management
- Direct integration with Cloudinary for reliable cloud storage
- Automatic file type detection and validation
- User-specific access control with session-based authentication

### Responsive Trip Planning
- Integration with Google Maps API for location services
- Visual itinerary builder with drag-and-drop functionality
- Photo-rich recommendations for enhanced trip planning

## 🔒 Security Features

- **Password Security**: BCrypt hashing with salt rounds
- **Session Management**: Secure HTTP-only cookies with expiration
- **Route Protection**: Authentication middleware on all sensitive endpoints
- **Data Isolation**: User-specific data access with session validation
- **File Security**: Cloudinary integration with secure upload handling

## 🚀 Deployment

### Environment Setup
1. Set up PostgreSQL database on your hosting platform
2. Configure Cloudinary account for file storage
3. Obtain Google Maps API key with Places library enabled
4. Set all environment variables in your hosting platform

### Recommended Platforms
- **Heroku**: Easy deployment with PostgreSQL add-on
- **Railway**: Modern deployment with automatic PostgreSQL
- **DigitalOcean**: VPS deployment with managed databases
- **AWS EC2**: Full control deployment with RDS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 📝 License

This project is for academic/demo purposes only and is not licensed for commercial use.

## 👨‍💻 Developer

**Adith S**
- GitHub: [@adithss](https://github.com/adithss)
- LinkedIn: [Adith S](linkedin.com/in/adith-sasidharan)
- Email: adithsasidharan@gmail.com

## 🙏 Acknowledgments

- Google Maps API for location services
- Cloudinary for reliable file storage
- PostgreSQL community for excellent documentation
- Express.js team for the robust framework

---

**Built with ❤️ for travelers who love to plan together**


