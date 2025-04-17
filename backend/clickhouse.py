from clickhouse_driver import Client
import pandas as pd
import csv

def create_client(host, port, database, user, jwt_token):
    """
    Create a ClickHouse client with JWT authentication
    """
    # Use JWT token for authentication
    # For HTTP interface port (8123/8443), we'd use different approach
    # This assumes we're using the native protocol port (9000/9440)
    client = Client(
        host=host,
        port=int(port),
        database=database,
        user=user,
        password=jwt_token,  # JWT token used as password
        secure=True if int(port) in (9440, 8443) else False,
        verify=False,  # In production, you'd validate certs
        settings={'use_client_time_zone': True}
    )
    return client

def get_tables(host, port, database, user, jwt_token):
    """
    Get list of tables in the specified database
    """
    client = create_client(host, port, database, user, jwt_token)
    result = client.execute("SHOW TABLES FROM {}".format(database))
    # Extract table names from result
    tables = [row[0] for row in result]
    return tables

def get_columns(host, port, database, user, jwt_token, table):
    """
    Get columns for a specific table
    """
    client = create_client(host, port, database, user, jwt_token)
    result = client.execute(
        "SELECT name, type FROM system.columns WHERE database = %(db)s AND table = %(table)s",
        {'db': database, 'table': table}
    )
    # Return as list of column objects with name and type
    columns = [{'name': row[0], 'type': row[1]} for row in result]
    return columns

def preview_data(host, port, database, user, jwt_token, table, columns, limit):
    """
    Preview data from the specified table with selected columns
    """
    client = create_client(host, port, database, user, jwt_token)
    
    # Use * if no columns specified, otherwise use the specified columns
    column_clause = "*" if not columns else ", ".join([f"`{col}`" for col in columns])
    
    query = f"SELECT {column_clause} FROM {database}.{table} LIMIT {limit}"
    result = client.execute(query, with_column_types=True)
    
    # Convert result to list of dictionaries
    rows = result[0]  # The result data
    column_names = [col[0] for col in result[1]]  # The column names
    
    # Create list of dicts for JSON serialization
    data = []
    for row in rows:
        row_dict = {}
        for i, value in enumerate(row):
            # Convert non-serializable types if needed
            if isinstance(value, (pd.Timestamp, pd.Timedelta)):
                row_dict[column_names[i]] = str(value)
            else:
                row_dict[column_names[i]] = value
        data.append(row_dict)
    
    return data

def export_to_flatfile(host, port, database, user, jwt_token, table, columns, file_path, delimiter):
    """
    Export data from ClickHouse to flat file
    """
    client = create_client(host, port, database, user, jwt_token)
    
    # Use * if no columns specified, otherwise use the specified columns
    column_clause = "*" if not columns else ", ".join([f"`{col}`" for col in columns])
    
    # First get the count to return later
    count_query = f"SELECT COUNT(*) FROM {database}.{table}"
    count_result = client.execute(count_query)
    record_count = count_result[0][0]
    
    # Now get the actual data
    query = f"SELECT {column_clause} FROM {database}.{table}"
    result = client.execute(query, with_column_types=True)
    
    rows = result[0]  # The result data
    column_names = [col[0] for col in result[1]]  # The column names
    
    # Write to CSV file
    with open(file_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile, delimiter=delimiter)
        # Write header
        writer.writerow(column_names)
        # Write data rows
        for row in rows:
            # Convert all values to strings
            str_row = [str(value) if value is not None else '' for value in row]
            writer.writerow(str_row)
    
    return record_count

def export_join_to_flatfile(host, port, database, user, jwt_token, tables, join_conditions, columns, file_path, delimiter):
    """
    Export joined data from multiple ClickHouse tables to flat file
    """
    client = create_client(host, port, database, user, jwt_token)
    
    # Build JOIN query
    # Start with the first table
    base_table = tables[0]
    query = f"SELECT "
    
    # Add column selection
    if not columns:
        query += "*"
    else:
        query += ", ".join([f"`{col}`" for col in columns])
    
    query += f" FROM {database}.{base_table}"
    
    # Add JOIN clauses
    for i, condition in enumerate(join_conditions):
        if i+1 >= len(tables):
            break
            
        join_table = tables[i+1]
        query += f" JOIN {database}.{join_table} ON {condition}"
    
    # Execute the query to get the result
    result = client.execute(query, with_column_types=True)
    
    rows = result[0]  # The result data
    column_names = [col[0] for col in result[1]]  # The column names
    
    # Get the count for reporting
    record_count = len(rows)
    
    # Write to CSV file
    with open(file_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile, delimiter=delimiter)
        # Write header
        writer.writerow(column_names)
        # Write data rows
        for row in rows:
            # Convert all values to strings
            str_row = [str(value) if value is not None else '' for value in row]
            writer.writerow(str_row)
    
    return record_count