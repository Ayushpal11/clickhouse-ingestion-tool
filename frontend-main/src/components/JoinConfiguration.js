import React from 'react';

function JoinConfiguration({
    availableTables,
    selectedTables,
    setSelectedTables,
    joinConditions,
    setJoinConditions
}) {
    // Add a table to the join
    const handleAddTable = (table) => {
        if (!selectedTables.includes(table)) {
            setSelectedTables([...selectedTables, table]);

            // Add an empty join condition if this isn't the first table
            if (selectedTables.length > 0) {
                setJoinConditions([...joinConditions, '']);
            }
        }
    };

    // Remove a table from the join
    const handleRemoveTable = (index) => {
        const updatedTables = [...selectedTables];
        updatedTables.splice(index, 1);
        setSelectedTables(updatedTables);

        // Remove associated join condition if needed
        if (index > 0) {
            const updatedConditions = [...joinConditions];
            updatedConditions.splice(index - 1, 1);
            setJoinConditions(updatedConditions);
        }
    };

    // Update a join condition
    const handleJoinConditionChange = (index, value) => {
        const updatedConditions = [...joinConditions];
        updatedConditions[index] = value;
        setJoinConditions(updatedConditions);
    };

    return (
        <div className="join-configuration">
            <h3>Multi-Table Join Configuration</h3>

            <div className="tables-selection">
                <p>Select tables to join:</p>
                <select
                    onChange={(e) => e.target.value && handleAddTable(e.target.value)}
                    value=""
                >
                    <option value="">-- Add Table --</option>
                    {availableTables.map((table, idx) => (
                        <option key={idx} value={table}>{table}</option>
                    ))}
                </select>
            </div>

            {selectedTables.length > 0 && (
                <div className="selected-tables">
                    <h4>Selected Tables:</h4>
                    <ol>
                        {selectedTables.map((table, idx) => (
                            <li key={idx}>
                                {table}
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => handleRemoveTable(idx)}
                                >
                                    Remove
                                </button>

                                {/* Show join condition input if this isn't the first table */}
                                {idx > 0 && (
                                    <div className="join-condition">
                                        <label>Join Condition:</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., table1.id = table2.id"
                                            value={joinConditions[idx - 1]}
                                            onChange={(e) => handleJoinConditionChange(idx - 1, e.target.value)}
                                        />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            <div className="join-help">
                <p className="help-text">
                    <small>
                        Join Condition Format: <code>table1.column1 = table2.column2</code>
                        <br />
                        Each table after the first requires a join condition.
                    </small>
                </p>
            </div>
        </div>
    );
}

export default JoinConfiguration;