const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

// eonsu-cb
// XbnoeovfJhgmRLOk

// eonsu-1:SJE6LQ5Ym2Si97l9

const mongoConnect = (callback) => {
  MongoClient.connect('mongodb+srv://eonsu-1:SJE6LQ5Ym2Si97l9@cluster0-iqzdk.mongodb.net/shop?retryWrites=true', { useNewUrlParser: true })
    .then(client => {
      console.log('Connected!');
      _db = client.db();
      callback();
    })
    .catch(err => {
      console.log(err)
      throw err; 
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No database found!';
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;