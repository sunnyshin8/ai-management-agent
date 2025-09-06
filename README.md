# AI-Powered Communication Assistant

An intelligent email management system that automatically processes support emails, analyzes sentiment and priority, and generates contextual AI responses.

## Features

### Core Functionality
- **Email Retrieval & Filtering**: Automatically fetches emails from IMAP/Gmail with support keyword filtering
- **Sentiment Analysis**: AI-powered sentiment analysis (positive/negative/neutral) with confidence scores
- **Priority Detection**: Automatic urgency classification based on keywords and content analysis
- **Categorization**: Smart categorization of emails into support categories
- **Context-Aware AI Responses**: GPT-powered response generation with RAG and prompt engineering
- **Priority Queue Processing**: Urgent emails are processed first

### Dashboard Features
- **Real-time Analytics**: Email statistics, sentiment breakdown, priority distribution
- **Interactive Charts**: Hourly traffic, category analysis, response metrics
- **Performance Tracking**: Response rates, processing times, resolution statistics
- **Recent Email Preview**: Quick access to latest emails with priority indicators

### Email Management
- **Comprehensive Email List**: Sortable, filterable grid with search functionality
- **Detailed Email View**: Full email analysis with extracted information
- **Response Management**: Edit, review, and send AI-generated responses
- **Bulk Operations**: Mark as processed, generate responses in batches

## Technical Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: Database ORM with SQLite
- **OpenAI GPT**: For response generation and advanced NLP
- **TextBlob**: Sentiment analysis and basic NLP
- **IMAP Client**: Email retrieval from email servers
- **Pydantic**: Data validation and serialization

### Frontend
- **React 18**: Modern React with hooks
- **Material-UI**: Google's Material Design components
- **Recharts**: Interactive data visualization
- **Axios**: HTTP client for API communication
- **React Router**: Client-side routing

### AI/ML Features
- **GPT-3.5 Turbo**: Context-aware response generation
- **Sentiment Analysis**: Multi-layered sentiment detection
- **Priority Classification**: Keyword-based urgency detection
- **Information Extraction**: Contact details, requirements parsing
- **RAG Implementation**: Knowledge base for contextual responses

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Gmail account with app password (or IMAP-enabled email)
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**:
   - Copy `.env.example` to `.env`
   - Configure your email settings:
     ```
     EMAIL_ADDRESS=your_email@gmail.com
     EMAIL_PASSWORD=your_app_password
     OPENAI_API_KEY=your_openai_api_key
     ```

5. **Run the backend**:
   ```bash
   python -m app.main
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Usage Guide

### Initial Setup
1. Configure your email credentials in the backend `.env` file
2. Start both backend and frontend servers
3. Access the dashboard at http://localhost:3000

### Fetching Emails
1. Click "Fetch New Emails" in the navigation or email list
2. The system will retrieve emails containing support keywords
3. AI analysis runs automatically for each email

### Managing Emails
1. **Dashboard**: View analytics and recent email overview
2. **Email List**: Browse, filter, and search all emails
3. **Email Detail**: View full analysis and manage responses

### AI Response Generation
1. Navigate to an email detail page
2. Click "Generate Response" to create AI response
3. Edit the response if needed before sending
4. Click "Send Response" to email the customer

### Analytics and Reporting
- View real-time statistics on the dashboard
- Monitor sentiment trends and priority distribution
- Track response rates and processing efficiency
- Analyze hourly email traffic patterns

## API Documentation

### Email Endpoints
- `GET /api/emails` - List emails with filtering
- `GET /api/emails/{id}` - Get specific email
- `POST /api/emails/fetch` - Fetch new emails
- `POST /api/emails/{id}/generate-response` - Generate AI response
- `POST /api/emails/{id}/send-response` - Send response email

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-emails` - Get recent emails
- `GET /api/dashboard/category-stats` - Get category breakdown
- `GET /api/dashboard/performance-metrics` - Get performance data

## Architecture Overview

### Email Processing Pipeline
1. **Email Retrieval**: IMAP client fetches emails with support keywords
2. **AI Analysis**: Sentiment, priority, and categorization analysis
3. **Information Extraction**: Contact details, requirements, and metadata
4. **Storage**: Structured data storage in SQLite database
5. **Response Generation**: Context-aware AI response using knowledge base
6. **Queue Management**: Priority-based processing with urgent emails first

### AI Components
- **Sentiment Engine**: TextBlob + custom keyword analysis
- **Priority Classifier**: Urgency keyword detection with scoring
- **Response Generator**: GPT-3.5 with context-aware prompting
- **Knowledge Base**: Category-specific response templates
- **Information Extractor**: Regex-based contact and requirement parsing

## Security Considerations
- Email credentials stored in environment variables
- API key protection for OpenAI
- Input validation and sanitization
- Error handling and logging
- Rate limiting for API endpoints

## Performance Features
- Background email processing
- Efficient database queries with indexing
- Pagination for large email lists
- Optimized API responses
- Client-side caching

## Customization

### Adding New Categories
Edit the knowledge base in `ai_service.py`:
```python
self.knowledge_base = {
    'new_category': {
        'keywords': ['keyword1', 'keyword2'],
        'response_template': 'Your template here'
    }
}
```

### Modifying Priority Keywords
Update urgent keywords in `ai_service.py`:
```python
self.urgent_keywords = [
    'urgent', 'emergency', 'critical'
    # Add your keywords
]
```

### Custom Response Templates
Modify the response generation logic in `_generate_template_response` method.

## Troubleshooting

### Common Issues
1. **Email connection fails**: Check IMAP settings and app password
2. **OpenAI API errors**: Verify API key and quota
3. **Database issues**: Ensure SQLite permissions
4. **Frontend build errors**: Clear node_modules and reinstall

### Debug Mode
Set `DEBUG=True` in `.env` for detailed logging.

## Contributing
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License
MIT License - see LICENSE file for details.
