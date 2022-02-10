exports.port = (process.env.CDS_PORT || 8080);
exports.data = (process.env.CDS_DATA_DIR || 'data');
exports.production = (process.env.NODE_ENV || 'production') != 'development';