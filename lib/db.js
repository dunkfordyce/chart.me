module.exports = new (require('promise'))(function(resolve, reject) { 
    require('mongodb').MongoClient.connect('mongodb://127.0.0.1:27017/chartme', function(err, database) {
        if(err) { reject(err); }
        else { resolve(database); }
    });
});


