import React from 'react';

function ColumnSelection({ availableColumns, selectedColumns, setSelectedColumns }) {
    // Handler for checkbox change
    const handleColumnSelection = (columnName) => {
        if (selectedColumns.includes(columnName)) {
            setSelectedColumns(selectedColumns.filter(col => col !== columnName));
        } else {
            setSelectedColumns([...selectedColumns, columnName]);
        }
    };

    // Handler for select all
    const handleSelectAll = () => {
        if (availableColumns.length === selectedColumns.length) {
            setSelectedColumns([]);
        } else {
            setSelectedColumns(availableColumns.map(col => col.name));
        }
    };

    return (
        <div className="column-selection">
            {availableColumns.length > 0 ? (
                <>
                    <div className="select-all">
                        <label>
                            <input
                                type="checkbox"
                                checked={availableColumns.length > 0 && selectedColumns.length === availableColumns.length}
                                onChange={handleSelectAll}
                            />
                            Select All
                        </label>
                    </div>

                    <div className="columns-list">
                        {availableColumns.map((column, index) => (
                            <div key={index} className="column-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(column.name)}
                                        onChange={() => handleColumnSelection(column.name)}
                                    />
                                    {column.name} <span className="column-type">({column.type})</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="no-columns">No columns available. Please connect to a source and select a table.</p>
            )}
        </div>
    );
}

export default ColumnSelection;