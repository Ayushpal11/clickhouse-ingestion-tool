import React, { useState } from 'react';
import './app.css';
import SourceConfiguration from './components/SourceConfiguration';
import ColumnSelection from './components/ColumnSelection';
import StatusDisplay from './components/StatusDisplay';
import ResultDisplay from './components/ResultDisplay';
import TargetConfiguration from './components/TargetConfiguration';
import JoinConfiguration from './components/JoinConfiguration';

function App() {
  // State for source configuration
  const [sourceType, setSourceType] = useState('clickhouse');
  const [sourceConfig, setSourceConfig] = useState({
    host: '',
    port: '',
    database: '',
    user: '',
    jwtToken: '',
    filePath: '',
    delimiter: ',',
    table: '',
    tables: []
  });

  // State for target configuration
  const [targetType, setTargetType] = useState('flatfile');
  const [targetConfig, setTargetConfig] = useState({
    host: '',
    port: '',
    database: '',
    user: '',
    jwtToken: '',
    filePath: '',
    delimiter: ',',
    table: ''
  });

  // State for available tables and columns
  const [availableTables, setAvailableTables] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);

  // State for join configuration (bonus)
  const [useJoin, setUseJoin] = useState(false);
  const [selectedTables, setSelectedTables] = useState([]);
  const [joinConditions, setJoinConditions] = useState(['']);

  // State for status and results
  const [status, setStatus] = useState('idle'); // idle, connecting, fetching, ingesting, completed, error
  const [errorMessage, setErrorMessage] = useState('');
  const [resultCount, setResultCount] = useState(0);
  const [previewData, setPreviewData] = useState([]);

  // Connect to source and fetch tables/columns
  const handleConnect = async () => {
    setStatus('connecting');
    setErrorMessage('');

    try {
      let response;

      if (sourceType === 'clickhouse') {
        // Fetch tables from ClickHouse
        response = await fetch('http://localhost:5000/api/source-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceType,
            host: sourceConfig.host,
            port: sourceConfig.port,
            database: sourceConfig.database,
            user: sourceConfig.user,
            jwtToken: sourceConfig.jwtToken
          }),
        });

        const data = await response.json();

        if (data.success) {
          setAvailableTables(data.tables);
          setStatus('idle');
        } else {
          setErrorMessage(data.error);
          setStatus('error');
        }
      } else if (sourceType === 'flatfile') {
        // Fetch columns from flat file
        response = await fetch('http://localhost:5000/api/source-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceType,
            filePath: sourceConfig.filePath,
            delimiter: sourceConfig.delimiter
          }),
        });

        const data = await response.json();

        if (data.success) {
          setAvailableColumns(data.columns);
          setStatus('idle');
        } else {
          setErrorMessage(data.error);
          setStatus('error');
        }
      }
    } catch (error) {
      setErrorMessage(`Connection error: ${error.message}`);
      setStatus('error');
    }
  };

  // Load columns for selected table
  const handleLoadColumns = async () => {
    if (sourceType !== 'clickhouse' || !sourceConfig.table) {
      return;
    }

    setStatus('fetching');
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/table-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: sourceConfig.host,
          port: sourceConfig.port,
          database: sourceConfig.database,
          user: sourceConfig.user,
          jwtToken: sourceConfig.jwtToken,
          table: sourceConfig.table
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAvailableColumns(data.columns);
        setStatus('idle');
      } else {
        setErrorMessage(data.error);
        setStatus('error');
      }
    } catch (error) {
      setErrorMessage(`Error loading columns: ${error.message}`);
      setStatus('error');
    }
  };

  // Preview data
  const handlePreview = async () => {
    if (selectedColumns.length === 0) {
      setErrorMessage('Please select at least one column to preview');
      setStatus('error');
      return;
    }

    setStatus('fetching');
    setErrorMessage('');

    try {
      let requestBody;

      if (sourceType === 'clickhouse') {
        requestBody = {
          sourceType,
          host: sourceConfig.host,
          port: sourceConfig.port,
          database: sourceConfig.database,
          user: sourceConfig.user,
          jwtToken: sourceConfig.jwtToken,
          table: sourceConfig.table,
          selectedColumns
        };
      } else if (sourceType === 'flatfile') {
        requestBody = {
          sourceType,
          filePath: sourceConfig.filePath,
          delimiter: sourceConfig.delimiter,
          selectedColumns
        };
      }

      const response = await fetch('http://localhost:5000/api/preview-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setPreviewData(data.data);
        setStatus('idle');
      } else {
        setErrorMessage(data.error);
        setStatus('error');
      }
    } catch (error) {
      setErrorMessage(`Error previewing data: ${error.message}`);
      setStatus('error');
    }
  };

  // Start ingestion
  const handleStartIngestion = async () => {
    if (selectedColumns.length === 0) {
      setErrorMessage('Please select at least one column to ingest');
      setStatus('error');
      return;
    }

    setStatus('ingesting');
    setErrorMessage('');

    try {
      let requestBody = {
        sourceType: useJoin ? 'clickhouse_join' : sourceType,
        targetType,
        selectedColumns,
        sourceConfig: {
          host: sourceConfig.host,
          port: sourceConfig.port,
          database: sourceConfig.database,
          user: sourceConfig.user,
          jwtToken: sourceConfig.jwtToken,
          table: sourceConfig.table,
          filePath: sourceConfig.filePath,
          delimiter: sourceConfig.delimiter
        },
        targetConfig: {
          host: targetConfig.host,
          port: targetConfig.port,
          database: targetConfig.database,
          user: targetConfig.user,
          jwtToken: targetConfig.jwtToken,
          table: targetConfig.table,
          filePath: targetConfig.filePath,
          delimiter: targetConfig.delimiter
        }
      };

      // Add join configuration if using joins
      if (useJoin) {
        requestBody.sourceConfig.tables = selectedTables;
        requestBody.sourceConfig.joinConditions = joinConditions;
      }

      const response = await fetch('http://localhost:5000/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setResultCount(data.recordCount);
        setStatus('completed');
      } else {
        setErrorMessage(data.error);
        setStatus('error');
      }
    } catch (error) {
      setErrorMessage(`Error during ingestion: ${error.message}`);
      setStatus('error');
    }
  };

  // Reset all configurations and states
  const handleReset = () => {
    setSourceConfig({
      host: '',
      port: '',
      database: '',
      user: '',
      jwtToken: '',
      filePath: '',
      delimiter: ',',
      table: '',
      tables: []
    });
    setTargetConfig({
      host: '',
      port: '',
      database: '',
      user: '',
      jwtToken: '',
      filePath: '',
      delimiter: ',',
      table: ''
    });
    setAvailableTables([]);
    setAvailableColumns([]);
    setSelectedColumns([]);
    setUseJoin(false);
    setSelectedTables([]);
    setJoinConditions(['']);
    setStatus('idle');
    setErrorMessage('');
    setResultCount(0);
    setPreviewData([]);
  };

  return (
    <div className="app">
      <h1>ClickHouse & Flat File Data Ingestion Tool</h1>

      <div className="config-container">
        <div className="source-config">
          <h2>Source Configuration</h2>
          <div className="source-type-selector">
            <label>
              <input
                type="radio"
                value="clickhouse"
                checked={sourceType === 'clickhouse'}
                onChange={() => {
                  setSourceType('clickhouse');
                  setTargetType('flatfile');
                }}
              />
              ClickHouse
            </label>
            <label>
              <input
                type="radio"
                value="flatfile"
                checked={sourceType === 'flatfile'}
                onChange={() => {
                  setSourceType('flatfile');
                  setTargetType('clickhouse');
                }}
              />
              Flat File
            </label>
          </div>

          <SourceConfiguration
            sourceType={sourceType}
            config={sourceConfig}
            setConfig={setSourceConfig}
            availableTables={availableTables}
            onConnect={handleConnect}
            onLoadColumns={handleLoadColumns}
          />

          {sourceType === 'clickhouse' && (
            <div className="join-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={useJoin}
                  onChange={(e) => setUseJoin(e.target.checked)}
                />
                Use Multi-Table Join (Bonus Feature)
              </label>
            </div>
          )}

          {sourceType === 'clickhouse' && useJoin && (
            <JoinConfiguration
              availableTables={availableTables}
              selectedTables={selectedTables}
              setSelectedTables={setSelectedTables}
              joinConditions={joinConditions}
              setJoinConditions={setJoinConditions}
            />
          )}
        </div>

        <div className="target-config">
          <h2>Target Configuration</h2>
          <div className="target-type">
            <span>Target: {targetType === 'clickhouse' ? 'ClickHouse' : 'Flat File'}</span>
          </div>

          <TargetConfiguration
            targetType={targetType}
            config={targetConfig}
            setConfig={setTargetConfig}
          />
        </div>
      </div>

      <div className="columns-container">
        <h2>Column Selection</h2>
        <ColumnSelection
          availableColumns={availableColumns}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
        />
      </div>

      <div className="actions-container">
        <button onClick={handlePreview} disabled={status === 'connecting' || status === 'fetching' || status === 'ingesting'}>
          Preview Data (First 100 rows)
        </button>
        <button onClick={handleStartIngestion} disabled={status === 'connecting' || status === 'fetching' || status === 'ingesting'}>
          Start Ingestion
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>

      <StatusDisplay status={status} errorMessage={errorMessage} />

      <ResultDisplay resultCount={resultCount} previewData={previewData} />
    </div>
  );
}

export default App;