import pandas as pd
import csv
from clickhouse_driver import Client

def get_columns(file_path, delimiter):
    """
    Get column names from a flat file
    """
    try:
        # Read just the header row to get column names
        df = pd.read_csv(file_path, delimiter=delimiter, nrows=0)
        columns = [{'name': col, 'type': 'String'} for col in df.columns]
        return columns
    except Exception as e:
        raise Exception(f"Error reading flat file: {str(e)}")

def preview_data(file_path, delimiter, selected_columns, limit):
    """
    Preview data from the flat file with selected columns
    """
    try:
        # Read the specified number of rows
        df = pd.read_csv(file_path, delimiter=delimiter, nrows=limit)
        
        # Select only specified columns if any
        if selected_columns:
            df = df[selected_columns]
        
        # Convert to dictionary format for JSON serialization
        return df.to_dict(orient='records')
    except Exception as e:
        raise Exception(f"Error previewing flat file data: {str(e)}")

def export_to_clickhouse(file_path, delimiter, selected_columns, host, port, database, user, jwt_token, table):
    """
    Export data from flat file to ClickHouse
    """
    try:
        # Read the flat file
        df = pd.read_csv(file_path, delimiter=delimiter)
        
        # Select only specified columns if any
        if selected_columns:
            df = df[selected_columns]
        
        # Get record count for reporting
        record_count = len(df)
        
        # Create ClickHouse client
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
        
        # Check if table exists
        tables = client.execute(f"SHOW TABLES FROM {database} LIKE '{table}'")
        table_exists = len(tables) > 0
        
        # If table doesn't exist, create it based on the dataframe schema
        if not table_exists:
            # Generate CREATE TABLE statement
            create_table_query = generate_create_table_query(df, database, table)
            client.execute(create_table_query)
        
        # Insert data
        data = df.to_dict('records')
        columns = list(df.columns)
        
        # Convert data to ClickHouse format
        values = []
        for row in data:
            values.append(tuple(row[col] if pd.notna(row[col]) else None for col in columns))
        
        # Insert data in batches
        batch_size = 10000
        for i in range(0, len(values), batch_size):
            batch = values[i:i+batch_size]
            client.execute(
                f"INSERT INTO {database}.{table} ({', '.join(columns)}) VALUES",
                batch
            )
        
        return record_count
    except Exception as e:
        raise Exception(f"Error exporting to ClickHouse: {str(e)}")

def generate_create_table_query(df, database, table):
    """
    Generate a CREATE TABLE query for ClickHouse based on a pandas DataFrame schema
    """
    # Map pandas dtypes to ClickHouse types
    type_mapping = {
        'int64': 'Int64',
        'float64': 'Float64',
        'object': 'String',
        'bool': 'UInt8',
        'datetime64[ns]': 'DateTime',
        'category': 'String',
        'timedelta64[ns]': 'Int64',
    }
    
    columns = []
    for col_name, dtype in df.dtypes.items():
        ch_type = type_mapping.get(str(dtype), 'String')
        columns.append(f"`{col_name}` {ch_type}")
    
    create_query = f"""
    CREATE TABLE {database}.{table} (
        {','.join(columns)}
    ) ENGINE = MergeTree()
    ORDER BY tuple()
    """
    
    return create_query