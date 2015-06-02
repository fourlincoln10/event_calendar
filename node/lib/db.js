var _ = require("underscore"),
    nano = require("nano")({"url": "http://localhost:5984"}),
    dbName = "events",
    db = nano.use(dbName);

/**
 * Query a view
 * @param  {Object}   options View options
 * @param  {Function} callback Function that will be called called back
 */
exports.queryView = function queryView(options, callback) {
  var msg;
  if(!options.designDoc) {
    msg = "Design doc not passed to function";
    return callback(new appError.badRequest(msg));
  }
  if(!options.view) {
    msg = "View not passed to function";
    return callback(new appError.badRequest(msg));
  }

  var viewOptions = _.extend({include_docs: true}, _.omit(options, "designDoc", "view"));

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

exports.listEvents = function listEvents(from, to, callback) {
  var evts = {repeating: [], nonRepeating: []};
  var options = {
    designDoc: "events",
    view: "nonrepeatingByDtstart",
    startkey: from,
    endkey: to
  };
  console.log("db.listEvents() options: ", options);
  module.exports.queryView(options, function(err, rows) {
    if(err) return callback(err);
    evts.nonRepeating = rows.map(function(row){return row.doc;});
    addRepeatingEvents();
  });

  function addRepeatingEvents() {
    options = {
      designDoc: "events",
      view: "repeatingByDtstart",
      endkey: to
    };
    module.exports.queryView(options, function(err, rows) {
      if(err) return err;
      rows.forEach(function(row){
        evts.repeating.push(row.doc);
      });
      return callback(null, evts);
    });
  }
};

exports.getEvent = function getEventByUid(uid, callback) {
  var options = {
    designDoc: "events",
    view: "byUid",
    key: uid
  };
  module.exports.queryView(options, function(err, doc) {
    return err ? callback(err) : callback(null, doc);
  });
};

exports.updateEvent = function updateEvent(uid, evt, callback) {
  var options = {
    designDoc: "events",
    view: "byUid",
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