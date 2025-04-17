import React from 'react';

function SourceConfiguration({ sourceType, config, setConfig, availableTables, onConnect, onLoadColumns }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="source-configuration">
            {sourceType === 'clickhouse' ? (
                <>
                    <div className="form-group">
                        <label>Host:</label>
                        <input
                            type="text"
                            name="host"
                            value={config.host}
                            onChange={handleChange}
                            placeholder="e.g., localhost"
                        />
                    </div>
                    <div className="form-group">
                        <label>Port:</label>
                        <input
                            type="text"
                            name="port"
                            value={config.port}
                            onChange={handleChange}
                            placeholder="e.g., 9440 for https, 9000 for http"
                        />
                    </div>
                    <div className="form-group">
                        <label>Database:</label>
                        <input
                            type="text"
                            name="database"
                            value={config.database}
                            onChange={handleChange}
                            placeholder="e.g., default"
                        />
                    </div>
                    <div className="form-group">
                        <label>User:</label>
                        <input
                            type="text"
                            name="user"
                            value={config.user}
                            onChange={handleChange}
                            placeholder="e.g., default"
                        />
                    </div>
                    <div className="form-group">
                        <label>JWT Token:</label>
                        <input
                            type="password"
                            name="jwtToken"
                            value={config.jwtToken}
                            onChange={handleChange}
                            placeholder="Enter JWT token"
                        />
                    </div>

                    <button onClick={onConnect}>Connect to ClickHouse</button>

                    {availableTables.length > 0 && (
                        <div className="form-group">
                            <label>Select Table:</label>
                            <select
                                name="table"
                                value={config.table}
                                onChange={handleChange}
                            >
                                <option value="">-- Select Table --</option>
                                {availableTables.map((table, index) => (
                                    <option key={index} value={table}>
                                        {table}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={onLoadColumns}
                                disabled={!config.table}
                            >
                                Load Columns
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="form-group">
                        <label>File Path:</label>
                        <input
                            type="text"
                            name="filePath"
                            value={config.filePath}
                            onChange={handleChange}
                            placeholder="e.g., /path/to/file.csv"
                        />
                    </div>
                    <div className="form-group">
                        <label>Delimiter:</label>
                        <input
                            type="text"
                            name="delimiter"
                            value={config.delimiter}
                            onChange={handleChange}
                            placeholder="e.g., ,"
                            maxLength={1}
                            style={{ width: '50px' }}
                        />
                    </div>

                    <button onClick={onConnect}>Load Flat File</button>
                </>
            )}
        </div>
    );
}

export default SourceConfiguration;