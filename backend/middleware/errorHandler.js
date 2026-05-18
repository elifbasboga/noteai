function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  console.error(error);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  });
}

module.exports = errorHandler;
