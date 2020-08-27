const util = require("util");
const multer = require("multer");
const {MongoClient, ObjectID} = require('mongodb');
const GridFsStorage = require("multer-gridfs-storage");
const debug = require('debug')("app:uploadthing");

var storage = new GridFsStorage({
    url: "mongodb://localhost:27017/Paughers",
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        debug(file); 
        const match = "image/jpeg";
        
        if (match !== file.mimetype) {
            throw "Profile pictures must be in jp(e)g format"
        }

        (async function delOldPic(){
            const url = 'mongodb://localhost:27017';
            const dbName = 'Paughers';
            let client;
            try {
                client = await MongoClient.connect(url);
                debug('Connected correctly to server');
                const db = client.db(dbName);
                const col = db.collection('profPics.files');
                const col2 = db.collection('profPics.chunks');

                const old = await col.find({filename: `${req.user.username}`}).toArray();
                console.log(old);
                if(old && old.length > 1) {
                    let index = 0;
                    for(let i = 0; i < old.length-1; i++) {
                        if(old[i].uploadDate > old[i+1]) {
                            index = i+1;
                        }
                    }
                    const resultsChunk = await col2.deleteOne({files_id: ObjectID(old[index]._id)});
                    const resultsFiles = await col.deleteOne({_id: ObjectID(old[index]._id)});
                }
            } catch (err) {
                debug(err.stack);
            }
            client.close();
        }());
        
        return {
            bucketName: "profPics",
            filename: `${req.user.username}`
        };
    }
});

var uploadFile = multer({ storage: storage }).single("pfpPic");
debug(storage);
var uploadFilesMiddleware = util.promisify(uploadFile);
module.exports = uploadFilesMiddleware;