var Sequelize = require("sequelize");
const { Op } = require("sequelize");
var google = require('googleapis');
var youtube = new google.youtube_v3.Youtube({ version: 'v3', auth: "AIzaSyDhA8P1xYbTfDioA1nta3l5jUCNrlOREWI" });


const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db/database.sqlite'
});


// authenticate with the database
sequelize
    .authenticate()
    .then(function (err) {
        console.log("Connection established.");
        Video = sequelize.define("videos", {
            description: {
                type: Sequelize.TEXT
            },
            Id: {
                type: Sequelize.STRING,
                primaryKey: true,
            },
            title: {
                type: Sequelize.TEXT
            },
            url: {
                type: Sequelize.TEXT
            },
            thumbnail_url: {
                type: Sequelize.TEXT
            },
            published_at: {
                type: Sequelize.DATE
            }
        }, {
            indexes: [
                // Create a unique index on email
                {
                    unique: true,
                    fields: ['Id']
                }
            ]
        });
        Video.sync();
    })
    .catch(function (err) {
        console.log("Unable to connect to database: ", err);
    });

module.exports = {
    getVideos(req, res) {
        Video.findAll({ order: [['published_at', 'DESC']] }).then(function (videos) {
            res.send(videos);
        })
    },
    searchVideos(req,res){
        const query = req.query.query
        Video.findAll({
            where: {
              [Op.or]: [
                { title: {[Op.substring]:query}},
                { description: {[Op.substring]:query}}
              ]
            }
          }).then(videos=>res.send(videos));
    },
    syncVideos(req, res) {
        setInterval(() => {
            youtube.search.list({
                part: 'snippet',
                q: 'hackerearth',
                order: 'date',
                type: 'video'

            }, async function (err, data) {
                if (err) {
                    console.error('Error: ' + err);
                }
                if (data) {
                    let items = data['data']['items'];
                    let allVideos = []
                    for (let i = 0; i < items.length; i++) {
                        let Id = items[i].id.videoId
                        let snippet = items[i].snippet
                        const new_video = await Video.findByPk(Id);
                        if (new_video == null) {
                            allVideos.push({
                                title: snippet.title,
                                description: snippet.description,
                                Id: Id,
                                thumbnail_url: snippet.thumbnails.default.url,
                                published_at: snippet.publishedAt
                            })
                        }
                    }
                    for (let i = 0; i < allVideos.length; i++) {
                        Video.create(allVideos[i]);
                    }
                    // res.send(`successfully synced ${allVideos.length} videos`);
                }
            });
        }, 5000)
    },
};