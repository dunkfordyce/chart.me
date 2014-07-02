var express = require('express'),
    _ = require('underscore'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    fs = require('fs'),
    app = express();

require('./lib/db').then(function() { 
    app.listen(3000);
    console.log('Listening on port 3000');
});

var bundle = (browserify('./client/index.js')
        .transform(require('stylify'))
        .transform(require('cssify'))
        .transform(require('browserify-compile-templates'))
        .require('d3')
    );

function write_bundle(err, src) { 
    console.log('writing bundle...');
    if( err ) { 
        console.error(err);
    }
    fs.writeFileSync('./public/index.js', src);
    console.log('done writing bundle');
}

var w = watchify(bundle);
w.on('update', function () {
    w.bundle(write_bundle);
});

bundle.bundle({}, write_bundle);


function underscore_renderer() { 
    var compileds = {};
    return function(path, options, cb) { 
        var compiled = compileds[path] || (compileds[path] = _.template(fs.readFileSync(path).toString())),
            html = compiled(options);
        cb(null, compiled(options))
    };
}
app.engine('.html', underscore_renderer());

app.use(express.static('public'));
app.use(require('cookie-parser')());
app.use(require('body-parser')());
app.use(require('express-session')({ secret: 'keyboard cat' }));


function is_ajax(f) { 
    return function(req, res, next) { 
        if( req.xhr ) { 
            return f(req, res, next);
        } else { 
            next();
        }
    }
}

function isnt_ajax(f) { 
    return function(req, res, next) { 
        if( !req.xhr ) { 
            return f(req, res, next);
        } else { 
            next();
        }
    }
}

function chart_collection_loader(req, res, next) { 
    require('./lib/chart').collection(req.chartme.chart).then(function(collection) { 
        req.chartme.collection = collection;
        next();
    }, function(err) { 
        throw err;
    });
}

function collection_insert(req, res, params) { 
    var v = params.v;

    if( !v ) { 
        res.send(500, 'no v value');
        return;
    }

    v = parseFloat(v);

    if( !_.isNumber(v) ) { 
        res.send(500, 'v should be a number');
        return;
    }

    require('./lib/chart').collection_insert(
        req.chartme.chart,
        req.chartme.collection,
        v
    ).then(function(objects) {
        console.log('inserted');
        try { 
            if( req.headers.referer && req.headers.referer.split('//')[1].indexOf(req.headers.host) == 0 ) { 
                res.redirect(req.headers.referer);
            } else { 
                res.end('');
            }
        } catch(e) { 
            console.log(e);  
            throw e;
        }
    }, function(err) { 
        throw err;
    });
}

app.use('/c', express.Router()
    .use(function(req, res, next) { 
        req.chartme = {};
        next();
    })
    .param('id', function(req, res, next, id) {
        require('./lib/chart').get(id).then(function(chart) { 
            req.chartme.chart = chart;
            next();
        }, function(err) { 
            res.redirect('/c');
        });
    })
    .get('/', function(req, res) { 
        res.render('chart_create.html', {});
    })
    .post('/', function(req, res) { 
        require('./lib/chart').create({
            size: parseInt(req.body.size, 10),
            max: parseInt(req.body.max, 10)
        }).then(function(chart) { 
            res.redirect('/c/'+chart._id);
        }, function(err) { 
            throw err;
        });
    })
    .post('/:id', 
        chart_collection_loader,
        function(req, res) { return collection_insert(req, res, req.body); }
    )
    .get('/:id/insert', 
        chart_collection_loader,
        function(req, res) { return collection_insert(req, res, req.query); }
    )
    .get('/:id',
        is_ajax(function(req, res) { 
            res.json(req.chartme.chart);
        }),
        isnt_ajax(function(req, res) { 
            res.render('chart.html', {chart: req.chartme.chart});
        })
    )
    .get('/:id/data',
        chart_collection_loader,
        isnt_ajax(function(req, res) { 
            res.redirect('/c/'+req.chartme.graph._id);
        }),
        function(req, res) { 
            (req.chartme.collection
                .find({_chart_id: req.chartme.chart._id})
                .sort({_date: -1})
                .skip(req.query.offset || 0)
                .limit(req.query.limit || 100)
                .toArray(function(err, items) { 
                    res.json(items);
                })
            );
        }
    )
);


var net     = require('net'),
    carrier = require('carrier');

var server = net.createServer(function(conn) {
    var graph;
    carrier.carry(conn, function(line) {
        console.log('got one line: ' + line);
        if( !graph ) { 
            
        }
    });
    conn.on('error', function() { 
        console.log('ERROR', arguments);
    });
});
console.log('tcp on', 3001);
server.listen(3001);
