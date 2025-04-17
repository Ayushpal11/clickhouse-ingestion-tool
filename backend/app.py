from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import clickhouse
import flatfile

app = Flask(__name__)
CORS(app)

@app.route('/api/source-info', methods=['POST'])
def get_source_info():
    source_type = request.json.get('sourceType')
    if source_type == 'clickhouse':
        host = request.json.get('host')
        port = request.json.get('port')
        database = request.json.get('database')
        user = request.json.get('user')
        jwt_token = request.json.get('jwtToken')
        
        try:
            tables = clickhouse.get_tables(host, port, database, user, jwt_token)
            return jsonify({'success': True, 'tables': tables})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
            
    elif source_type == 'flatfile':
        file_path = request.json.get('filePath')
        delimiter = request.json.get('delimiter')
        
        try:
            columns = flatfile.get_columns(file_path, delimiter)
            return jsonify({'success': True, 'columns': columns})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    
    return jsonify({'success': False, 'error': 'Invalid source type'})

@app.route('/api/table-columns', methods=['POST'])
def get_table_columns():
    """
    Get columns for a specific ClickHouse table
    """
    host = request.json.get('host')
    port = request.json.get('port')
    database = request.json.get('database')
    user = request.json.get('user')
    jwt_token = request.json.get('jwtToken')
    table = request.json.get('table')
    
    try:
        columns = clickhouse.get_columns(host, port, database, user, jwt_token, table)
        return jsonify({'success': True, 'columns': columns})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/preview-data', methods=['POST'])
def preview_data():
    """
    Preview data from the selected source with selected columns
    """
    source_type = request.json.get('sourceType')
    selected_columns = request.json.get('selectedColumns', [])
    limit = 100  # Preview first 100 rows
    
    if source_type == 'clickhouse':
        host = request.json.get('host')
        port = request.json.get('port')
        database = request.json.get('database')
        user = request.json.get('user')
        jwt_token = request.json.get('jwtToken')
        table = request.json.get('table')
        
        try:
            data = clickhouse.preview_data(host, port, database, user, jwt_token, table, selected_columns, limit)
            return jsonify({'success': True, 'data': data})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
            
    elif source_type == 'flatfile':
        file_path = request.json.get('filePath')
        delimiter = request.json.get('delimiter')
        
        try:
            data = flatfile.preview_data(file_path, delimiter, selected_columns, limit)
            return jsonify({'success': True, 'data': data})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    
    return jsonify({'success': False, 'error': 'Invalid source type'})

@app.route('/api/ingest', methods=['POST'])
def ingest_data():
    """
    Execute data ingestion based on user selections
    """
    source_type = request.json.get('sourceType')
    target_type = request.json.get('targetType')
    selected_columns = request.json.get('selectedColumns', [])
    
    # ClickHouse to Flat File
    if source_type == 'clickhouse' and target_type == 'flatfile':
        host = request.json.get('sourceConfig', {}).get('host')
        port = request.json.get('sourceConfig', {}).get('port')
        database = request.json.get('sourceConfig', {}).get('database')
        user = request.json.get('sourceConfig', {}).get('user')
        jwt_token = request.json.get('sourceConfig', {}).get('jwtToken')
        table = request.json.get('sourceConfig', {}).get('table')
        
        file_path = request.json.get('targetConfig', {}).get('filePath')
        delimiter = request.json.get('targetConfig', {}).get('delimiter')
        
        try:
            record_count = clickhouse.export_to_flatfile(
                host, port, database, user, jwt_token, 
                table, selected_columns, file_path, delimiter
            )
            return jsonify({'success': True, 'recordCount': record_count})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    
    # Flat File to ClickHouse
    elif source_type == 'flatfile' and target_type == 'clickhouse':
        file_path = request.json.get('sourceConfig', {}).get('filePath')
        delimiter = request.json.get('sourceConfig', {}).get('delimiter')
        
        host = request.json.get('targetConfig', {}).get('host')
        port = request.json.get('targetConfig', {}).get('port')
        database = request.json.get('targetConfig', {}).get('database')
        user = request.json.get('targetConfig', {}).get('user')
        jwt_token = request.json.get('targetConfig', {}).get('jwtToken')
        table = request.json.get('targetConfig', {}).get('table')
        
        try:
            record_count = flatfile.export_to_clickhouse(
                file_path, delimiter, selected_columns,
                host, port, database, user, jwt_token, table
            )
            return jsonify({'success': True, 'recordCount': record_count})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    
    # Handle multi-table join (bonus requirement)
    elif source_type == 'clickhouse_join' and target_type == 'flatfile':
        host = request.json.get('sourceConfig', {}).get('host')
        port = request.json.get('sourceConfig', {}).get('port')
        database = request.json.get('sourceConfig', {}).get('database')
        user = request.json.get('sourceConfig', {}).get('user')
        jwt_token = request.json.get('sourceConfig', {}).get('jwtToken')
        tables = request.json.get('sourceConfig', {}).get('tables', [])
        join_conditions = request.json.get('sourceConfig', {}).get('joinConditions', [])
        
        file_path = request.json.get('targetConfig', {}).get('filePath')
        delimiter = request.json.get('targetConfig', {}).get('delimiter')
        
        try:
            record_count = clickhouse.export_join_to_flatfile(
                host, port, database, user, jwt_token,
                tables, join_conditions, selected_columns, file_path, delimiter
            )
            return jsonify({'success': True, 'recordCount': record_count})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
            
    return jsonify({'success': False, 'error': 'Invalid source/target combination'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)