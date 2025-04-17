import React from 'react';

function StatusDisplay({ status, errorMessage }) {
    const getStatusText = () => {
        switch (status) {
            case 'connecting':
                return 'Connecting to source...';
            case 'fetching':
                return 'Fetching data...';
            case 'ingesting':
                return 'Ingesting data...';
            case 'completed':
                return 'Ingestion completed successfully!';
            case 'error':
                return 'Error: ' + errorMessage;
            default:
                return null;
        }
    };

    const getStatusClass = () => {
        switch (status) {
            case 'completed':
                return 'status-success';
            case 'error':
                return 'status-error';
            case 'connecting':
            case 'fetching':
            case 'ingesting':
                return 'status-processing';
            default:
                return '';
        }
    };

    const statusText = getStatusText();

    if (!statusText) {
        return null;
    }

    return (
        <div className={`status-display ${getStatusClass()}`}>
            <p>{statusText}</p>
        </div>
    );
}

export default StatusDisplay;