var _ = require("underscore"),
    nano = require("nano")({"url": "http://localhost:5984"}),
    dbName = "intellassetbak",
    db = nano.use(dbName);

/**
 * Query a view
 * @param  {Object}   options View options
 * @param  {Function} callback Function that will be called called back
 */
exports.queryView = function queryView(options, callback) {
  var msg;
  if(!options.designDoc) {
    msg = 'Design doc not passed to function';
    return callback(new appError.badRequest(msg));
  }
  if(!options.view) {
    msg = 'View not passed to function';
    return callback(new appError.badRequest(msg));
  }

  var viewOptions = _.extend({include_docs: true}, _.omit(options, 'designDoc', 'view'));

  db.view(options.designDoc, options.view, viewOptions, function (err, res) {
    return err ? callback(err) : callback(null, res.rows);
  });
};

exports.createEvent = function createEvent(evt, callback) {
  // stub
};

exports.createDoc = function createDoc(obj, callback) {
  // stub
};

exports.updateDoc = function updateDoc(obj, callback) {
  // stub
};


exports.getEvent = function getEventByUid(uid, callback) {
  var options = {
    designDoc: 'calendarEvents',
    view: 'byUid',
    key: uid
  };
  module.exports.queryView(options, function(err, doc) {
    return err ? callback(err) : callback(null, doc);
  });
};

exports.updateEvent = function updateEvent(uid, evt, callback) {
  var options = {
    designDoc: 'calendarEvents',
    view: 'byUid',
    key: uid
  };
  module.exports.queryView(options, function(err, doc){
    if(err) return callback(err);
    if(!doc) {
      exports.createDoc({"vevents": evt}, function(err, doc){
        return err ? callback(err) : callback(null, evt);
      });
    }
    doc.vevents = evt;
    exports.updateDoc(doc, function(err, doc){
      return err ? callback(err) : callback(null, evt);
    });
  });
};

exports.deleteEvent = function deleteEvent(uid, callback) {
  module.exports.queryView(uid, function(err, doc){
    if(err) return callback(err);
    doc.deletedAt = +new Date();
    module.exports.updateDoc(doc, function(err, doc){
      return err ? callback(err) : callback(null, doc.vevents);
    });
  });
};