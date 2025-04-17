# ClickHouse ↔ Flat File Connector

## Overview
A web-based application that enables bidirectional data transfer between ClickHouse databases and flat files (CSV), featuring a user-friendly interface and efficient data handling.

## Key Features
- **Bidirectional Data Flow**: Transfer data from ClickHouse to CSV and vice versa
- **JWT Authentication**: Secure connection to ClickHouse using JWT tokens
- **Column Selection**: Choose specific columns for targeted data transfer
- **Progress Tracking**: Monitor ingestion progress in real-time
- **Data Preview**: View sample data before full ingestion
- **Completion Reporting**: Get confirmation with record count upon successful transfer

## Setup Instructions

### Prerequisites
- Python 3.8+
- Flask
- ClickHouse client library

### Installation
```bash
# Clone the repository
git clone https://github.com/Ayushpal11/clickhouse-ingestion-tool.git
cd clickhouse-ingestion-tool

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Start the server
python app.py
```

### Usage
1. Open `http://localhost:5000` in your browser
2. Select source and target systems
3. Enter connection details
4. Choose tables/files and columns
5. Start ingestion

## Connection Details

### ClickHouse Connection
- **Host**: ClickHouse server hostname/IP (e.g., `localhost`)
- **Port**: TCP port (`8443` for HTTPS, `8123` for HTTP)
- **Database**: Database name (e.g., `default`)
- **User**: Username (e.g., `default`)
- **JWT**: Authentication token

### Flat File Configuration
- **Filename**: Path to local CSV file
- **Delimiter**: Field separator character (e.g., `,`, `|`, `;`)
- **Header**: Whether file contains a header row

## Advanced Features
- **Data Preview**: View first 100 records before ingestion
- **Progress Tracking**: Real-time progress indicator
- **Error Handling**: User-friendly error messages
- **Multi-Table Join**: Combine data from multiple ClickHouse tables (experimental)

## Technical Implementation
- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **ClickHouse Client**: Official Python client library
- **File Handling**: Standard Python I/O utilities