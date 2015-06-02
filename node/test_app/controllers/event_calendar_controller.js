var ec = require("../../lib/event_calendar");

exports.list = function list(req, res) {
  var from = req.params.from;
  var to = req.params.to;
  ec.listEvents(from, to, function(err, result){
    if(err) {
      console.log(err);
      res.send([]);
      return;
    }
    res.send(result);
  });
};