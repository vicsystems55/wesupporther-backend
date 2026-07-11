const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");


const app = express();


app.use(cors());

app.use(express.json());



app.use(
    "/api/auth",
    authRoutes
);



app.get("/",(req,res)=>{

    res.json({
        message:"We Support Her API Running"
    });

});

app.get("/api/health", (req, res) => {

    res.json({
        status: "ok",
        service: "We Support Her API",
        timestamp: new Date()
    });

});


module.exports = app;