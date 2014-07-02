var Promise = require('promise'),
    ObjectID = require('mongodb').ObjectID,
    _ = require('underscore'),
    db = require('./db');

var charts = new Promise(function(resolve, reject) {
    db.then(function(db) { 
        resolve(db.collection('charts'), db);    
    }, reject);
});

exports.get = function(id) { 
    return new Promise(function(resolve, reject) { 
        if( !(id instanceof ObjectID) ) { 
            try { 
                id = new ObjectID(id);
            } catch(e) { 
                console.log('invalid gid', id);
                return reject(e);
            }
        }

        charts.then(function(charts) { 
            charts.findOne({_id: id}, function(err, chart) { 
                if( err || chart == null ) { reject(err); } 
                else { 
                    resolve(chart);
                }
            });
        }, reject);    
    });
};

exports.create = function(options) { 
    options = _.defaults(options, {
        size: 100000,
        max: 10000
    });

    return new Promise(function(resolve, reject) { 
        charts.then(function(charts) { 
            try { 
                charts.insert(_.extend(options, {
                    created: new Date()
                }), function(err, docs) {
                    if( err ) { return reject(err); }
                    var chart = docs[0];
                    db.then(function(db) { 
                        db.createCollection('chart-'+chart._id, {
                            capped: true, 
                            size: options.size, 
                            max: options.max
                        }, function(err, collection) {
                            if( err ) { 
                                reject(err);
                            } else { 
                                resolve(chart);
                            }
                        });
                    });
                });
            } catch(e) { 
                reject(e);
            }
        }, reject);
    });
};

exports.collection = function(chart) { 
    return db.then(function(db) { 
        return db.collection('chart-'+chart._id);
    });
};

exports.collection_insert = function(chart, collection, v, data) { 
    return new Promise(function(resolve, reject) { 
        try { 
            collection.insert({
                _chart_id: chart._id,
                _date: new Date(),
                v: v,
                data: data
            }, {}, function(err, objects) { 
                if( err ) { reject(err); }
                else { resolve(objects); }     
            });
        } catch(e) { 
            reject(e);
        }
    });
};
