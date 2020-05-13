const express = require("express");
const app = express();
const router = express.Router();
const axios = require("axios");
const redis = require("redis");
const cors = require("cors");
const port = process.env.PORT || 3000;
const dotenv = require("dotenv");

dotenv.config();

const client = redis.createClient(process.env.REDIS_URL);

app.use(cors());

client.on("error", function (error) {
    console.error(error);
});

// router.get("/", (req, res) => {
// });

const url = `https://graph.facebook.com/${process.env.INSTAGRAM_ID}/media?fields=id,media_type,media_url,timestamp,caption&access_token=${process.env.ACCESS_TOKEN}`;

let checkURL = function (item) {
    let caption = item.caption;
    caption = caption.split(" ").forEach((part) => {
        let regex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        if (part.match(regex)) {
            item["url"] = part;
            return item;
        } else {
            console.log("no match");
        }
    });
}

app.get("/", async (req, res) => {
    client.get("completeData", async (err, reply) => {
        if (reply) {
            res.send(reply);
        } else {
            try{
                let result = await axios.get(url);
            // delete result.data.paging;
            let data = result.data.data;
            data = data.map(checkURL);

            client.set("completeData", JSON.stringify({
                    data: data
                }),
                "EX",
                7 * 60 * 60
            );
            return res.status(200).json({
                data: data
            });
            }catch(err){
                console.log(err);
                res.status(500).json({
                    error: err
                })
            }
        }
    })

});

app.listen(port, (req, res) => {
    console.log("Sever started");
});
