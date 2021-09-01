var express = require('express');
var router = express.Router();
const VideosController = require("../controller").VideosController;

router.get('/', VideosController.getVideos);
router.get('/sync', VideosController.syncVideos);
router.get('/search', VideosController.searchVideos);

module.exports = router;
