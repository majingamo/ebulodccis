// Test endpoint to verify Vercel serverless functions work
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    success: true,
    message: 'API endpoint is working!',
    method: req.method,
    body: req.body,
    query: req.query
  });
};

