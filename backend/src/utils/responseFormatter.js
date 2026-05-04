function success(res, data = {}, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }
  
  function fail(res, message = "Request failed", statusCode = 400, details = null) {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        details,
      },
    });
  }
  
  module.exports = {
    success,
    fail,
  };