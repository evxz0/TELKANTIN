const app = require('./app');
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Order & Cart Service running on port ${PORT}`);
});
