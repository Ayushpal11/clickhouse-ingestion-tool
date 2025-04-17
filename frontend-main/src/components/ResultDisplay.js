import React from 'react';

function ResultDisplay({ resultCount, previewData }) {
    // Check if we have a result count to display
    const hasResultCount = resultCount > 0;
    // Check if we have preview data to display
    const hasPreviewData = previewData && previewData.length > 0;

    // If nothing to display, return null
    if (!hasResultCount && !hasPreviewData) {
        return null;
    }

    return (
        <div className="result-display">
            {hasResultCount && (
                <div className="result-count">
                    <h3>Ingestion Complete</h3>
                    <p>{resultCount} records processed successfully.</p>
                </div>
            )}

            {hasPreviewData && (
                <div className="preview-data">
                    <h3>Data Preview</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    {Object.keys(previewData[0]).map((colName, idx) => (
                                        <th key={idx}>{colName}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, rowIdx) => (
                                    <tr key={rowIdx}>
                                        {Object.values(row).map((value, colIdx) => (
                                            <td key={colIdx}>{String(value)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResultDisplay;