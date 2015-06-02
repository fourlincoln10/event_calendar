var eController = require("./controllers/event_calendar_controller");

exports.mapRoutes = function mapRoutes(app) {
  app.get("/", eController.list);
  //app.post("/", eController.create);
};